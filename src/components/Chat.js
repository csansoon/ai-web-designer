import '../styles/Chat.css'
import { SlTooltip, SlButton, SlIcon } from "@shoelace-style/shoelace/dist/react";
import TextareaAutosize from "react-textarea-autosize";

export default function Chat({ messages, addMessage }) {

	const sendMessage = () => {
		const input = document.querySelector(".chat-input textarea");
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
			<div className="chat-container-inner">
				<div className="chat-messages">
					{messages.map((message, key) => {
						return <>{message.render(key)}</>;
					})}
				</div>
				<div className="chat-input">
					<TextareaAutosize onKeyPress={onClick} />
					<SlTooltip content="Enviar">
						<SlButton
							onClick={sendMessage}
							aria-label="Enviar"
							variant="primary"
							circle
						>
							<SlIcon name="send" />
						</SlButton>
					</SlTooltip>
				</div>
			</div>
		</div>
	);
}