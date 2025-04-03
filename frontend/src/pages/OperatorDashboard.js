import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './OperatorDashboard.css';

function OperatorDashboard() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch sessions from the backend
    const fetchSessions = async () => {
      try {
        const response = await fetch('http://localhost:8000/sessions');
        if (!response.ok) {
          throw new Error('Failed to fetch sessions');
        }
        const data = await response.json();
        setSessions(data);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchSessions();
    
    // Set up polling to refresh the sessions list every 30 seconds
    const interval = setInterval(fetchSessions, 30000);
    
    // Clean up interval on component unmount
    return () => clearInterval(interval);
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const toggleResolveStatus = async (sessionId) => {
    try {
      const response = await fetch(`http://localhost:8000/sessions/${sessionId}/toggle-resolve`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Failed to toggle resolve status');
      }
      
      // Update the sessions list to reflect the change
      setSessions(sessions.map(session => {
        if (session.session_id === sessionId) {
          return { ...session, resolved: !session.resolved };
        }
        return session;
      }));
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return <div className="loading">Loading sessions...</div>;
  }

  if (error) {
    return <div className="error">Error: {error}</div>;
  }

  return (
    <div className="operator-dashboard">
      <h1>Operator Dashboard</h1>
      
      <div className="sessions-list">
        <h2>Active Sessions</h2>
        
        {sessions.length === 0 ? (
          <p>No active sessions found.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Session ID</th>
                <th>Started</th>
                <th>Ended</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((session) => (
                <tr key={session.session_id} className={session.resolved ? 'resolved' : ''}>
                  <td>{session.session_id}</td>
                  <td>{formatDate(session.started_at)}</td>
                  <td>{formatDate(session.ended_at)}</td>
                  <td>
                    <span className={`status ${session.resolved ? 'resolved' : 'active'}`}>
                      {session.resolved ? 'Resolved' : 'Active'}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <Link to={`/operator/chat/${session.session_id}`} className="action-button chat">
                        Chat
                      </Link>
                      <Link to={`/operator/view/${session.session_id}`} className="action-button view">
                        View
                      </Link>
                      <button 
                        className={`action-button ${session.resolved ? 'unresolve' : 'resolve'}`}
                        onClick={() => toggleResolveStatus(session.session_id)}
                      >
                        {session.resolved ? 'Unresolve' : 'Resolve'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default OperatorDashboard;
