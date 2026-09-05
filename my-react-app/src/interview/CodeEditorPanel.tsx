import React, { useState } from 'react';
import Editor from '@monaco-editor/react';

interface CodeEditorPanelProps {
  onSubmit: (code: string, language: string) => void;
  onClose?: () => void;
  hideCloseButton?: boolean;
}

const LANGUAGES = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'cpp', label: 'C++' },
  { value: 'csharp', label: 'C#' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
  { value: 'sql', label: 'SQL' },
];

export function CodeEditorPanel({ onSubmit, onClose, hideCloseButton }: CodeEditorPanelProps) {
  const [code, setCode] = useState('// Write your solution here\n\n');
  const [language, setLanguage] = useState('javascript');

  const handleSubmit = () => {
    if (!code.trim() || code.trim() === '// Write your solution here') {
      return;
    }
    onSubmit(code, language);
  };

  const handleReset = () => {
    if (window.confirm('Reset code editor to starter template?')) {
      setCode('// Write your solution here\n\n');
    }
  };

  return (
    <div className="iv-code-panel" id="codeEditorPanel">
      <div className="iv-code-header">
        <div className="iv-code-header-left">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="16 18 22 12 16 6" />
            <polyline points="8 6 2 12 8 18" />
          </svg>
          <span style={{ fontWeight: 700 }}>Code Editor</span>
          <select
            className="iv-code-lang-select"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            id="codeLangSelect"
          >
            {LANGUAGES.map((l) => (
              <option key={l.value} value={l.value}>{l.label}</option>
            ))}
          </select>
        </div>
        <div className="iv-code-header-right">
          <button
            className="iv-code-reset-btn"
            onClick={handleReset}
            title="Reset code"
            style={{
              padding: '0.35rem 0.6rem',
              fontSize: '0.75rem',
              borderRadius: '6px',
              border: '1px solid #475569',
              background: 'transparent',
              color: '#cbd5e1',
              cursor: 'pointer',
              marginRight: '0.4rem',
            }}
          >
            Reset
          </button>
          <button
            className="iv-code-submit-btn"
            onClick={handleSubmit}
            disabled={!code.trim() || code.trim() === '// Write your solution here'}
            id="submitCodeBtn"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Submit Code
          </button>
          {!hideCloseButton && onClose && (
            <button className="iv-code-close-btn" onClick={onClose} title="Close editor">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>
      </div>
      <div className="iv-code-editor-wrapper">
        <Editor
          height="100%"
          language={language}
          value={code}
          onChange={(val) => setCode(val || '')}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            padding: { top: 12, bottom: 12 },
            bracketPairColorization: { enabled: true },
            wordWrap: 'on',
            tabSize: 2,
          }}
        />
      </div>
    </div>
  );
}
