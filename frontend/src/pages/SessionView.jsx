import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import './SessionView.css';

function SessionView() {
  const { sessionId } = useParams();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const response = await fetch(`http://localhost:8000/sessions/${sessionId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch session data');
        }
        const data = await response.json();
        setSession(data);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchSession();
  }, [sessionId]);

  useEffect(() => {
    // Scroll to bottom of conversation
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [session]);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const toggleMessageFlag = async (turnId) => {
    try {
      const response = await fetch(`http://localhost:8000/sessions/${sessionId}/flag/${turnId}`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Failed to toggle flag status');
      }
      
      // Update the session to reflect the change
      setSession(prevSession => {
        const updatedConversation = prevSession.conversation.map(message => {
          if (message.turn_id === turnId) {
            return { ...message, flagged: !message.flagged };
          }
          return message;
        });
        
        return { ...prevSession, conversation: updatedConversation };
      });
    } catch (err) {
      setError(err.message);
    }
  };

  const toggleResolveStatus = async () => {
    try {
      const response = await fetch(`http://localhost:8000/sessions/${sessionId}/toggle-resolve`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Failed to toggle resolve status');
      }
      
      // Update the session to reflect the change
      setSession(prevSession => ({
        ...prevSession,
        resolved: !prevSession.resolved
      }));
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return <div className="loading">Loading session data...</div>;
  }

  if (error) {
    return <div className="error">Error: {error}</div>;
  }

  if (!session) {
    return <div className="error">Session not found</div>;
  }

  return (
    <div className="session-view">
      <div className="session-header">
        <Link to="/operator" className="back-button">
          &larr; Back to Dashboard
        </Link>
        <h1>Session: {sessionId}</h1>
        <div className="session-meta">
          <div className="meta-item">
            <span className="meta-label">Started:</span>
            <span className="meta-value">{formatDate(session.started_at)}</span>
          </div>
          {session.ended_at && (
            <div className="meta-item">
              <span className="meta-label">Ended:</span>
              <span className="meta-value">{formatDate(session.ended_at)}</span>
            </div>
          )}
          <div className="meta-item">
            <span className="meta-label">Status:</span>
            <span className={`status ${session.resolved ? 'resolved' : 'active'}`}>
              {session.resolved ? 'Resolved' : 'Active'}
            </span>
          </div>
        </div>
        <div className="session-actions">
          <Link to={`/operator/chat/${sessionId}`} className="action-button chat">
            Join Chat
          </Link>
          <button 
            className={`action-button ${session.resolved ? 'unresolve' : 'resolve'}`}
            onClick={toggleResolveStatus}
          >
            {session.resolved ? 'Mark as Unresolved' : 'Mark as Resolved'}
          </button>
        </div>
      </div>

      <div className="conversation-container">
        <h2>Conversation History</h2>
        
        <div className="conversation">
          {session.conversation.map((message, index) => {
            const isUser = message.role === 'user';
            const isAgent = message.role === 'agent';
            const isSystem = message.role === 'system';
            
            return (
              <div 
                key={index} 
                className={`message ${isUser ? 'user' : isAgent ? 'agent' : 'system'} ${message.flagged ? 'flagged' : ''}`}
              >
                <div className="message-header">
                  <div className="message-meta">
                    {isAgent && message.agent && (
                      <span className="agent-name">{message.agent}</span>
                    )}
                    <span className="message-time">{formatDate(message.timestamp)}</span>
                  </div>
                  <div className="message-actions">
                    <button 
                      className={`flag-button ${message.flagged ? 'flagged' : ''}`}
                      onClick={() => toggleMessageFlag(message.turn_id)}
                      title={message.flagged ? 'Unflag this message' : 'Flag this message'}
                    >
                      ⚑
                    </button>
                  </div>
                </div>
                
                <div className="message-content">
                  {message.content}
                  
                  {/* Display tool call information if present */}
                  {message.tool_call && (
                    <div className="tool-call">
                      <div className="tool-name">Tool: {message.tool_call.name}</div>
                      <div className="tool-args">
                        <pre>{JSON.stringify(message.tool_call.args, null, 2)}</pre>
                      </div>
                      <div className="tool-output">
                        <pre>{JSON.stringify(message.tool_call.output, null, 2)}</pre>
                      </div>
                    </div>
                  )}
                  
                  {/* Display handoff information if present */}
                  {message.handoff && (
                    <div className="handoff">
                      <span className="handoff-from">{message.handoff.from}</span>
                      <span className="handoff-arrow">→</span>
                      <span className="handoff-to">{message.handoff.to}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>
    </div>
  );
}

export default SessionView;
