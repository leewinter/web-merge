import React from 'react';

export type TableCommand = 'insertTable' | 'addRow' | 'addColumn' | 'removeRow' | 'removeColumn' | 'removeTable';

interface TableControlsProps {
  onCommand: (command: TableCommand) => void;
}

const commandList = [
  {
    label: 'Insert table',
    command: 'insertTable' as TableCommand,
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
        <rect x="1" y="1" width="14" height="14" fill="none" stroke="#0f172a" strokeWidth="1" />
        <path d="M1 5h14M1 10h14M5 1v14M10 1v14" stroke="#0f172a" strokeWidth="1" />
      </svg>
    )
  },
  {
    label: 'Add row',
    command: 'addRow' as TableCommand,
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
        <rect x="1" y="3" width="14" height="3" fill="#f1f5f9" stroke="#0f172a" strokeWidth="1" />
        <rect x="1" y="9" width="14" height="3" fill="#fff" stroke="#0f172a" strokeWidth="1" />
        <path d="M3 7.5h10" stroke="#0f172a" strokeWidth="1.5" />
        <path d="M8 6v3" stroke="#0f172a" strokeWidth="1.5" />
      </svg>
    )
  },
  {
    label: 'Add column',
    command: 'addColumn' as TableCommand,
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
        <rect x="3" y="1" width="10" height="14" fill="#fff" stroke="#0f172a" strokeWidth="1" />
        <rect x="1" y="5" width="3" height="6" fill="#f1f5f9" stroke="#0f172a" strokeWidth="1" />
        <path d="M5.5 3h5" stroke="#0f172a" strokeWidth="1.5" />
        <path d="M8 1v14" stroke="#0f172a" strokeWidth="1.5" />
      </svg>
    )
  },
  {
    label: 'Remove row',
    command: 'removeRow' as TableCommand,
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
        <rect x="1" y="3" width="14" height="3" fill="#fff" stroke="#0f172a" strokeWidth="1" />
        <rect x="1" y="8" width="14" height="3" fill="#fef2f2" stroke="#0f172a" strokeWidth="1" />
        <path d="M4 6.5h8" stroke="#dc2626" strokeWidth="1.5" />
      </svg>
    )
  },
  {
    label: 'Remove column',
    command: 'removeColumn' as TableCommand,
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
        <rect x="1" y="1" width="14" height="14" fill="#fff" stroke="#0f172a" strokeWidth="1" />
        <path d="M6 1v14" stroke="#dc2626" strokeWidth="1.5" />
        <path d="M10 1v14" stroke="#0f172a" strokeWidth="1" strokeDasharray="2 2" />
      </svg>
    )
  },
  {
    label: 'Remove table',
    command: 'removeTable' as TableCommand,
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
        <rect x="1" y="1" width="14" height="14" fill="#fff" stroke="#0f172a" strokeWidth="1" />
        <path d="M4 4l8 8M12 4l-8 8" stroke="#dc2626" strokeWidth="1.5" />
      </svg>
    )
  }
];

export const TableControls: React.FC<TableControlsProps> = ({ onCommand }) => (
  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
    {commandList.map((item) => (
      <button
        key={item.command}
        type="button"
        onClick={() => onCommand(item.command)}
        style={{
          borderRadius: 4,
          border: '1px solid #d1d5db',
          background: '#fff',
          padding: '6px 12px',
          cursor: 'pointer',
          fontSize: 12,
          display: 'flex',
          gap: 6,
          alignItems: 'center'
        }}
        title={item.label}
      >
        {item.icon}
        <span>{item.label}</span>
      </button>
    ))}
  </div>
);
