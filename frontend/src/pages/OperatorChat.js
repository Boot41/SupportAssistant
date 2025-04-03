import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import ChatInput from '../components/ChatInput';
import './OperatorChat.css';

function OperatorChat() {
  const { sessionId } = useParams();
  const [messages, setMessages] = useState([]);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [session, setSession] = useState(null);
  const webSocketRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch session data and conversation history
  useEffect(() => {
    const fetchSession = async () => {
      try {
        const response = await fetch(`http://localhost:8000/sessions/${sessionId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch session data');
        }
        const data = await response.json();
        setSession(data);
        
        // Convert the conversation history to the format expected by the chat UI
        const formattedMessages = data.conversation.map(msg => {
          if (msg.role === 'user') {
            return {
              role: 'user',
              content: msg.content
            };
          } else if (msg.role === 'agent') {
            return {
              role: 'assistant',
              content: msg.content,
              agent: msg.agent
            };
          } else {
            return {
              role: 'system',
              content: msg.content
            };
          }
        });
        
        setMessages(formattedMessages);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchSession();
  }, [sessionId]);

  // Connect to WebSocket for operator
  useEffect(() => {
    const connectToWebSocket = () => {
      try {
        // Connect to operator WebSocket with the session ID
        const ws = new WebSocket(`ws://localhost:8000/operator/${sessionId}`);
        
        ws.onopen = () => {
          console.log('Operator WebSocket connected');
          setConnected(true);
          
          // Enable human override
          fetch(`http://localhost:8000/override/${sessionId}`, {
            method: 'POST'
          }).then(response => {
            if (!response.ok) {
              console.error('Failed to enable human override');
            } else {
              console.log('Human override enabled');
            }
          }).catch(err => {
            console.error('Error enabling human override:', err);
          });
        };
        
        ws.onmessage = (event) => {
          const data = JSON.parse(event.data);
          
          if (data.type === 'trace_event') {
            const traceEvent = data.trace;
            
            if (traceEvent.role === 'user') {
              // Add user message to chat
              setMessages(prev => [...prev, {
                role: 'user',
                content: traceEvent.content
              }]);
            }
          }
        };
        
        ws.onclose = () => {
          console.log('Operator WebSocket disconnected');
          setConnected(false);
        };
        
        ws.onerror = (error) => {
          console.error('Operator WebSocket error:', error);
          setConnected(false);
        };
        
        webSocketRef.current = ws;
      } catch (error) {
        console.error('Error connecting to operator WebSocket:', error);
        setError('Failed to connect to chat. Please try again.');
      }
    };
    
    if (sessionId) {
      connectToWebSocket();
    }
    
    // Cleanup function
    return () => {
      if (webSocketRef.current) {
        webSocketRef.current.close();
      }
    };
  }, [sessionId]);

  // Send message as operator
  const sendMessage = (message) => {
    if (!connected || !webSocketRef.current) {
      setError('WebSocket not connected. Please try again.');
      return;
    }
    
    // Add operator message to chat
    setMessages(prev => [...prev, {
      role: 'assistant',
      content: message,
      agent: 'HumanSupport'
    }]);
    
    // Send message to WebSocket
    webSocketRef.current.send(JSON.stringify({
      message: message
    }));
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  if (loading) {
    return <div className="loading">Loading chat...</div>;
  }

  if (error) {
    return <div className="error">Error: {error}</div>;
  }

  return (
    <div className="operator-chat">
      <div className="chat-header">
        <Link to="/operator" className="back-button">
          &larr; Back to Dashboard
        </Link>
        <h1>Live Support: Session {sessionId}</h1>
        {session && (
          <div className="session-info">
            <div className="info-item">
              <span className="info-label">Started:</span>
              <span className="info-value">{formatDate(session.started_at)}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Status:</span>
              <span className={`status ${session.resolved ? 'resolved' : 'active'}`}>
                {session.resolved ? 'Resolved' : 'Active'}
              </span>
            </div>
          </div>
        )}
      </div>
      
      <div className="chat-container">
        <div className="messages-container">
          <div className="operator-notice">
            <p>You are now chatting as a human support operator. The AI assistant has been paused.</p>
          </div>
          
          {messages.map((message, index) => (
            <div 
              key={index} 
              className={`message ${message.role === 'user' ? 'user-message' : 'assistant-message'}`}
            >
              {message.role !== 'user' && message.agent && (
                <div className="message-agent">{message.agent}</div>
              )}
              <div className="message-content">
                {message.content}
              </div>
            </div>
          ))}
          
          <div ref={messagesEndRef} />
        </div>
        
        <ChatInput 
          onSendMessage={sendMessage} 
          disabled={!connected} 
        />
      </div>
    </div>
  );
}

export default OperatorChat;
