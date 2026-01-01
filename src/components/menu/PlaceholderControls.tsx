import React from 'react';
import type { PlaceholderRenderInfo } from '../template-types';

interface PlaceholderControlsProps {
  placeholders: PlaceholderRenderInfo[];
  onToggleMode: (placeholder: PlaceholderRenderInfo) => void;
  onInsert: (placeholder: PlaceholderRenderInfo) => void;
}

const buttonStyle: React.CSSProperties = {
  borderRadius: 999,
  border: 'none',
  background: 'transparent',
  padding: '6px 12px',
  cursor: 'pointer'
};

const wrapperStyle: React.CSSProperties = {
  display: 'inline-flex',
  gap: 6,
  alignItems: 'center',
  padding: '4px 6px',
  borderRadius: 999,
  border: '1px solid #e2e8f0',
  background: '#fff'
};

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
      alignItems: 'flex-start'
    }}
  >
    {placeholders.map((placeholder) => (
      <div key={placeholder.key} style={wrapperStyle}>
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
        <button type="button" onClick={() => onInsert(placeholder)} style={buttonStyle}>
          {placeholder.label}
        </button>
      </div>
    ))}
  </div>
);
