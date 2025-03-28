import React from 'react';

function ChatMessage({ message }) {
  const { role, content, agent } = message;
  const isUser = role === 'user';
  
  return (
    <div className={`message ${isUser ? 'user-message' : 'assistant-message'}`}>
      {!isUser && agent && <div className="message-agent">{agent}</div>}
      <div className="message-content">{content}</div>
    </div>
  );
}

export default ChatMessage;
