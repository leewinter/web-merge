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
import type { TableCommand } from './menu/TableControls';
import { PlaceholderControls, TableControls, RibbonTabs } from './menu';
import { SectionList, SectionEditorPanel } from './sections';
import { RenderedPreview } from './preview/RenderedPreview';
import { useWordExport } from '../word/useWordExport';
import { parseDocumentModel } from '../word/template-model';
import { quillFormats, quillModules } from './editor/quillConfig';
import {
  buildInitialValues,
  buildInitialModes,
  collectSectionsFromHtml,
  escapeAttribute,
  formatSectionToken,
  generateSectionId,
  placeholderSupportsSection,
  SECTION_WRAPPER_STYLE,
  stripHighlightSpans,
  templateToEditorContent
} from './editor/templateHelpers';
import { ImageInsertDialog } from './editor/ImageInsertDialog';
import './TemplateEditor.css';

const TOOLTIP_MAP: Array<{ selector: string; title: string }> = [
  { selector: '.ql-bold', title: 'Bold (Ctrl+B)' },
  { selector: '.ql-italic', title: 'Italic (Ctrl+I)' },
  { selector: '.ql-underline', title: 'Underline (Ctrl+U)' },
  { selector: '.ql-list.ql-ordered', title: 'Numbered list' },
  { selector: '.ql-list.ql-bullet', title: 'Bullet list' },
  { selector: '.ql-align', title: 'Text alignment' }
];

const TemplateEditor: React.FC<TemplateEditorProps> = ({
  initialTemplate = '',
  initialValues,
  placeholders,
  onTemplateChange,
  onValuesChange
}) => {
  // Track both the sanitized preview output and the raw HTML Quill maintains.
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
      // Remove our placeholder/section highlights before sending the string to Mustache.
      const bare = stripHighlightSpans(html);
      setPreviewTemplate(bare);
      onTemplateChange?.(bare);
    },
    [onTemplateChange]
  );

  const syncEditorFromQuill = React.useCallback(() => {
    const quill = getQuillInstance();
    if (!quill) {
      return;
    }
    const html = quill.root.innerHTML;
    setEditorHtml(html);
    updatePreviewFromHtml(html);
  }, [getQuillInstance, updatePreviewFromHtml]);


  const applyHtmlToEditor = React.useCallback(
    (html: string) => {
      // Only mutate Quill when the editor exists; otherwise keep the string around for later initialization.
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

    const toolbarModule = quill.getModule('toolbar') as { container?: HTMLElement } | null;
    const toolbarContainer = toolbarModule?.container;
    if (toolbarContainer) {
      TOOLTIP_MAP.forEach(({ selector, title }) => {
        const element = toolbarContainer.querySelector(selector);
        if (element && !element.getAttribute('title')) {
          element.setAttribute('title', title);
        }
      });
    }

    const handleChange = () => {
      syncEditorFromQuill();
    };

    quill.on('text-change', handleChange);
    applyHtmlToEditor(initialEditorHtml.current);

    return () => {
      quill.off('text-change', handleChange);
      quillInstanceRef.current = null;
    };
  }, [applyHtmlToEditor, syncEditorFromQuill]);

  const syncEditorContent = React.useCallback(
    (preview: string) => {
      // Reflect changes in the controlled preview/template back into the editor canvas.
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
    // Persist edits made inside the section editor panel.
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

  const documentModel = React.useMemo(() => parseDocumentModel(renderedResult.html), [renderedResult.html]);
  const downloadAsDocx = useWordExport();

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

  const insertImageAtCursor = React.useCallback(
    (src: string) => {
      const quill = getQuillInstance();
      if (!quill) {
        return;
      }
      const index = quill.getSelection()?.index ?? quill.getLength();
      quill.insertEmbed(index, 'image', src);
      quill.setSelection(index + 1);
    },
    [getQuillInstance]
  );

  const readFileAsDataUrl = React.useCallback((file: File) => {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('Unable to parse image'));
        }
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }, []);

  const [imageDialogOpen, setImageDialogOpen] = React.useState(false);
  const openImageDialog = React.useCallback(() => setImageDialogOpen(true), []);
  const closeImageDialog = React.useCallback(() => setImageDialogOpen(false), []);
  const handleImageDialogInsert = React.useCallback(
    (src: string) => {
      insertImageAtCursor(src);
      closeImageDialog();
    },
    [insertImageAtCursor, closeImageDialog]
  );

  React.useEffect(() => {
    const quill = quillInstanceRef.current;
    if (!quill) {
      return;
    }
    const toolbar = quill.getModule('toolbar');
    if (toolbar && typeof (toolbar as { addHandler?: (name: string, handler: () => void) => void }).addHandler === 'function') {
      (toolbar as { addHandler: (name: string, handler: () => void) => void }).addHandler('image', openImageDialog);
    }
  }, [openImageDialog]);

  const execCommand = React.useCallback(
    (command: TableCommand) => {
      const quill = getQuillInstance();
      if (!quill) {
        return;
      }
      quill.focus();
      const tableModule = quill.getModule('table') as {
        insertTable?: (rows: number, cols: number) => void;
        insertRowBelow?: () => void;
        insertColumnRight?: () => void;
        deleteRow?: () => void;
        deleteColumn?: () => void;
        deleteTable?: () => void;
      } | null;
      if (!tableModule) {
        return;
      }

      switch (command) {
        case 'insertTable':
          tableModule.insertTable?.(2, 2);
          break;
        case 'addRow':
          tableModule.insertRowBelow?.();
          break;
        case 'addColumn':
          tableModule.insertColumnRight?.();
          break;
        case 'removeRow':
          tableModule.deleteRow?.();
          break;
        case 'removeColumn':
          tableModule.deleteColumn?.();
          break;
        case 'removeTable':
          tableModule.deleteTable?.();
          break;
        default:
          break;
      }
    },
    [getQuillInstance]
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
        .template-table {
          width: 100%;
          border-collapse: collapse;
        }
        .template-table th,
        .template-table td {
          border: 1px solid #cbd5f5;
          padding: 8px;
          text-align: left;
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
    <div className="template-editor-root">
      <section className="template-editor-panel">
        <h2>Template</h2>
        <div className="template-editor-toolbar-wrapper">
          <RibbonTabs
            defaultActiveKey="placeholders"
            tabs={[
              {
                key: 'placeholders',
                label: 'Placeholders',
                content: (
                  <PlaceholderControls
                    placeholders={placeholderValues}
                    onToggleMode={togglePlaceholderMode}
                    onInsert={insertToken}
                  />
                )
              },
              {
                key: 'tables',
                label: 'Table tools',
                content: <TableControls onCommand={execCommand} />
              },
            ]}
          />
          {sectionList.length > 0 && <SectionList sections={sectionList} onEdit={startEditingSection} />}
        </div>
        <div
          ref={editorContainerRef}
          className="template-editor-container"
        />
      </section>

      <section className="template-editor-preview-panel">
        <div className="template-editor-preview-header">
          <h3>Rendered preview</h3>
          <button
            type="button"
            onClick={() => {
              void downloadAsDocx(documentModel);
            }}
            className="template-editor-download-button"
          >
            Download as Word
          </button>
        </div>
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
      <ImageInsertDialog
        open={imageDialogOpen}
        onClose={closeImageDialog}
        onInsert={handleImageDialogInsert}
        readFileAsDataUrl={readFileAsDataUrl}
      />
    </div>
  );
};

export default TemplateEditor;
