export type InlineStyles = {
  bold?: boolean;
  italics?: boolean;
  color?: string;
  background?: string;
  font?: string;
  size?: string;
  script?: 'super' | 'sub';
};

export interface TextRunModel {
  text: string;
  styles: InlineStyles;
}

export interface ListMetadata {
  type: 'ordered' | 'bullet';
  indent: number;
  reference: string;
  start?: number;
}

export interface ParagraphModel {
  type: 'paragraph';
  runs: TextRunModel[];
  align?: 'left' | 'center' | 'right' | 'justify';
  heading?: number;
  list?: ListMetadata;
}

export interface TableCellModel {
  blocks: ParagraphModel[];
  colspan?: number;
  rowspan?: number;
}

export interface TableRowModel {
  cells: TableCellModel[];
}

export interface TableModel {
  type: 'table';
  rows: TableRowModel[];
}

export interface ImageModel {
  type: 'image';
  src: string;
  alt?: string;
  width?: number;
  height?: number;
  align?: ParagraphModel['align'];
}

export type DocumentBlock = ParagraphModel | TableModel | ImageModel;

export interface DocumentModel {
  blocks: DocumentBlock[];
}

const HEADER_TAGS: Record<string, number> = {
  H1: 1,
  H2: 2,
  H3: 3,
  H4: 4,
  H5: 5,
  H6: 6
};

const parseStyleAttribute = (value: string | null): Record<string, string> => {
  if (!value) {
    return {};
  }
  return value
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => part.split(':').map((segment) => segment.trim()))
    .reduce<Record<string, string>>((acc, [key, val]) => {
      if (key && val) {
        acc[key.toLowerCase()] = val;
      }
      return acc;
    }, {});
};

const mergeStyles = (element: Element, parent: InlineStyles = {}): InlineStyles => {
  const next: InlineStyles = { ...parent };
  if (['STRONG', 'B'].includes(element.tagName)) {
    next.bold = true;
  }
  if (['EM', 'I', 'CITE'].includes(element.tagName)) {
    next.italics = true;
  }
  if (element.tagName === 'SUP') {
    next.script = 'super';
  }
  if (element.tagName === 'SUB') {
    next.script = 'sub';
  }
  const styles = parseStyleAttribute(element.getAttribute('style'));
  if (styles['color']) {
    next.color = styles['color'];
  }
  if (styles['background'] || styles['background-color']) {
    next.background = styles['background'] ?? styles['background-color'];
  }
  if (styles['font-family']) {
    next.font = styles['font-family'];
  }
  if (styles['font-size']) {
    next.size = styles['font-size'];
  }
  const face = (element as HTMLFontElement).face;
  if (face) {
    next.font = face;
  }
  if ((element as HTMLFontElement).size) {
    next.size = (element as HTMLFontElement).size.toString();
  }
  return next;
};

const collectTextRuns = (node: ChildNode, styles: InlineStyles = {}): TextRunModel[] => {
  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.textContent?.replace(/\s+/g, ' ') ?? '';
    if (!text.trim()) {
      return [];
    }
    return [{ text, styles }];
  }

  if (node.nodeType !== Node.ELEMENT_NODE) {
    return [];
  }

  const element = node as Element;
  const nextStyles = mergeStyles(element, styles);
  return Array.from(element.childNodes).flatMap((child) => collectTextRuns(child, nextStyles));
};

const deriveAlignFromElement = (element: Element | null): ParagraphModel['align'] | undefined => {
  if (!element) {
    return undefined;
  }
  const alignAttr = element.getAttribute('align')?.toLowerCase();
  if (alignAttr === 'left' || alignAttr === 'center' || alignAttr === 'right' || alignAttr === 'justify') {
    return alignAttr as ParagraphModel['align'];
  }
  const styles = parseStyleAttribute(element.getAttribute('style'));
  if (styles['text-align']) {
    const value = styles['text-align'].toLowerCase();
    if (['left', 'center', 'right', 'justify'].includes(value)) {
      return value as ParagraphModel['align'];
    }
  }
  const match = Array.from(element.classList).find((cls) => cls.startsWith('ql-align-'));
  if (match) {
    const value = match.replace('ql-align-', '');
    if (['left', 'center', 'right', 'justify'].includes(value)) {
      return value as ParagraphModel['align'];
    }
  }
  return undefined;
};

const buildParagraph = (element: Element, list?: ListMetadata): ParagraphModel => {
  const runs = collectTextRuns(element);
  const align = deriveAlignFromElement(element);
  const heading = HEADER_TAGS[element.tagName] ?? undefined;
  return {
    type: 'paragraph',
    runs,
    align: align ?? undefined,
    heading,
    list
  };
};

const parseTable = (table: Element): TableModel => {
  const rows = Array.from(table.querySelectorAll('tr')).map((row) => ({
    cells: Array.from(row.children).map((cell) => ({
      blocks: Array.from(cell.childNodes)
        .map((child) => {
          if (child.nodeType === Node.ELEMENT_NODE) {
            return buildParagraph(child as Element);
          }
          if (child.nodeType === Node.TEXT_NODE && child.textContent?.trim()) {
            const text = child.textContent.trim();
            return {
              type: 'paragraph',
              runs: [{ text, styles: {} }]
            };
          }
          return null;
        })
        .filter((paragraph): paragraph is ParagraphModel => paragraph !== null)
    }))
  }));
  return { type: 'table', rows };
};

const createListReference = (type: 'ordered' | 'bullet', counters: Record<'ordered' | 'bullet', number>) => {
  const listTypeName = type === 'ordered' ? 'decimal' : 'bullet';
  return `${listTypeName}-${counters[type]++}`;
};

const parseList = (element: Element, type: 'ordered' | 'bullet', reference: string): ParagraphModel[] => {
  const items = Array.from(element.children).filter((child) => child.tagName === 'LI');
  return items.map((li, index) =>
    buildParagraph(li as Element, {
      type,
      indent: 0,
      reference,
      start: index === 0 ? 1 : undefined
    })
  );
};

const parseDataList = (
  element: Element,
  type: 'ordered' | 'bullet',
  indent: number,
  reference: string,
  start: number | undefined
): ParagraphModel => buildParagraph(element, { type, indent, reference, start });

export const parseDocumentModel = (html: string): DocumentModel => {
  if (typeof DOMParser === 'undefined') {
    return { blocks: [] };
  }
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const blocks: DocumentBlock[] = [];

  const listCounters: Record<'ordered' | 'bullet', number> = {
    ordered: 0,
    bullet: 0
  };
  let listState: { type: 'ordered' | 'bullet'; reference: string; indent: number; started: boolean } | null =
    null;

  const ensureListState = (type: 'ordered' | 'bullet', indent: number) => {
    if (!listState || listState.type !== type || listState.indent !== indent) {
      listState = {
        type,
        indent,
        reference: createListReference(type, listCounters),
        started: false
      };
    }
    return listState;
  };

  const flushListState = () => {
    listState = null;
  };

  const processNode = (node: ChildNode) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent?.trim();
      if (text) {
        flushListState();
        blocks.push({
          type: 'paragraph',
          runs: [{ text, styles: {} }]
        });
      }
      return;
    }

    if (node.nodeType !== Node.ELEMENT_NODE) {
      return;
    }

    const element = node as Element;
    if (element.tagName === 'TABLE') {
      flushListState();
      blocks.push(parseTable(element));
      return;
    }

    if (element.tagName === 'IMG') {
      flushListState();
      const align =
        deriveAlignFromElement(element) ??
        deriveAlignFromElement(element.parentElement) ??
        undefined;
      blocks.push({
        type: 'image',
        src: element.getAttribute('src') ?? '',
        alt: element.getAttribute('alt') ?? undefined,
        width: element.hasAttribute('width') ? Number(element.getAttribute('width')) : undefined,
        height: element.hasAttribute('height') ? Number(element.getAttribute('height')) : undefined,
        align
      });
      return;
    }

    if (element.tagName === 'OL' || element.tagName === 'UL') {
      element.childNodes.forEach(processNode);
      flushListState();
      return;
    }

    if (element.tagName === 'LI' && element.getAttribute('data-list')) {
      const type = element.getAttribute('data-list') === 'ordered' ? 'ordered' : 'bullet';
      const indent = Number(element.getAttribute('data-indent') ?? '0');
      const state = ensureListState(type, indent);
      const start = state.started ? undefined : 1;
      state.started = true;
      blocks.push(parseDataList(element, type, indent, state.reference, start));
      return;
    }

    flushListState();
    const paragraph = buildParagraph(element);
    if (paragraph.runs.length) {
      blocks.push(paragraph);
      return;
    }

    element.childNodes.forEach(processNode);
  };

  doc.body.childNodes.forEach(processNode);

  return { blocks };
};
