import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import './App.css';
import ChatMessage from './components/ChatMessage.jsx';
import ChatInput from './components/ChatInput.jsx';
import OperatorDashboard from './pages/OperatorDashboard.tsx';
import TicketView from './pages/TicketView';
import OperatorChat from './pages/OperatorChat.tsx';
import SignIn from './components/SignIn.tsx';
import { GoogleOAuthProvider } from '@react-oauth/google';

// Define interfaces for better type safety
interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  agent?: string;
}

interface TicketData {
  ticket_id: string;
}

function UserChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [ticketId, setSessionId] = useState<string | null>(null);
  const [connected, setConnected] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [ticketInitialized, setSessionInitialized] = useState<boolean>(false);
  const webSocketRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize ticket ID but don't connect to WebSocket yet
  useEffect(() => {
    const getTicketId = async () => {
      try {
        const response = await fetch('http://localhost:8001/generate-ticket-id');
        const data: TicketData = await response.json();
        setSessionId(data.ticket_id);
      } catch (error) {
        console.error('Error getting ticket ID:', error);
      }
    };
    
    getTicketId();
    
    return () => {
      if (webSocketRef.current) {
        webSocketRef.current.close();
      }
    };
  }, []);

  // Initialize WebSocket connection only when user sends first message
  const initializeWebSocket = (messageToSend: string) => {
    if (ticketInitialized || !ticketId) return;
    
    setLoading(true);
    
    const ws = new WebSocket(`ws://localhost:8001/ws/${ticketId}`);
    
    ws.onopen = () => {
      console.log('WebSocket connected');
      setConnected(true);
      setSessionInitialized(true);
      
      if (messageToSend) {
        ws.send(JSON.stringify({ message: messageToSend }));
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

  const sendMessage = (message: string) => {
    if (!ticketId) {
      console.error('No ticket ID available');
      return;
    }
    
    setMessages(prev => [...prev, {
      role: 'user',
      content: message
    }]);
    
    setLoading(true);
    
    if (!ticketInitialized) {
      initializeWebSocket(message);
      return;
    }
    
    if (connected && webSocketRef.current) {
      webSocketRef.current.send(JSON.stringify({ message }));
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
    <GoogleOAuthProvider clientId="274055029862-30ju5vqba01in57ftvv1i0n6mi6loo7d.apps.googleusercontent.com">
      <Router>
        <Routes>
          <Route path="/" element={<UserChat />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/operator" element={<OperatorDashboard />} />
          <Route path="/operator/view/:ticketId" element={<TicketView />} />
          <Route path="/operator/chat/:ticketId" element={<OperatorChat />} />
        </Routes>
      </Router>
    </GoogleOAuthProvider>
  );
}

export default App;
