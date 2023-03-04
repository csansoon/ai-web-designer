import '../styles/Chat.css'

export default function Chat({ messages, addMessage }) {

	const sendMessage = () => {
		const input = document.querySelector(".chat-input input");
		addMessage(input.value);
		input.value = "";
	}

	const onClick = (event) => {
		// if shift + enter, add a new line

		if (event.key === "Enter" && !event.shiftKey) {
			event.preventDefault();
			sendMessage();
		}
	}

	return (
		<div className="chat-container">
			<div className="chat-messages">
				{messages.map((message, index) => {
					return (
						<div key={index}>
							{message.render()}
						</div>
					);
				})}
			</div>
			<div className="chat-input">
				<input type="text" onKeyPress={onClick} />
				<button onClick={sendMessage}>Enviar</button>
			</div>	
		</div>
	);
}