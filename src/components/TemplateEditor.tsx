import React from 'react';
import Mustache from 'mustache';
import { Node } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { useEditor, EditorContent } from '@tiptap/react';
import type {
  PlaceholderDefinition,
  PlaceholderKind,
  TemplateEditorProps,
  SectionInfo,
  PlaceholderRenderInfo
} from './template-types';
import {
  TemplateToolbar,
  PlaceholderControls,
  SectionList,
  SectionEditorPanel,
  RenderedPreview
} from './TemplateEditorLayout';

const PlaceholderNode = Node.create({
  name: 'placeholder',
  inline: true,
  group: 'inline',
  atom: true,
  addAttributes() {
    return {
      key: { default: '' },
      label: { default: '' }
    };
  },
  parseHTML() {
    return [
      {
        tag: 'span[data-placeholder]',
        getAttrs: (dom) => {
          if (!(dom instanceof HTMLElement)) {
            return {};
          }
          return {
            key: dom.getAttribute('data-placeholder') ?? '',
            label: dom.getAttribute('data-label') ?? dom.textContent ?? ''
          };
        }
      }
    ];
  },
  renderHTML({ node }) {
    return [
      'span',
      {
        'data-placeholder': node.attrs.key,
        class: 'template-placeholder',
        style:
          'background:#e0f2fe;color:#1e3a8a;border-radius:4px;padding:0 6px;font-weight:600;box-shadow:inset 0 0 0 1px rgba(59,130,246,0.4);'
      },
      `{{${node.attrs.key}}}`
    ];
  }
});

const SECTION_WRAPPER_STYLE =
  'background:#fefce8;color:#92400e;border-radius:4px;padding:2px 6px;border:1px solid #fcd34d;display:inline-flex;';

const SectionNode = Node.create({
  name: 'section',
  inline: true,
  group: 'inline',
  atom: true,
  addAttributes() {
    return {
      key: { default: '' },
      label: { default: '' },
      content: { default: '' },
      id: { default: '' }
    };
  },
  parseHTML() {
    return [
      {
        tag: 'span[data-section]',
        getAttrs: (dom) => {
          if (!(dom instanceof HTMLElement)) {
            return {};
          }
          return {
            key: dom.getAttribute('data-section') ?? '',
            label: dom.getAttribute('data-label') ?? dom.textContent ?? '',
            content: dom.getAttribute('data-content') ?? dom.textContent ?? '',
            id: dom.getAttribute('data-section-id') ?? ''
          };
        }
      }
    ];
  },
  renderHTML({ node }) {
    const label = node.attrs.label || node.attrs.key;
    const content = node.attrs.content || `{{#${node.attrs.key}}}Content goes here{{/${node.attrs.key}}}`;
    return [
      'span',
      {
        'data-section': node.attrs.key,
        'data-label': label,
        'data-section-id': node.attrs.id,
        class: 'template-section',
        'data-content': content,
        style: SECTION_WRAPPER_STYLE
      },
      content
    ];
  }
});

const formatSectionToken = (placeholder: PlaceholderDefinition, override?: string) => {
  const content = (override ?? placeholder.sectionContent ?? 'Conditional content here.').trim();
  return `{{#${placeholder.key}}}${content}{{/${placeholder.key}}}`;
};

const parsePlaceholderToken = (match: string, key: string, placeholderKeys: string[]) => {
  if (!placeholderKeys.includes(key)) {
    return match;
  }

  return `<span data-placeholder="${key}" class="template-placeholder">${match}</span>`;
};

const generateSectionId = (() => {
  let id = 1;
  return () => `section-${id++}`;
})();

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
    return `<span data-section="${key}" data-label="${label}" data-section-id="${generateSectionId()}" data-content="${match}" class="template-section" style="${SECTION_WRAPPER_STYLE}">${match}</span>`;
  });
};

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

const templateToEditorContent = (template: string, placeholders: PlaceholderDefinition[]) => {
  if (!template) {
    return '';
  }

  const withSections = wrapSections(template, placeholders);
  const keys = placeholders.map((p) => p.key);
  return withSections.replace(/{{\s*([a-zA-Z0-9_]+)\s*}}/g, (match, key) =>
    parsePlaceholderToken(match, key, keys)
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

const TemplateEditor: React.FC<TemplateEditorProps> = ({
  initialTemplate = '',
  initialValues,
  placeholders,
  onTemplateChange,
  onValuesChange
}) => {
  const [template, setTemplate] = React.useState(() => templateToEditorContent(initialTemplate, placeholders));
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

  const handleEditorUpdate = React.useCallback(
    (html: string) => {
      const bare = stripHighlightSpans(html);
      setTemplate(html);
      setPreviewTemplate(bare);
      onTemplateChange?.(bare);
    },
    [onTemplateChange]
  );

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: false }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      PlaceholderNode,
      SectionNode
    ],
    content: template,
    onUpdate: ({ editor }) => handleEditorUpdate(editor.getHTML())
  });

  const syncEditorContent = React.useCallback(
    (preview: string) => {
      const content = templateToEditorContent(preview, placeholders);
      setTemplate(content);
      setPreviewTemplate(preview);
      if (editor) {
        editor.commands.setContent(content);
      }
    },
    [editor, placeholders]
  );

  const startEditingSection = React.useCallback((id: string) => {
    setEditingSectionId(id);
  }, []);

  const cancelSectionEdit = React.useCallback(() => {
    setEditingSectionId(null);
    setEditingSectionValue('');
  }, []);

  const updateSectionNodeContent = React.useCallback(
    (id: string, nextContent: string) => {
      if (!editor) {
        return;
      }

      editor
        .chain()
        .focus()
        .command(({ tr }) => {
          let updated = false;
          editor.state.doc.descendants((node, pos) => {
            if (!updated && node.type.name === 'section' && node.attrs.id === id) {
              tr.setNodeMarkup(pos, undefined, { ...node.attrs, content: nextContent });
              updated = true;
            }
          });
          return updated;
        })
        .run();
    },
    [editor]
  );

  const saveSectionContent = React.useCallback(() => {
    if (!editingSectionId) {
      return;
    }
    updateSectionNodeContent(editingSectionId, editingSectionValue);
    setEditingSectionId(null);
    setEditingSectionValue('');
  }, [editingSectionId, editingSectionValue, updateSectionNodeContent]);

  React.useEffect(() => {
    setValues(buildInitialValues(placeholders, initialValues));
    setPlaceholderModes(buildInitialModes(placeholders));
  }, [initialValues, placeholders]);

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

  React.useEffect(() => {
    syncEditorContent(initialTemplate);
  }, [initialTemplate, placeholders, syncEditorContent]);

  React.useEffect(() => {
    if (!editor) {
      return;
    }

    const collectSections = () => {
      const sections: SectionInfo[] = [];
      editor.state.doc.descendants((node, pos) => {
        if (node.type.name === 'section' && node.attrs.id) {
          const id = node.attrs.id;
          sections.push({
            id,
            key: node.attrs.key,
            label: node.attrs.label,
            content: node.attrs.content,
            pos
          });
        }
      });
      setSectionList(sections);
    };

    collectSections();
    editor.on('update', collectSections);
    return () => {
      editor.off('update', collectSections);
    };
  }, [editor]);

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

  const insertToken = (placeholder: PlaceholderDefinition, mode?: PlaceholderKind) => {
    if (!editor) {
      return;
    }

    const currentMode = mode ?? placeholderModes[placeholder.key] ?? placeholder.kind ?? 'value';
    const supportsSection = placeholderSupportsSection(placeholder);

    if (currentMode === 'section' && supportsSection) {
      editor
        .chain()
        .focus()
        .insertContent({
          type: 'section',
          attrs: {
            key: placeholder.key,
            label: placeholder.label,
            content: formatSectionToken(placeholder),
            id: generateSectionId()
          }
        })
        .run();
      return;
    }

    editor
      .chain()
      .focus()
      .insertContent({
        type: 'placeholder',
        attrs: { key: placeholder.key, label: placeholder.label }
      })
      .run();
  };

  const execCommand = (command: 'bold' | 'italic' | 'underline') => {
    if (!editor) {
      return;
    }

    switch (command) {
      case 'bold':
        editor.chain().focus().toggleBold().run();
        break;
      case 'italic':
        editor.chain().focus().toggleItalic().run();
        break;
      case 'underline':
        editor.chain().focus().toggleUnderline().run();
        break;
      default:
        break;
    }
  };

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
      <section style={{ border: '1px solid #e5e7eb', borderRadius: 6, padding: 16 }}>
        <h2 style={{ marginTop: 0 }}>Template</h2>
        <TemplateToolbar onCommand={execCommand} />
        <EditorContent
          editor={editor}
          style={{
            width: '100%',
            minHeight: 240,
            borderRadius: 4,
            border: '1px solid #cbd5f5',
            padding: 12,
            fontFamily: 'Inter, sans-serif',
            fontSize: 14,
            background: '#fff'
          }}
        />
        <PlaceholderControls
          placeholders={placeholderValues}
          onToggleMode={togglePlaceholderMode}
          onInsert={insertToken}
        />
        {sectionList.length > 0 && <SectionList sections={sectionList} onEdit={startEditingSection} />}
      </section>

      <section style={{ border: '1px solid #e5e7eb', borderRadius: 6, padding: 16 }}>
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
