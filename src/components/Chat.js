import '../styles/Chat.css'
import { SlTooltip, SlButton, SlIcon, SlBadge } from "@shoelace-style/shoelace/dist/react";
import TextareaAutosize from "react-textarea-autosize";

export default function Chat({ messages, addMessage, loadingResponse, usedTokens, moneySpent}) {

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
				<div className="chat-header">
					<SlTooltip content="Cada token representa una palabra, conjunto de letras o concepto que el chatbot puede entender.">
						<SlBadge>
							{usedTokens} tokens
						</SlBadge>
					</SlTooltip>
					<SlTooltip content="1k tokens cuestan $0.002 USD.">
						<SlBadge>
							$ {moneySpent}
						</SlBadge>
					</SlTooltip>
				</div>

				<div className="chat-messages">
					{messages.map((message, key) => {
						return <>{message.render(key)}</>;
					})}
				</div>
				<div className="chat-input">
					<TextareaAutosize
						onKeyPress={onClick}
						disabled={loadingResponse}
					/>
					<SlTooltip content="Enviar">
						<SlButton
							onClick={sendMessage}
							aria-label="Enviar"
							variant="primary"
							loading={loadingResponse}
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