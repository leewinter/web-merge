import React from 'react';

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
