import './styles/colors.css';
import './styles/App.css';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { SlButton, SlDialog, SlInput, SlSelect, SlOption } from '@shoelace-style/shoelace/dist/react';

import { TabList, Tab } from './components/Tabs';
import VirtualPage from './components/VirtualPage';
import Editor from './components/Editor';
import Chat from './components/Chat';

import ChatMessage from './components/ChatMessage';
import AI, { MODELS, STORAGE_KEYS } from './model/AI';

const DEFAULT_HTML = `<main class="hero">
  <section>
    <p class="eyebrow">AI web designer</p>
    <h1>Describe a landing page and iterate with AI.</h1>
    <p class="subtitle">Ask for layout, styling, copy, or interactions, then refine the generated page in the editors.</p>
    <button type="button">Start designing</button>
  </section>
</main>`;

const DEFAULT_CSS = `.hero {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 48px 24px;
  font-family: Inter, system-ui, sans-serif;
  background: radial-gradient(circle at top, #1d4ed8, #0f172a 60%);
  color: white;
}

.hero section {
  max-width: 720px;
}

.eyebrow {
  text-transform: uppercase;
  letter-spacing: 0.16em;
  color: #93c5fd;
  font-size: 0.75rem;
}

.subtitle {
  color: rgba(255, 255, 255, 0.82);
  line-height: 1.6;
}

button {
  margin-top: 24px;
  border: 0;
  border-radius: 999px;
  padding: 12px 20px;
  font-weight: 600;
  background: white;
  color: #0f172a;
  cursor: pointer;
}`;

function App() {
  const [html, setHtml] = useState(DEFAULT_HTML);
  const [css, setCss] = useState(DEFAULT_CSS);
  const [js, setJs] = useState('');
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [loadingResponse, setLoadingResponse] = useState(false);
  const [usedTokens, setUsedTokens] = useState('0');
  const [moneySpent, setMoneySpent] = useState('0.0000');
  const [selectedModel, setSelectedModel] = useState(AI.getSelectedModel());

  const [isCheckingAPIKey, setIsCheckingAPIKey] = useState(false);
  const [showAPIKeyDialog, setShowAPIKeyDialog] = useState(!AI.isInitialized && !localStorage.getItem(STORAGE_KEYS.apiKey));

  const modelDescription = useMemo(() => MODELS[selectedModel]?.description || '', [selectedModel]);

  const checkAPIKeyValidity = useCallback(async (keyFromArgument) => {
    const key = keyFromArgument || localStorage.getItem(STORAGE_KEYS.apiKey);

    if (!key || isCheckingAPIKey) {
      return;
    }

    setIsCheckingAPIKey(true);

    const isValid = await AI.checkAPIKey(key);

    if (isValid) {
      AI.initWithKey(key);
      setShowAPIKeyDialog(false);
    } else {
      AI.clear();
      localStorage.removeItem(STORAGE_KEYS.apiKey);
      setShowAPIKeyDialog(true);
    }

    setIsCheckingAPIKey(false);
  }, [isCheckingAPIKey]);

  useEffect(() => {
    const storedKey = localStorage.getItem(STORAGE_KEYS.apiKey);

    if (storedKey && !AI.isInitialized) {
      checkAPIKeyValidity(storedKey);
    }
  }, [checkAPIKeyValidity]);

  async function addMessage(messageText) {
    const trimmedMessage = messageText.trim();

    if (!trimmedMessage || loadingResponse) {
      return;
    }

    setLoadingResponse(true);

    const newMessages = [
      ...messages,
      new ChatMessage('user', trimmedMessage, html, css, js),
    ];

    setMessages(newMessages);
    setDraft('');

    const responseMessage = await AI.getResponseMessage(newMessages);
    const updatedMessages = [...newMessages, responseMessage];

    setMessages(updatedMessages);
    setLoadingResponse(false);

    let formattedTokens = AI.totalUsedTokens.toString();
    if (AI.totalUsedTokens >= 1000) formattedTokens = `${Math.round(AI.totalUsedTokens / 1000)}k`;
    if (AI.totalUsedTokens >= 1000000) formattedTokens = `${Math.round(AI.totalUsedTokens / 1000000)}M`;

    setUsedTokens(formattedTokens);
    setMoneySpent(AI.totalUsedTokensUSD.toFixed(4));

    if (responseMessage.html !== undefined) setHtml(responseMessage.html);
    if (responseMessage.css !== undefined) setCss(responseMessage.css);
    if (responseMessage.js !== undefined) setJs(responseMessage.js);
  }

  function downloadHtmlFile() {
    const htmlFile = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>ai-web-designer export</title>
    <style>${css}</style>
  </head>
  <body>
    ${html}
    <script>${js}</script>
  </body>
</html>`;

    const element = document.createElement('a');
    const file = new Blob([htmlFile], { type: 'text/html' });
    element.href = URL.createObjectURL(file);
    element.download = 'index.html';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    URL.revokeObjectURL(element.href);
  }

  function resetExample() {
    setHtml(DEFAULT_HTML);
    setCss(DEFAULT_CSS);
    setJs('');
    setMessages([
      new ChatMessage('assistant', 'I reset the page to the starter template. Ask for a redesign, sections, animations, or specific copy.'),
    ]);
  }

  function handleModelChange(event) {
    const newModel = event.target.value;
    AI.setSelectedModel(newModel);
    setSelectedModel(newModel);
    setMoneySpent(AI.totalUsedTokensUSD.toFixed(4));
  }

  return (
    <div className="App">
      <APIKeyDialog show={showAPIKeyDialog} loading={isCheckingAPIKey} checkAPIKeyValidity={checkAPIKeyValidity} />

      <div className="container">
        <div>
          <TabList html={html} css={css} js={js} loadingResponse={loadingResponse} downloadFunction={downloadHtmlFile}>
            <Tab key="page" label="Preview" icon="card-image">
              <VirtualPage html={html} css={css} js={js} />
            </Tab>
            <Tab key="html" label="Elements" icon="code-slash">
              <Editor language="html" displayName="HTML" value={html} onChange={setHtml} />
            </Tab>
            <Tab key="css" label="Styles" icon="palette">
              <Editor language="css" displayName="CSS" value={css} onChange={setCss} />
            </Tab>
            <Tab key="js" label="Code" icon="braces">
              <Editor language="javascript" displayName="JS" value={js} onChange={setJs} />
            </Tab>
          </TabList>
        </div>

        <div className="sidebar-panel">
          <div className="settings-panel">
            <SlSelect value={selectedModel} label="Model" onSlChange={handleModelChange} hoist>
              {Object.entries(MODELS).map(([value, model]) => (
                <SlOption key={value} value={value}>{model.label}</SlOption>
              ))}
            </SlSelect>
            <p className="settings-help">{modelDescription}</p>
            <div className="settings-actions">
              <SlButton size="small" onClick={resetExample}>Reset starter</SlButton>
              <SlButton size="small" variant="default" onClick={() => setShowAPIKeyDialog(true)}>API key</SlButton>
            </div>
          </div>
          <Chat
            messages={messages}
            draft={draft}
            setDraft={setDraft}
            addMessage={addMessage}
            loadingResponse={loadingResponse}
            usedTokens={usedTokens}
            moneySpent={moneySpent}
            selectedModel={selectedModel}
          />
        </div>
      </div>
    </div>
  );
}

function APIKeyDialog({ show, loading, checkAPIKeyValidity }) {
  const [value, setValue] = useState(localStorage.getItem(STORAGE_KEYS.apiKey) || '');

  useEffect(() => {
    setValue(localStorage.getItem(STORAGE_KEYS.apiKey) || '');
  }, [show]);

  function handleRequestClose(event) {
    if (!AI.isInitialized) {
      event.preventDefault();
    }
  }

  function saveAPIKey() {
    const nextValue = value.trim();
    localStorage.setItem(STORAGE_KEYS.apiKey, nextValue);
    checkAPIKeyValidity(nextValue);
  }

  function onKeyDown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      saveAPIKey();
    }
  }

  return (
    <SlDialog open={show} label="Provide your OpenAI API key" onSlRequestClose={handleRequestClose}>
      This app sends requests directly from your browser to OpenAI using your key. Use a project-scoped key with an appropriate spend limit.
      <div style={{ marginTop: '24px' }} />
      <SlInput
        type="password"
        placeholder="sk-..."
        value={value}
        disabled={loading}
        onSlInput={(event) => setValue(event.target.value)}
        onKeyDown={onKeyDown}
      />
      <div style={{ marginTop: '12px', color: 'var(--sl-color-neutral-500)' }}>
        <a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer">OpenAI API keys</a>
      </div>
      <SlButton slot="footer" onClick={saveAPIKey} loading={loading} disabled={!value.trim()}>Save</SlButton>
    </SlDialog>
  );
}

export default App;
