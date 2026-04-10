class ChatMessage {
  constructor(role, message, html, css, js, operations = []) {
    this.role = role;
    this.message = message;
    this.html = html;
    this.css = css;
    this.js = js;
    this.operations = Array.isArray(operations) ? operations : [];
  }

  render(key) {
    return (
      <div className={`chat-message ${this.role}`} key={key}>
        <div className="chat-message-role">{this.role === 'assistant' ? 'AI' : this.role === 'user' ? 'You' : 'System'}</div>
        <div className="chat-message-content">{this.message}</div>
        {this.operations.length > 0 && (
          <div className="chat-message-operations">
            {this.operations.map((operation, index) => (
              <div className="chat-message-operation" key={`${operation.tool}-${index}`}>
                {operation.label || operation.tool}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
}

export default ChatMessage;
