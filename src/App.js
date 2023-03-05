import './styles/colors.css';
import './styles/App.css';
import { useState } from 'react';

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

	return (
		<div className="App">
			<div className="container">
				<div>
					<TabList html={html} css={css} js={js} loadingResponse={loadingResponse}>
						<Tab key="page" label="Vista previa" icon="card-image" >
							<VirtualPage html={html} css={css} js={js} />
						</Tab>
						<Tab key="html" label="Elementos" icon="code-slash">
							<Editor language="html" displayName="HTML" value={html} onChange={setHtml} />
						</Tab>
						<Tab key="css" label="Estilos" icon="palette">
							<Editor language="css" displayName="CSS" value={css} onChange={setCss} />
						</Tab>
						<Tab key="js" label="Código" icon="braces">
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

export default App;
