import { useEffect, useRef } from 'react';
import "../styles/Editor.css";

import React from 'react';
import CodeMirror from '@uiw/react-codemirror';
// import { javascript } from '@codemirror/lang-javascript';
// import { css } from '@codemirror/lang-css';
// import { html } from '@codemirror/lang-html';

export default function Editor({ language, displayName, value, onChange }) {

    function handleChange(value) {
        onChange(value);
    }

    return (
        <div className="editor-container">
            <CodeMirror value={value} onChange={handleChange} options={{ mode: language, theme: "material", lineNumbers: true }} />
        </div>
    )

}