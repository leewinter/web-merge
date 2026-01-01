import React from 'react';
import Mustache from 'mustache';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';
import type {
  PlaceholderDefinition,
  PlaceholderKind,
  TemplateEditorProps,
  SectionInfo,
  PlaceholderRenderInfo
} from './template-types';
import type { TableCommand } from './TemplateEditorLayout';
import {
  PlaceholderControls,
  TableControls,
  SectionList,
  SectionEditorPanel,
  RenderedPreview
} from './TemplateEditorLayout';

const SECTION_WRAPPER_STYLE =
  'background:#fefce8;color:#92400e;border-radius:4px;padding:2px 6px;border:1px solid #fcd34d;display:inline-flex;';

const escapeAttribute = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

const generateSectionId = (() => {
  let id = 1;
  return () => `section-${id++}`;
})();

const placeholderSupportsSection = (placeholder: PlaceholderDefinition) =>
  placeholder.allowSection ?? (Boolean(placeholder.sectionContent) || placeholder.kind === 'section');

const buildInitialValues = (
  placeholders: PlaceholderDefinition[],
  overrides: Record<string, unknown> | undefined
) =>
  placeholders.reduce<Record<string, unknown>>((acc, placeholder) => {
    const fallback =
      overrides?.[placeholder.key] ?? placeholder.sampleValue ?? (placeholder.kind === 'section' ? true : '');
    acc[placeholder.key] = fallback;
    return acc;
  }, {});

const buildInitialModes = (placeholders: PlaceholderDefinition[]) =>
  placeholders.reduce<Record<string, PlaceholderKind>>((acc, placeholder) => {
    acc[placeholder.key] = placeholder.kind ?? 'value';
    return acc;
  }, {});

const formatSectionToken = (placeholder: PlaceholderDefinition, override?: string) => {
  const content = (override ?? placeholder.sectionContent ?? 'Conditional content here.').trim();
  return `{{#${placeholder.key}}}${content}{{/${placeholder.key}}}`;
};

const wrapSections = (template: string, placeholders: PlaceholderDefinition[]) => {
  const placeholderMap = placeholders.reduce<Record<string, string>>((map, placeholder) => {
    map[placeholder.key] = placeholder.label;
    return map;
  }, {});
  return template.replace(/{{#([a-zA-Z0-9_]+)}}([\s\S]*?){{\/\1}}/g, (match, key) => {
    if (!placeholderMap[key]) {
      return match;
    }
    const label = placeholderMap[key];
    return `<span data-section="${key}" data-label="${label}" data-section-id="${generateSectionId()}" data-content="${escapeAttribute(
      match
    )}" class="template-section" style="${SECTION_WRAPPER_STYLE}">${match}</span>`;
  });
};

const parsePlaceholderToken = (
  match: string,
  key: string,
  placeholderKeys: string[],
  placeholderMap: Record<string, string>
) => {
  if (!placeholderKeys.includes(key)) {
    return match;
  }

  const label = placeholderMap[key] ?? key;
  return `<span data-placeholder="${key}" data-label="${label}" class="template-placeholder">${match}</span>`;
};

const templateToEditorContent = (template: string, placeholders: PlaceholderDefinition[]) => {
  if (!template) {
    return '';
  }

  const placeholderMap = placeholders.reduce<Record<string, string>>((map, placeholder) => {
    map[placeholder.key] = placeholder.label;
    return map;
  }, {});
  const withSections = wrapSections(template, placeholders);
  const keys = placeholders.map((p) => p.key);
  return withSections.replace(/{{\s*([a-zA-Z0-9_]+)\s*}}/g, (match, key) =>
    parsePlaceholderToken(match, key, keys, placeholderMap)
  );
};

const stripHighlightSpans = (html: string) => {
  if (typeof window === 'undefined' || typeof window.DOMParser === 'undefined') {
    return html.replace(/<span[^>]+class="template-(placeholder|section)"[^>]*>/g, '').replace(/<\/span>/g, '');
  }

  const parser = new window.DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  doc
    .querySelectorAll('.template-placeholder, .template-section')
    .forEach((element) => {
      const fragment = document.createDocumentFragment();
      while (element.firstChild) {
        fragment.appendChild(element.firstChild);
      }
      element.replaceWith(fragment);
    });
  return doc.body.innerHTML;
};

const collectSectionsFromHtml = (html: string): SectionInfo[] => {
  if (typeof DOMParser === 'undefined') {
    return [];
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const sections: SectionInfo[] = [];
  doc.querySelectorAll('span[data-section-id]').forEach((element, index) => {
    sections.push({
      id: element.getAttribute('data-section-id') ?? `section-${index}`,
      key: element.getAttribute('data-section') ?? '',
      label: element.getAttribute('data-label') ?? '',
      content: element.getAttribute('data-content') ?? element.textContent ?? '',
      pos: index
    });
  });
  return sections;
};

const quillModules = {
  toolbar: [
    ['bold', 'italic', 'underline', 'strike'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['blockquote', 'code-block'],
    [{ header: [1, 2, 3, false] }]
  ],
  clipboard: {
    matchVisual: false
  }
};

const quillFormats = ['bold', 'italic', 'underline', 'strike', 'blockquote', 'list', 'bullet', 'header', 'code-block'];

const TemplateEditor: React.FC<TemplateEditorProps> = ({
  initialTemplate = '',
  initialValues,
  placeholders,
  onTemplateChange,
  onValuesChange
}) => {
  const [editorHtml, setEditorHtml] = React.useState(() => templateToEditorContent(initialTemplate, placeholders));
  const [previewTemplate, setPreviewTemplate] = React.useState(initialTemplate);
  const [values, setValues] = React.useState<Record<string, unknown>>(
    buildInitialValues(placeholders, initialValues)
  );
  const [placeholderModes, setPlaceholderModes] = React.useState<Record<string, PlaceholderKind>>(() =>
    buildInitialModes(placeholders)
  );
  const [sectionList, setSectionList] = React.useState<SectionInfo[]>([]);
  const [editingSectionId, setEditingSectionId] = React.useState<string | null>(null);
  const [editingSectionValue, setEditingSectionValue] = React.useState('');
  const editorContainerRef = React.useRef<HTMLDivElement | null>(null);
  const quillInstanceRef = React.useRef<Quill | null>(null);
  const initialEditorHtml = React.useRef(editorHtml);
  const getQuillInstance = React.useCallback(() => quillInstanceRef.current, []);

  const updatePreviewFromHtml = React.useCallback(
    (html: string) => {
      const bare = stripHighlightSpans(html);
      setPreviewTemplate(bare);
      onTemplateChange?.(bare);
    },
    [onTemplateChange]
  );

  const applyHtmlToEditor = React.useCallback(
    (html: string) => {
      const quill = getQuillInstance();
      if (!quill) {
        setEditorHtml(html);
        updatePreviewFromHtml(html);
        return;
      }
      const delta = quill.clipboard.convert({ html });
      quill.setContents(delta);
    },
    [getQuillInstance, updatePreviewFromHtml]
  );

  React.useEffect(() => {
    const container = editorContainerRef.current;
    if (!container) {
      return;
    }

    const quill = new Quill(container, {
      theme: 'snow',
      modules: quillModules,
      formats: quillFormats
    });
    quillInstanceRef.current = quill;

    const handleChange = () => {
      const html = quill.root.innerHTML;
      setEditorHtml(html);
      updatePreviewFromHtml(html);
    };

    quill.on('text-change', handleChange);
    applyHtmlToEditor(initialEditorHtml.current);

    return () => {
      quill.off('text-change', handleChange);
      quillInstanceRef.current = null;
    };
  }, [applyHtmlToEditor, updatePreviewFromHtml]);

  const syncEditorContent = React.useCallback(
    (preview: string) => {
      const content = templateToEditorContent(preview, placeholders);
      setEditorHtml(content);
      updatePreviewFromHtml(content);
      applyHtmlToEditor(content);
    },
    [placeholders, updatePreviewFromHtml, applyHtmlToEditor]
  );

  React.useEffect(() => {
    setValues(buildInitialValues(placeholders, initialValues));
    setPlaceholderModes(buildInitialModes(placeholders));
  }, [initialValues, placeholders]);

  React.useEffect(() => {
    syncEditorContent(initialTemplate);
  }, [initialTemplate, placeholders, syncEditorContent]);

  React.useEffect(() => {
    setSectionList(collectSectionsFromHtml(editorHtml));
  }, [editorHtml]);

  const startEditingSection = React.useCallback((id: string) => {
    setEditingSectionId(id);
  }, []);

  const cancelSectionEdit = React.useCallback(() => {
    setEditingSectionId(null);
    setEditingSectionValue('');
  }, []);

  const updateSectionContent = React.useCallback(
    (id: string, nextContent: string) => {
      if (typeof DOMParser === 'undefined') {
        return;
      }
      const parser = new DOMParser();
      const doc = parser.parseFromString(editorHtml, 'text/html');
      const element = doc.querySelector(`span[data-section-id="${id}"]`);
      if (!element) {
        return;
      }
      element.setAttribute('data-content', escapeAttribute(nextContent));
      element.innerHTML = nextContent;
      applyHtmlToEditor(doc.body.innerHTML);
    },
    [editorHtml, applyHtmlToEditor]
  );

  const saveSectionContent = React.useCallback(() => {
    if (!editingSectionId) {
      return;
    }
    updateSectionContent(editingSectionId, editingSectionValue);
    setEditingSectionId(null);
    setEditingSectionValue('');
  }, [editingSectionId, editingSectionValue, updateSectionContent]);

  React.useEffect(() => {
    if (!editingSectionId) {
      setEditingSectionValue('');
      return;
    }
    const section = sectionList.find((item) => item.id === editingSectionId);
    if (section) {
      setEditingSectionValue(section.content);
    }
  }, [editingSectionId, sectionList]);

  const renderedResult = React.useMemo(() => {
    try {
      return { html: Mustache.render(previewTemplate, values), isError: false };
    } catch (error) {
      return { html: `Rendering error: ${(error as Error).message}`, isError: true };
    }
  }, [previewTemplate, values]);

  const updateValue = (key: string, next: unknown) => {
    setValues((prev) => {
      const nextValues = { ...prev, [key]: next };
      onValuesChange?.(nextValues);
      return nextValues;
    });
  };

  const insertHtmlAtCursor = React.useCallback((htmlFragment: string) => {
    const quill = getQuillInstance();
    if (!quill) {
      return;
    }
    const selectionIndex = quill.getSelection()?.index ?? quill.getLength();
    quill.clipboard.dangerouslyPasteHTML(selectionIndex, htmlFragment);
    quill.setSelection(selectionIndex + 1);
  }, []);

  const insertToken = React.useCallback(
    (placeholder: PlaceholderDefinition, mode?: PlaceholderKind) => {
      const currentMode = mode ?? placeholderModes[placeholder.key] ?? placeholder.kind ?? 'value';
      const supportsSection = placeholderSupportsSection(placeholder);

      if (currentMode === 'section' && supportsSection) {
        const content = formatSectionToken(placeholder);
        const sectionHtml = `<span data-section="${placeholder.key}" data-label="${placeholder.label}" data-section-id="${generateSectionId()}" data-content="${escapeAttribute(
          content
        )}" class="template-section" style="${SECTION_WRAPPER_STYLE}">${content}</span>`;
        insertHtmlAtCursor(sectionHtml);
        return;
      }

      const placeholderHtml = `<span data-placeholder="${placeholder.key}" data-label="${placeholder.label}" class="template-placeholder">{{${placeholder.key}}}</span>`;
      insertHtmlAtCursor(placeholderHtml);
    },
    [insertHtmlAtCursor, placeholderModes]
  );

  const findClosestTable = React.useCallback((): HTMLTableElement | null => {
    const quill = getQuillInstance();
    if (!quill) {
      return null;
    }
    const selectionIndex = quill.getSelection()?.index ?? 0;
    const leaf = quill.getLeaf(selectionIndex)[0];
    const dom = (leaf && (leaf as { domNode?: Node }).domNode) as Element | null;
    const cell = dom?.closest('td,th');
    return (cell?.closest('table') ?? quill.root.querySelector('table')) as HTMLTableElement | null;
  }, [getQuillInstance]);

  const insertRowIntoTable = React.useCallback((table: HTMLTableElement) => {
    const quill = getQuillInstance();
    if (!quill) {
      return;
    }
    const selectionIndex = quill.getSelection()?.index ?? 0;
    const leaf = quill.getLeaf(selectionIndex)[0];
    const dom = (leaf && (leaf as { domNode?: Node }).domNode) as Element | null;
    const currentRow = dom?.closest('tr') as HTMLTableRowElement | null;
    const referenceRow = currentRow || (table.rows[table.rows.length - 1] as HTMLTableRowElement | undefined);
    if (!referenceRow) {
      return;
    }
    const newRow = referenceRow.cloneNode(true) as HTMLTableRowElement;
    newRow.querySelectorAll('td,th').forEach((cell) => {
      cell.innerHTML = '<br />';
    });
    referenceRow.parentNode?.insertBefore(newRow, referenceRow.nextSibling);
  }, [getQuillInstance]);

  const insertColumnIntoTable = React.useCallback((table: HTMLTableElement) => {
    Array.from(table.rows).forEach((row) => {
      const newCell = row.insertCell(-1);
      newCell.innerHTML = '<br />';
    });
  }, []);

  const execCommand = React.useCallback(
    (command: TableCommand) => {
      const quill = getQuillInstance();
      if (!quill) {
        return;
      }
      quill.focus();
      switch (command) {
        case 'insertTable': {
          const tableHtml = `
            <table style="width:100%;border-collapse:collapse;">
              <tr><td>Cell</td><td>Cell</td></tr>
              <tr><td>Cell</td><td>Cell</td></tr>
            </table>
          `;
          insertHtmlAtCursor(tableHtml);
          break;
        }
        case 'addRow': {
          const table = findClosestTable();
          if (table) {
            insertRowIntoTable(table);
            applyHtmlToEditor(quill.root.innerHTML);
          }
          break;
        }
        case 'addColumn': {
          const table = findClosestTable();
          if (table) {
            insertColumnIntoTable(table);
            applyHtmlToEditor(quill.root.innerHTML);
          }
          break;
        }
        case 'removeTable': {
          const table = findClosestTable();
          if (table) {
            table.remove();
            applyHtmlToEditor(quill.root.innerHTML);
          }
          break;
        }
        default:
          break;
      }
    },
    [applyHtmlToEditor, findClosestTable, insertColumnIntoTable, insertHtmlAtCursor, insertRowIntoTable, getQuillInstance]
  );

  const placeholderValues: PlaceholderRenderInfo[] = React.useMemo(
    () =>
      placeholders.map((placeholder) => ({
        ...placeholder,
        mode: placeholderModes[placeholder.key] ?? placeholder.kind ?? 'value',
        supportsSection: placeholderSupportsSection(placeholder)
      })),
    [placeholders, placeholderModes]
  );

  React.useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }

    if (!document.getElementById('template-editor-styles')) {
      const style = document.createElement('style');
      style.id = 'template-editor-styles';
      style.textContent = `
        .template-placeholder {
          background: #e0f2fe;
          color: #1e3a8a;
          border-radius: 4px;
          padding: 0 6px;
          font-weight: 600;
          box-shadow: inset 0 0 0 1px rgba(59, 130, 246, 0.4);
        }
        .template-section {
          background: #fefce8;
          color: #92400e;
          border-radius: 4px;
          padding: 2px 6px;
          border: 1px solid #fcd34d;
          display: inline-flex;
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  const togglePlaceholderMode = (placeholder: PlaceholderDefinition) => {
    setPlaceholderModes((prev) => {
      const nextMode = prev[placeholder.key] === 'section' ? 'value' : 'section';
      if (nextMode === 'section') {
        const currentValue = values[placeholder.key];
        updateValue(placeholder.key, Boolean(String(currentValue ?? '')));
      }
      return { ...prev, [placeholder.key]: nextMode };
    });
  };

  const activeSection = sectionList.find((section) => section.id === editingSectionId);
  const editingSectionLabel = activeSection?.label ?? editingSectionId ?? '';

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <section
        style={{
          border: '1px solid #e5e7eb',
          borderRadius: 6,
          padding: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          background: '#fff'
        }}
      >
        <h2 style={{ marginTop: 0 }}>Template</h2>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 16
          }}
        >
          <PlaceholderControls
            placeholders={placeholderValues}
            onToggleMode={togglePlaceholderMode}
            onInsert={insertToken}
          />
          <div
            style={{
              padding: 12,
              borderRadius: 6,
              border: '1px solid #e5e7eb',
              background: '#f8fafc',
              display: 'flex',
              flexDirection: 'column',
              gap: 8
            }}
          >
            <strong style={{ fontSize: 14 }}>Table controls</strong>
            <TableControls onCommand={execCommand} />
          </div>
          {sectionList.length > 0 && <SectionList sections={sectionList} onEdit={startEditingSection} />}
        </div>
        <div
          ref={editorContainerRef}
          style={{
            width: '100%',
            minHeight: 240,
            borderRadius: 4,
            border: '1px solid #cbd5f5',
            background: '#fff',
            fontFamily: 'Inter, sans-serif',
            marginTop: 8,
            marginBottom: 0,
            position: 'relative',
            zIndex: 0
          }}
        />
      </section>

      <section style={{ border: '1px solid #e5e7eb', borderRadius: 6, padding: 16, background: '#fff' }}>
        <h3 style={{ marginTop: 0 }}>Rendered preview</h3>
        <RenderedPreview renderedResult={renderedResult} />
        {editingSectionId && (
          <SectionEditorPanel
            label={editingSectionLabel}
            value={editingSectionValue}
            onChange={setEditingSectionValue}
            onSave={saveSectionContent}
            onCancel={cancelSectionEdit}
          />
        )}
      </section>
    </div>
  );
};

export default TemplateEditor;
