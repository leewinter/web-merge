import React from 'react';
import type { PlaceholderRenderInfo, SectionInfo } from './template-types';

export type EditorCommand = 'bold' | 'italic' | 'underline';

interface TemplateToolbarProps {
  onCommand: (command: EditorCommand) => void;
}

export const TemplateToolbar: React.FC<TemplateToolbarProps> = ({ onCommand }) => (
  <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
    {['bold', 'italic', 'underline'].map((command) => (
      <button
        key={command}
        type="button"
        onClick={() => onCommand(command as EditorCommand)}
        style={{
          borderRadius: 4,
          border: '1px solid #cbd5f5',
          background: '#fff',
          padding: '4px 8px',
          cursor: 'pointer',
          fontSize: 12
        }}
      >
        {command}
      </button>
    ))}
  </div>
);

interface PlaceholderControlsProps {
  placeholders: PlaceholderRenderInfo[];
  onToggleMode: (placeholder: PlaceholderRenderInfo) => void;
  onInsert: (placeholder: PlaceholderRenderInfo) => void;
}

export const PlaceholderControls: React.FC<PlaceholderControlsProps> = ({
  placeholders,
  onToggleMode,
  onInsert
}) => (
  <div
    style={{
      display: 'flex',
      flexWrap: 'wrap',
      gap: 12,
      marginTop: 12,
      alignItems: 'center'
    }}
  >
    {placeholders.map((placeholder) => (
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
            onClick={() => onToggleMode(placeholder)}
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
          onClick={() => onInsert(placeholder)}
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
);

interface SectionListProps {
  sections: SectionInfo[];
  onEdit: (id: string) => void;
}

export const SectionList: React.FC<SectionListProps> = ({ sections, onEdit }) => (
  <div style={{ marginTop: 12 }}>
    <strong>Sections in template</strong>
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
      {sections.map((section) => (
        <button
          key={section.id}
          type="button"
          onClick={() => onEdit(section.id)}
          style={{
            borderRadius: 999,
            border: '1px solid #cbd5f5',
            background: '#fff',
            padding: '4px 10px',
            cursor: 'pointer',
            fontSize: 11
          }}
        >
          Edit {section.label}
        </button>
      ))}
    </div>
  </div>
);

interface SectionEditorPanelProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
}

export const SectionEditorPanel: React.FC<SectionEditorPanelProps> = ({
  label,
  value,
  onChange,
  onSave,
  onCancel
}) => (
  <div
    style={{
      marginTop: 12,
      borderTop: '1px dashed #cbd5f5',
      paddingTop: 12,
      display: 'flex',
      flexDirection: 'column',
      gap: 8
    }}
  >
    <strong>Editing section: {label}</strong>
    <textarea
      value={value}
      onChange={(event) => onChange(event.currentTarget.value)}
      rows={4}
      style={{
        width: '100%',
        fontFamily: 'Inter, sans-serif',
        padding: 8,
        borderRadius: 4,
        borderColor: '#cbd5f5'
      }}
    />
    <div style={{ display: 'flex', gap: 8 }}>
      <button
        type="button"
        onClick={onSave}
        style={{
          padding: '6px 12px',
          borderRadius: 4,
          border: 'none',
          background: '#2563eb',
          color: '#fff',
          cursor: 'pointer'
        }}
      >
        Save section content
      </button>
      <button
        type="button"
        onClick={onCancel}
        style={{
          padding: '6px 12px',
          borderRadius: 4,
          border: '1px solid #cbd5f5',
          background: '#fff',
          cursor: 'pointer'
        }}
      >
        Cancel
      </button>
    </div>
  </div>
);

interface RenderedPreviewProps {
  renderedResult: { html: string; isError: boolean };
}

export const RenderedPreview: React.FC<RenderedPreviewProps> = ({ renderedResult }) => (
  <div
    style={{
      minHeight: 80,
      padding: 12,
      borderRadius: 4,
      background: '#f8fafc',
      fontFamily: 'Inter, sans-serif'
    }}
  >
    {renderedResult.isError ? (
      <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{renderedResult.html}</pre>
    ) : (
      <div dangerouslySetInnerHTML={{ __html: renderedResult.html }} style={{ whiteSpace: 'pre-wrap' }} />
    )}
  </div>
);
