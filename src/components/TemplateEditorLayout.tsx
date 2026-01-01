import React from 'react';
import type { PlaceholderRenderInfo, SectionInfo } from './template-types';

export type TableCommand = 'insertTable' | 'addRow' | 'addColumn' | 'removeRow' | 'removeColumn' | 'removeTable';

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
      alignItems: 'flex-start'
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

interface ExpandablePanelProps {
  title: string;
  defaultExpanded?: boolean;
  children: React.ReactNode;
}

export const ExpandablePanel: React.FC<ExpandablePanelProps> = ({
  title,
  defaultExpanded = true,
  children
}) => {
  const [expanded, setExpanded] = React.useState(defaultExpanded);

  return (
    <div
      style={{
        padding: 12,
        borderRadius: 6,
        border: '1px solid #e5e7eb',
        background: '#f8fafc'
      }}
    >
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        aria-expanded={expanded}
        style={{
          width: '100%',
          borderRadius: 6,
          border: '1px solid #cbd5f5',
          background: '#fff',
          padding: '6px 10px',
          fontSize: 12,
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8
        }}
      >
        <span>{title}</span>
        <span aria-hidden="true" style={{ fontSize: 10 }}>
          {expanded ? '▲' : '▼'}
        </span>
      </button>
      <div
        style={{
          marginTop: 8,
          display: expanded ? 'flex' : 'none',
          gap: 8,
          flexWrap: 'wrap'
        }}
      >
        {children}
      </div>
    </div>
  );
};

interface RibbonTab {
  key: string;
  label: string;
  content: React.ReactNode;
}

interface RibbonTabsProps {
  tabs: RibbonTab[];
  defaultActiveKey?: string;
}

export const RibbonTabs: React.FC<RibbonTabsProps> = ({ tabs, defaultActiveKey }) => {
  const initialKey = defaultActiveKey ?? tabs[0]?.key ?? '';
  const [activeKey, setActiveKey] = React.useState(initialKey);
  const activeTab = tabs.find((tab) => tab.key === activeKey) ?? tabs[0];

  React.useEffect(() => {
    if (!tabs.find((tab) => tab.key === activeKey)) {
      setActiveKey(tabs[0]?.key ?? '');
    }
  }, [activeKey, tabs]);

  return (
    <div
      style={{
        width: '100%',
        borderRadius: 6,
        border: '1px solid #e5e7eb',
        background: '#f8fafc'
      }}
    >
      <div style={{ display: 'flex', borderBottom: '1px solid #cbd5f5' }}>
        {tabs.map((tab) => {
          const isActive = tab.key === activeKey;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveKey(tab.key)}
              style={{
                flex: 1,
                padding: '8px 12px',
                border: 'none',
                background: isActive ? '#fff' : 'transparent',
                borderBottom: isActive ? '3px solid #2563eb' : '3px solid transparent',
                color: '#0f172a',
                fontWeight: isActive ? 600 : 500,
                cursor: 'pointer'
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
      <div style={{ padding: 12 }}>{activeTab?.content}</div>
    </div>
  );
};

interface TableControlsProps {
  onCommand: (command: TableCommand) => void;
}

export const TableControls: React.FC<TableControlsProps> = ({ onCommand }) => (
  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
    {[
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
    ].map((item) => (
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
