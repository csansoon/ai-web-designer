import '../styles/Chat.css';
import { SlTooltip, SlButton, SlIcon, SlBadge } from '@shoelace-style/shoelace/dist/react';
import TextareaAutosize from 'react-textarea-autosize';

export default function Chat({
  messages,
  draft,
  setDraft,
  addMessage,
  loadingResponse,
  usedTokens,
  moneySpent,
  selectedModel,
}) {
  const sendMessage = () => {
    addMessage(draft);
  };

  const onKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-container-inner">
        <div className="chat-header">
          <SlTooltip content="Currently selected model.">
            <SlBadge>{selectedModel}</SlBadge>
          </SlTooltip>
          <SlTooltip content="Total tokens used in this session.">
            <SlBadge>{usedTokens} tokens</SlBadge>
          </SlTooltip>
          <SlTooltip content="Estimated spend based on the selected model's published pricing.">
            <SlBadge>$ {moneySpent}</SlBadge>
          </SlTooltip>
        </div>

        <div className="chat-messages">
          {messages.length === 0 ? (
            <div className="chat-empty-state">
              Describe the page you want to build. For example: “Create a SaaS landing page with a hero, pricing cards, FAQ, and smooth scroll animations.”
            </div>
          ) : (
            messages.map((message, key) => message.render(key))
          )}
        </div>

        <div className="chat-input">
          <TextareaAutosize
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Ask the AI to design or refine your page..."
            disabled={loadingResponse}
            minRows={2}
          />
          <SlTooltip content="Send">
            <SlButton
              onClick={sendMessage}
              aria-label="Send"
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
