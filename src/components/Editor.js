import '../styles/Editor.css';

import React from 'react';
import CodeMirror from '@uiw/react-codemirror';

export default function Editor({ value, onChange }) {
  return (
    <div className="editor-container">
      <CodeMirror value={value} onChange={onChange} theme="dark" />
    </div>
  );
}
