import './styles/colors.css';
import './styles/App.css';
import { useState } from 'react';
import { SlButton, SlDialog, SlInput } from "@shoelace-style/shoelace/dist/react";

import {TabList, Tab} from './components/Tabs';
import VirtualPage from './components/VirtualPage';
import Editor from './components/Editor';
import Chat from './components/Chat';

import ChatMessage from './components/ChatMessage';
import AI from './model/AI';

function App() {

	const [html, setHtml] = useState("<h1>Hello world!</h1>");
	const [css, setCss] = useState("");
	const [js, setJs] = useState("");
	const [messages, setMessages] = useState([]);

	const [loadingResponse, setLoadingResponse] = useState(false);

	const [usedTokens, setUsedTokens] = useState("0");
	const [moneySpent, setMoneySpent] = useState("0.00");

	// Show a Dialog if the API key is not set in the localStorage yet or if it is not valid
	const [isCheckingAPIKey, setIsCheckingAPIKey] = useState(false);
	const [showAPIKeyDialog, setShowAPIKeyDialog] = useState(!AI.isInitialized && !localStorage.getItem("api_key"));

	if (localStorage.getItem("api_key") && !AI.isInitialized && !isCheckingAPIKey) {
		checkAPIKeyValidity();
	}

	function checkAPIKeyValidity() {
		setIsCheckingAPIKey(true);
		AI.checkAPIKey(localStorage.getItem("api_key")).then((isValid) => {
			if (isValid) {
				AI.initWithKey(localStorage.getItem("api_key"));
				setShowAPIKeyDialog(false);
			} else {
				localStorage.removeItem("api_key");
				setShowAPIKeyDialog(true);
			}
			setIsCheckingAPIKey(false);
		});
	}

	function addMessage(message_text) {
		if (loadingResponse) {
			console.error("Can't send message while waiting for response");
			return;
		}
		setLoadingResponse(true);

		const newMessages = [
			...messages,
			new ChatMessage("user", message_text, html, css, js)
		]
		setMessages(newMessages);

		AI.getResponseMessage(newMessages).then(responseMessage => {
			setMessages([...newMessages, responseMessage]);
			setLoadingResponse(false);

			let _used_tokens = AI.totalUsedTokens;
			let _money_spent = AI.totalUsedTokensUSD.toFixed(4);
			if (AI.totalUsedTokens > 1000) _used_tokens = Math.round(AI.totalUsedTokens / 1000) + "k";
			if (AI.totalUsedTokens > 1000000) _used_tokens = Math.round(AI.totalUsedTokens / 1000000) + "M";
			setUsedTokens(_used_tokens);
			setMoneySpent(_money_spent);
			

			if (responseMessage.html) setHtml(responseMessage.html);
			if (responseMessage.css) setCss(responseMessage.css);
			if (responseMessage.js) setJs(responseMessage.js);
		});
	}

	function downloadHtmlFile() {

		const html_file = `
			<html>
				<head>
					<style>${css}</style>
				</head>
				<body>
					${html}
					<script>${js}</script>
				</body>
			</html>
		`;

		const element = document.createElement("a");
		const file = new Blob([html_file], { type: 'text/html' });
		element.href = URL.createObjectURL(file);
		element.download = "index.html";
		document.body.appendChild(element); // Required for this to work in FireFox
		element.click();
		document.body.removeChild(element);
	}

	return (
		<div className="App">
			
			<APIKeyDialog show={showAPIKeyDialog} loading={isCheckingAPIKey} checkAPIKeyValidity={checkAPIKeyValidity} />
			<div className="container">
				<div>
					<TabList html={html} css={css} js={js} loadingResponse={loadingResponse} downloadFunction={ downloadHtmlFile }>
						<Tab key="page" label="Preview" icon="card-image" >
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
				<div style={{width: "600px"}}>
					<Chat messages={messages} addMessage={addMessage} loadingResponse={loadingResponse} usedTokens={usedTokens} moneySpent={moneySpent} />
				</div>
			</div>
		</div>
	);
}


function APIKeyDialog({show, loading, checkAPIKeyValidity}) {

	function handleRequestClose(event) {
		console.log("Dialog closed");
		if (!AI.isInitialized) {
			event.preventDefault();
		}
	}

	function saveAPIKey() {
		const input = document.querySelector("sl-input");
		const new_key = input.value;
		localStorage.setItem("api_key", new_key);
		checkAPIKeyValidity();
	}

	return (
		<SlDialog open={show} label="Provide your OpenAI's API key" onSlRequestClose={handleRequestClose}>
			Provide your own OpenAI's API key to use the chatbot. <a href="https://help.openai.com/en/articles/4936850-where-do-i-find-my-secret-api-key" target="_blank" rel="noreferrer">Where do I find my secret API key?</a>
			<div style={{marginTop: "24px"}} />
			<SlInput type="text" placeholder="sk-..." disabled={loading} />
			<SlButton slot="footer" onClick={saveAPIKey} loading={loading}>Save</SlButton>
		</SlDialog>
	);

}

export default App;
