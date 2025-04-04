import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import './App.css';
import ChatMessage from './components/ChatMessage';
import ChatInput from './components/ChatInput';
import OperatorDashboard from './pages/OperatorDashboard';
import SessionView from './pages/SessionView';
import OperatorChat from './pages/OperatorChat';
import SignIn from './components/SignIn';

function UserChat() {
  const [messages, setMessages] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sessionInitialized, setSessionInitialized] = useState(false);
  const webSocketRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize session ID but don't connect to WebSocket yet
  useEffect(() => {
    const getSessionId = async () => {
      try {
        // Get session ID from backend
        const response = await fetch('http://localhost:8000/generate-session-id');
        const data = await response.json();
        setSessionId(data.session_id);
      } catch (error) {
        console.error('Error getting session ID:', error);
      }
    };
    
    getSessionId();
    
    // Cleanup function
    return () => {
      if (webSocketRef.current) {
        webSocketRef.current.close();
      }
    };
  }, []);

  // Initialize WebSocket connection only when user sends first message
  const initializeWebSocket = (messageToSend) => {
    if (sessionInitialized || !sessionId) return;
    
    setLoading(true);
    
    // Connect to WebSocket with the session ID
    const ws = new WebSocket(`ws://localhost:8000/ws/${sessionId}`);
    
    ws.onopen = () => {
      console.log('WebSocket connected');
      setConnected(true);
      setSessionInitialized(true);
      
      // Send the initial message once connected
      if (messageToSend) {
        ws.send(JSON.stringify({
          message: messageToSend
        }));
      }
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
      } else if (data.type === 'system') {
        setMessages(prev => [...prev, {
          role: 'system',
          content: data.content
        }]);
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
  };

  // Send message to WebSocket
  const sendMessage = (message) => {
    if (!sessionId) {
      console.error('No session ID available');
      return;
    }
    
    // Add user message to chat
    setMessages(prev => [...prev, {
      role: 'user',
      content: message
    }]);
    
    setLoading(true);
    
    // Initialize WebSocket if not already done
    if (!sessionInitialized) {
      initializeWebSocket(message);
      return;
    }
    
    // If already connected, send message directly
    if (connected && webSocketRef.current) {
      webSocketRef.current.send(JSON.stringify({
        message: message
      }));
    } else {
      console.error('WebSocket not connected');
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>Support Assistant</h1>
        <Link to="/signin" className="operator-link">Operator Dashboard</Link>
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
          disabled={loading} 
        />
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<UserChat />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/operator" element={<OperatorDashboard />} />
        <Route path="/operator/view/:sessionId" element={<SessionView />} />
        <Route path="/operator/chat/:sessionId" element={<OperatorChat />} />
      </Routes>
    </Router>
  );
}

export default App;
