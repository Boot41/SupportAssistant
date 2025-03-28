import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import ChatMessage from './components/ChatMessage';
import ChatInput from './components/ChatInput';

function App() {
  const [messages, setMessages] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const webSocketRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize session and connect to WebSocket
  useEffect(() => {
    const initializeSession = async () => {
      try {
        // Get session ID from backend
        const response = await fetch('http://localhost:8000/generate-session-id');
        const data = await response.json();
        setSessionId(data.session_id);
        
        // Connect to WebSocket with the session ID
        const ws = new WebSocket(`ws://localhost:8000/ws/${data.session_id}`);
        
        ws.onopen = () => {
          console.log('WebSocket connected');
          setConnected(true);
          setLoading(false);
        };
        
        ws.onmessage = (event) => {
          const data = JSON.parse(event.data);
          
          if (data.type === 'message') {
            setMessages(prev => [...prev, {
              role: 'assistant',
              content: data.content,
              agent: data.agent
            }]);
          } else if (data.type === 'handoff') {
            console.log(`Handoff from ${data.source} to ${data.target}`);
            // You could add a system message here if you want to show handoffs in the UI
          }
          
          setLoading(false);
        };
        
        ws.onclose = () => {
          console.log('WebSocket disconnected');
          setConnected(false);
        };
        
        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          setConnected(false);
          setLoading(false);
        };
        
        webSocketRef.current = ws;
      } catch (error) {
        console.error('Error initializing session:', error);
        setLoading(false);
      }
    };
    
    setLoading(true);
    initializeSession();
    
    // Cleanup function
    return () => {
      if (webSocketRef.current) {
        webSocketRef.current.close();
      }
    };
  }, []);

  // Send message to WebSocket
  const sendMessage = (message) => {
    if (!connected || !webSocketRef.current) {
      console.error('WebSocket not connected');
      return;
    }
    
    // Add user message to chat
    setMessages(prev => [...prev, {
      role: 'user',
      content: message
    }]);
    
    // Send message to WebSocket
    webSocketRef.current.send(JSON.stringify({
      message: message
    }));
    
    setLoading(true);
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>Support Assistant</h1>
      </header>
      
      <div className="chat-container">
        <div className="messages-container">
          {messages.length === 0 && !loading && (
            <div className="welcome-message">
              <h2>Welcome to Support Assistant!</h2>
              <p>How can I help you today?</p>
            </div>
          )}
          
          {messages.map((message, index) => (
            <ChatMessage 
              key={index} 
              message={message} 
            />
          ))}
          
          {loading && (
            <div className="loading-message">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
        
        <ChatInput 
          onSendMessage={sendMessage} 
          disabled={!connected || loading} 
        />
      </div>
    </div>
  );
}

export default App;
