import { useCallback } from 'react';
import {
  AlignmentType,
  Document,
  HeadingLevel,
  ImageRun,
  LevelFormat,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableLayoutType,
  TableRow,
  TextRun,
  WidthType
} from 'docx';
import type { DocumentModel, ListMetadata, ParagraphModel, TableModel, TextRunModel } from './template-model';

const alignmentMap: Record<ParagraphModel['align'] | undefined, AlignmentType | undefined> = {
  left: AlignmentType.LEFT,
  center: AlignmentType.CENTER,
  right: AlignmentType.RIGHT,
  justify: AlignmentType.JUSTIFIED,
  undefined: undefined
};

const headingMap: Record<number, HeadingLevel> = {
  1: HeadingLevel.HEADING_1,
  2: HeadingLevel.HEADING_2,
  3: HeadingLevel.HEADING_3,
  4: HeadingLevel.HEADING_4,
  5: HeadingLevel.HEADING_5,
  6: HeadingLevel.HEADING_6
};

const toHex = (value: string | undefined): string | undefined => {
  if (!value) {
    return undefined;
  }
  const trimmed = value.trim().toLowerCase();
  if (trimmed.startsWith('#')) {
    const hex = trimmed.slice(1);
    if (hex.length === 3) {
      return (
        hex[0] +
        hex[0] +
        hex[1] +
        hex[1] +
        hex[2] +
        hex[2]
      ).toUpperCase();
    }
    if (hex.length === 6) {
      return hex.toUpperCase();
    }
    return undefined;
  }
  const rgb = trimmed.match(/rgba?\((\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3})/);
  if (rgb) {
    const r = Number(rgb[1]);
    const g = Number(rgb[2]);
    const b = Number(rgb[3]);
    if ([r, g, b].every((n) => n >= 0 && n <= 255)) {
      return [r, g, b]
        .map((n) => n.toString(16).padStart(2, '0'))
        .join('')
        .toUpperCase();
    }
  }
  return undefined;
};

const normalizeSize = (value: string | undefined): number | undefined => {
  if (!value) {
    return undefined;
  }
  const numeric = Number(value.replace(/[^\d.]/g, ''));
  if (Number.isNaN(numeric)) {
    return undefined;
  }
  return Math.round(numeric * 0.5);
};

const mapRun = (run: TextRunModel): TextRun =>
  new TextRun({
    text: run.text,
    bold: run.styles.bold,
    italics: run.styles.italics,
    font: run.styles.font,
    size: normalizeSize(run.styles.size),
    color: toHex(run.styles.color),
    // Docx highlight only supports named colors; skip hex values to avoid invalid XML.
    verticalAlign: run.styles.script === 'super' ? 'superscript' : run.styles.script === 'sub' ? 'subscript' : undefined
  });

const buildParagraph = (model: ParagraphModel): Paragraph => {
  const runs = model.runs.length ? model.runs.map(mapRun) : [new TextRun({ text: '' })];
  const paragraphConfig: Parameters<typeof Paragraph>[0] = {
    children: runs,
    alignment: alignmentMap[model.align],
    heading: model.heading ? headingMap[model.heading] : undefined
  };
  if (model.list) {
    paragraphConfig.numbering = {
      reference: model.list.reference,
      level: model.list.indent,
      ...(model.list.start ? { start: model.list.start } : {})
    };
  }
  return new Paragraph(paragraphConfig);
};

const buildTable = (model: TableModel): Table =>
  new Table({
    rows: model.rows.map((row) =>
      new TableRow({
        children: row.cells.map(
          (cell) =>
            new TableCell({
              children: cell.blocks.length ? cell.blocks.map(buildParagraph) : [new Paragraph('')]
            })
        )
      })
    ),
    width: {
      size: 100,
      type: WidthType.PERCENTAGE
    },
    layout: TableLayoutType.FIXED
  });

const decodeBase64Image = (dataUrl: string): Uint8Array | null => {
  const match = dataUrl.match(/^data:.*;base64,(.*)$/);
  if (!match) {
    return null;
  }
  const base64 = match[1];
  const binary = atob(base64);
  const array = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    array[i] = binary.charCodeAt(i);
  }
  return array;
};

const fetchImageData = async (src: string): Promise<Uint8Array | null> => {
  if (!src) {
    return null;
  }
  const data = decodeBase64Image(src);
  if (data) {
    return data;
  }
  try {
    const response = await fetch(src);
    if (!response.ok) {
      return null;
    }
    const buffer = await response.arrayBuffer();
    return new Uint8Array(buffer);
  } catch {
    return null;
  }
};

const buildImageParagraph = async (model: ImageModel): Promise<Paragraph | null> => {
  const data = await fetchImageData(model.src);
  if (!data) {
    return null;
  }
  const width = model.width ?? 480;
  const height = model.height ?? Math.round(width * 0.75);
  return new Paragraph({
    children: [
      new ImageRun({
        data,
        transformation: {
          width,
          height
        }
      })
    ]
  });
};

export const useWordExport = () => {
  return useCallback(async (model: DocumentModel) => {
    if (typeof document === 'undefined') {
      return;
    }
    const children: Array<Paragraph | Table> = [];
    for (const block of model.blocks) {
      if (block.type === 'paragraph') {
        children.push(buildParagraph(block));
        continue;
      }
      if (block.type === 'table') {
        children.push(buildTable(block));
        continue;
      }
      if (block.type === 'image') {
        const imageParagraph = await buildImageParagraph(block);
        if (imageParagraph) {
          children.push(imageParagraph);
        }
      }
    }
    const numberingMap = new Map<
      string,
      {
        type: ListMetadata['type'];
        levels: Map<number, { indent: number; type: ListMetadata['type']; start?: number }>;
      }
    >();
    model.blocks.forEach((block) => {
      if (block.type !== 'paragraph' || !block.list) {
        return;
      }
      const existing = numberingMap.get(block.list.reference);
      const levels = existing?.levels ?? new Map();
      if (!levels.has(block.list.indent)) {
        levels.set(block.list.indent, {
          indent: block.list.indent,
          type: block.list.type,
          start: block.list.start
        });
      }
      numberingMap.set(block.list.reference, {
        type: block.list.type,
        levels
      });
    });
    const numberingConfig = Array.from(numberingMap.entries()).map(([reference, entry]) => ({
      reference,
      levels: Array.from(entry.levels.values())
        .sort((a, b) => a.indent - b.indent)
        .map((level) => ({
          level: level.indent,
          format: level.type === 'bullet' ? LevelFormat.BULLET : LevelFormat.DECIMAL,
          text: level.type === 'bullet' ? '•' : '%1.',
          alignment: AlignmentType.LEFT,
          ...(level.start ? { start: level.start } : {})
        }))
    }));
    const doc = new Document({
      sections: [{ children }],
      numbering: {
        config: numberingConfig
      }
    });
    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'template.docx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, []);
};
