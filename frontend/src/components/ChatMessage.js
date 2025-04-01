import React from 'react';

function ChatMessage({ message }) {
  const { role, content, agent } = message;
  const isUser = role === 'user';
  
  // Function to format message content with markdown-like styling
  const formatMessage = (text) => {
    if (!text) return '';
    
    // Format bold text (surrounded by **)
    const boldFormatted = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Split by newlines to handle numbered lists and paragraphs
    const lines = boldFormatted.split('\n');
    
    // Process each line for formatting
    const formattedLines = lines.map(line => {
      // Check if line is part of a numbered list (starts with number followed by period)
      if (/^\d+\.\s/.test(line)) {
        return `<div class="list-item">${line}</div>`;
      }
      return line;
    });
    
    // Join lines back with proper HTML breaks
    return formattedLines.join('<br />');
  };
  
  return (
    <div className={`message ${isUser ? 'user-message' : 'assistant-message'}`}>
      {!isUser && agent && <div className="message-agent">{agent}</div>}
      <div 
        className="message-content"
        dangerouslySetInnerHTML={{ __html: formatMessage(content) }}
      />
    </div>
  );
}

export default ChatMessage;
