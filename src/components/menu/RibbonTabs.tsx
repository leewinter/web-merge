import React from 'react';

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
