import React from 'react';
import './resume-builder.css';

type TemplateName = 'classic' | 'modern';

interface TemplateSelectorProps {
  active: TemplateName;
  onChange: (t: TemplateName) => void;
}

export function TemplateSelector({ active, onChange }: TemplateSelectorProps) {
  return (
    <div className="rb-template-selector">
      <button
        className={`rb-template-btn ${active === 'classic' ? 'rb-template-active' : ''}`}
        onClick={() => onChange('classic')}
        id="templateClassicBtn"
      >
        📄 Classic
      </button>
      <button
        className={`rb-template-btn ${active === 'modern' ? 'rb-template-active' : ''}`}
        onClick={() => onChange('modern')}
        id="templateModernBtn"
      >
        🎨 Modern
      </button>
    </div>
  );
}

export type { TemplateName };
