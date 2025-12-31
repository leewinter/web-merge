import React from 'react';
import Mustache from 'mustache';

export type PlaceholderKind = 'value' | 'section';

export interface PlaceholderDefinition {
  key: string;
  label: string;
  description?: string;
  sampleValue?: string | boolean | number;
  /**
   * Allow this placeholder to be inserted or treated as a section by the editor.
   */
  allowSection?: boolean;
  kind?: PlaceholderKind;
  sectionContent?: string;
}

export interface TemplateEditorProps {
  /**
   * Editable template text that contains Mustache placeholders.
   */
  initialTemplate?: string;
  /**
   * Override values used when previewing the template.
   */
  initialValues?: Record<string, unknown>;
  /**
   * Placeholder metadata that drives the toolbar and the generated preview data.
   */
  placeholders: PlaceholderDefinition[];
  onTemplateChange?: (template: string) => void;
  onValuesChange?: (values: Record<string, unknown>) => void;
}

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

const formatSectionToken = (placeholder: PlaceholderDefinition) => {
  const content = (placeholder.sectionContent ?? 'Conditional content here.').trim();
  return `{{#${placeholder.key}}}${content}{{/${placeholder.key}}}`;
};

const placeholderSupportsSection = (placeholder: PlaceholderDefinition) =>
  placeholder.allowSection ?? (Boolean(placeholder.sectionContent) || placeholder.kind === 'section');

const buildInitialModes = (placeholders: PlaceholderDefinition[]) =>
  placeholders.reduce<Record<string, PlaceholderKind>>((acc, placeholder) => {
    acc[placeholder.key] = placeholder.kind ?? 'value';
    return acc;
  }, {});

const TemplateEditor: React.FC<TemplateEditorProps> = ({
  initialTemplate = '',
  initialValues,
  placeholders,
  onTemplateChange,
  onValuesChange
}) => {
  const [template, setTemplate] = React.useState(initialTemplate);
  const [values, setValues] = React.useState<Record<string, unknown>>(
    buildInitialValues(placeholders, initialValues)
  );
  const [placeholderModes, setPlaceholderModes] = React.useState<Record<string, PlaceholderKind>>(
    () => buildInitialModes(placeholders)
  );
  const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);

  React.useEffect(() => {
    setTemplate(initialTemplate);
  }, [initialTemplate]);

  React.useEffect(() => {
    setValues(buildInitialValues(placeholders, initialValues));
    setPlaceholderModes(buildInitialModes(placeholders));
  }, [initialValues, placeholders]);

  const renderedResult = React.useMemo(() => {
    try {
      return Mustache.render(template, values);
    } catch (error) {
      return `Rendering error: ${(error as Error).message}`;
    }
  }, [template, values]);

  const updateTemplate = (next: string) => {
    setTemplate(next);
    onTemplateChange?.(next);
  };

  const updateValue = (key: string, next: unknown) => {
    setValues((prev) => {
      const nextValues = { ...prev, [key]: next };
      onValuesChange?.(nextValues);
      return nextValues;
    });
  };

const insertToken = (placeholder: PlaceholderDefinition, mode?: PlaceholderKind) => {
    const currentMode = mode ?? placeholderModes[placeholder.key] ?? placeholder.kind ?? 'value';
    const supportsSection = placeholderSupportsSection(placeholder);
    const token =
      currentMode === 'section' && supportsSection ? formatSectionToken(placeholder) : `{{${placeholder.key}}}`;
    const textarea = textareaRef.current;
    if (!textarea) {
      updateTemplate(`${template}${token}`);
      return;
    }

    const { selectionStart, selectionEnd } = textarea;
    const nextTemplate =
      template.slice(0, selectionStart ?? 0) + token + template.slice(selectionEnd ?? 0);
    updateTemplate(nextTemplate);
    const cursor = (selectionStart ?? 0) + token.length;
    const raf =
      typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function'
        ? window.requestAnimationFrame
        : (callback: () => void) => callback();
    raf(() => {
      textarea.focus();
      textarea.setSelectionRange(cursor, cursor);
    });
  };

  const placeholderValues = React.useMemo(
    () =>
      placeholders.map((placeholder) => {
        const mode = placeholderModes[placeholder.key] ?? placeholder.kind ?? 'value';
        return {
          ...placeholder,
          currentValue: values[placeholder.key],
          mode,
          supportsSection: placeholderSupportsSection(placeholder)
        };
      }),
    [placeholders, values, placeholderModes]
  );

  const togglePlaceholderMode = (placeholder: PlaceholderDefinition) => {
    if (!placeholderSupportsSection(placeholder)) {
      return;
    }

    setPlaceholderModes((prev) => {
      const nextMode = prev[placeholder.key] === 'section' ? 'value' : 'section';
      if (nextMode === 'section') {
        setValues((current) => ({
          ...current,
          [placeholder.key]: Boolean(String(current[placeholder.key] ?? ''))
        }));
      }
      return { ...prev, [placeholder.key]: nextMode };
    });
  };

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <section style={{ border: '1px solid #e5e7eb', borderRadius: 6, padding: 16 }}>
        <h2 style={{ marginTop: 0 }}>Template</h2>
        <textarea
          ref={textareaRef}
          value={template}
          onChange={(event) => updateTemplate(event.currentTarget.value)}
          rows={12}
          style={{
            width: '100%',
            fontFamily: 'Consolas, menlo, monospace',
            fontSize: 14,
            borderRadius: 4,
            borderColor: '#cbd5f5',
            padding: 12
          }}
        />
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 12,
            marginTop: 12,
            alignItems: 'center'
          }}
        >
          {placeholderValues.map((placeholder) => (
            <div
              key={placeholder.key}
              style={{
                display: 'inline-flex',
                gap: 6,
                alignItems: 'center',
                padding: '4px 6px',
                borderRadius: 999,
                border: '1px solid #e2e8f0',
                background: '#fff'
              }}
            >
              {placeholder.supportsSection && (
                <button
                  type="button"
                  onClick={() => togglePlaceholderMode(placeholder)}
                  style={{
                    borderRadius: 999,
                    border: '1px solid #cbd5f5',
                    background: placeholder.mode === 'section' ? '#e0f2fe' : '#fff',
                    padding: '4px 8px',
                    cursor: 'pointer',
                    fontSize: 11
                  }}
                >
                  Insert {placeholder.mode === 'section' ? 'section' : 'value'}
                </button>
              )}
              <button
                type="button"
                onClick={() => insertToken(placeholder)}
                style={{
                  borderRadius: 999,
                  border: 'none',
                  background: 'transparent',
                  padding: '6px 12px',
                  cursor: 'pointer'
                }}
              >
                {placeholder.label}
              </button>
            </div>
          ))}
        </div>
      </section>

      <section style={{ border: '1px solid #e5e7eb', borderRadius: 6, padding: 16 }}>
        <h3 style={{ marginTop: 0 }}>Placeholder values</h3>
        <div style={{ display: 'grid', gap: 12 }}>
          {placeholderValues.map((placeholder) => (
            <label
              key={`value-${placeholder.key}`}
              style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 14 }}
            >
              <span style={{ fontWeight: 600 }}>{placeholder.label}</span>
              {placeholder.description && (
                <span style={{ fontSize: 12, color: '#475569' }}>{placeholder.description}</span>
              )}
              {placeholder.mode === 'section' && placeholder.supportsSection ? (
                <input
                  type="checkbox"
                  checked={Boolean(placeholder.currentValue)}
                  onChange={(event) => updateValue(placeholder.key, event.target.checked)}
                />
              ) : (
                <input
                  type="text"
                  value={String(placeholder.currentValue ?? '')}
                  onChange={(event) => updateValue(placeholder.key, event.target.value)}
                  style={{ borderRadius: 4, borderColor: '#cbd5f5', padding: 6 }}
                />
              )}
            </label>
          ))}
        </div>
      </section>

      <section style={{ border: '1px solid #e5e7eb', borderRadius: 6, padding: 16 }}>
        <h3 style={{ marginTop: 0 }}>Rendered preview</h3>
        <div
          style={{
            minHeight: 80,
            padding: 12,
            borderRadius: 4,
            background: '#f8fafc',
            fontFamily: 'Inter, sans-serif',
            whiteSpace: 'pre-wrap'
          }}
        >
          {renderedResult}
        </div>
      </section>
    </div>
  );
};

export default TemplateEditor;
