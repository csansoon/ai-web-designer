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
	const [css, setCss] = useState("h1 { color: red; }");
	const [js, setJs] = useState("console.log('Hello world!');");
	const [messages, setMessages] = useState([]);

	function addMessage(message_text) {
		const newMessage = new ChatMessage("user", message_text, html, css, js);
		setMessages([...messages, newMessage]);

		let responseMessage = AI.getResponseMessage(messages);
		setMessages([...messages, responseMessage]);

		if (responseMessage.html) setHtml(responseMessage.html);
		if (responseMessage.css) setCss(responseMessage.css);
		if (responseMessage.js) setJs(responseMessage.js);
	}

	return (
		<div className="App">
			<div className="container">
				<div>
					<TabList html={html} css={css} js={js}>
						<Tab label="Página" key="page">
							<VirtualPage html={html} css={css} js={js} />
						</Tab>
						<Tab label="HTML" key="html">
							<Editor language="html" displayName="HTML" value={html} onChange={setHtml} />
						</Tab>
						<Tab label="CSS" key="css">
							<Editor language="css" displayName="CSS" value={css} onChange={setCss} />
						</Tab>
						<Tab label="JS" key="js">
							<Editor language="javascript" displayName="JS" value={js} onChange={setJs} />
						</Tab>
					</TabList>
				</div>
				<div style={{width: "30%"}}>
					<Chat messages={messages} addMessage={addMessage} />
				</div>
			</div>
		</div>
	);
}

export default App;
