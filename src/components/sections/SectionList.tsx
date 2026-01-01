import React from 'react';
import type { SectionInfo } from '../template-types';

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
