import { useCallback } from 'react';
import {
  AlignmentType,
  Document,
  HeadingLevel,
  LevelFormat,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun
} from 'docx';
import type { DocumentModel, ParagraphModel, TableModel, TextRunModel } from './template-model';

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
    highlight: toHex(run.styles.background),
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
    )
  });

export const useWordExport = () => {
  return useCallback(async (model: DocumentModel) => {
    if (typeof document === 'undefined') {
      return;
    }
    const children = model.blocks.flatMap((block) => {
      if (block.type === 'paragraph') {
        return [buildParagraph(block)];
      }
      if (block.type === 'table') {
        return [buildTable(block)];
      }
      return [];
    });
    const numberingConfig = Array.from(
      model.blocks
        .filter((block): block is ParagraphModel => block.type === 'paragraph' && !!block.list)
        .reduce<Map<string, ParagraphModel['list']>>((acc, block) => {
          acc.set(block.list!.reference, block.list!);
          return acc;
        }, new Map())
    ).map(([reference, list]) => ({
      reference,
      levels: [
        {
          level: list.indent,
          format: list.type === 'bullet' ? LevelFormat.BULLET : LevelFormat.DECIMAL,
          text: list.type === 'bullet' ? '•' : '%1.',
          alignment: AlignmentType.LEFT
        }
      ]
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
