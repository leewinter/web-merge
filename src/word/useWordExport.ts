import { useCallback } from 'react';
import { Document, Packer, Paragraph, TextRun } from 'docx';

const inlineFormatting = (tag: string, formatting: { bold?: boolean; italics?: boolean }) => {
  const next = { ...formatting };
  switch (tag) {
    case 'STRONG':
    case 'B':
    case 'H1':
    case 'H2':
    case 'H3':
    case 'H4':
    case 'TH':
      next.bold = true;
      break;
    case 'EM':
    case 'I':
    case 'CITE':
      next.italics = true;
      break;
    default:
      break;
  }
  return next;
};

const buildTextRuns = (
  node: ChildNode,
  formatting: { bold?: boolean; italics?: boolean } = {}
): TextRun[] => {
  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.textContent?.replace(/\s+/g, ' ') ?? '';
    if (!text.trim()) {
      return [];
    }
    return [new TextRun({ text, bold: formatting.bold, italics: formatting.italics })];
  }

  if (node.nodeType !== Node.ELEMENT_NODE) {
    return [];
  }

  const element = node as Element;
  if (element.tagName === 'BR') {
    return [new TextRun({ text: '\n', bold: formatting.bold, italics: formatting.italics })];
  }

  const nextFormatting = inlineFormatting(element.tagName, formatting);
  return Array.from(element.childNodes).flatMap((child) => buildTextRuns(child, nextFormatting));
};

const tableToParagraphs = (table: Element): Paragraph[] => {
  const rows = Array.from(table.querySelectorAll('tr'));
  if (!rows.length) {
    return [];
  }
  return rows.flatMap((row) => {
    const cells = Array.from(row.children).map((cell) => (cell.textContent ?? '').trim());
    const text = cells.join('\t');
    if (!text) {
      return [];
    }
    return [
      new Paragraph({
        children: [new TextRun({ text })]
      })
    ];
  });
};

const parseHtmlToParagraphs = (html: string): Paragraph[] => {
  if (typeof DOMParser === 'undefined') {
    return [new Paragraph(html)];
  }
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const children = Array.from(doc.body.childNodes);
  const paragraphs: Paragraph[] = [];

  children.forEach((child) => {
    if (child.nodeType === Node.ELEMENT_NODE && (child as Element).tagName === 'TABLE') {
      paragraphs.push(...tableToParagraphs(child as Element));
      return;
    }
    const runs = buildTextRuns(child);
    if (runs.length) {
      paragraphs.push(
        new Paragraph({
          children: runs
        })
      );
    }
  });

  if (!paragraphs.length) {
    paragraphs.push(new Paragraph(''));
  }

  return paragraphs;
};

export const useWordExport = () => {
  return useCallback(async (html: string) => {
    if (typeof document === 'undefined') {
      return;
    }
    const paragraphs = parseHtmlToParagraphs(html);
    const doc = new Document({
      sections: [{ children: paragraphs }]
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
