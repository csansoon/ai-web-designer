// import React from 'react';

class ChatMessage {

	constructor(role, message, html, css, js) {
		this.role = role;
		this.message = message;
		this.html = html;
		this.css = css;
		this.js = js;
	}


	render(key) {
		return (
			<div className={`chat-message ${this.role}`} key={key}>
				<div className="chat-message-content">
					{this.message}
				</div>
			</div>
		);
	}
}

export default ChatMessage;