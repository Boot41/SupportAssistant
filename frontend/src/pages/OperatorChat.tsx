import React, { useState, useRef, useEffect } from "react"
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"
import { Input } from "../ui/input"
import { ArrowLeft, Send, Clock, CheckCircle2, AlertCircle } from "lucide-react"
import OperatorNavbar from "../components/operator-navbar"
import { Link, useParams } from "react-router-dom"
import { cn } from "../lib/utils"

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  agent?: string;
  timestamp?: string;
}

interface SessionData {
  id: string;
  started_at: string;
  ended_at?: string;
  resolved: boolean;
  conversation: any[];
}

export default function OperatorSupportSession() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isResolved, setIsResolved] = useState(false);
  const [session, setSession] = useState<SessionData | null>(null);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const webSocketRef = useRef<WebSocket | null>(null);

  // Scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch session data and conversation history
  useEffect(() => {
    const fetchSession = async () => {
      if (!sessionId) {
        setError("Session ID not found");
        return;
      }

      try {
        const response = await fetch(`http://localhost:8001/sessions/${sessionId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch session data');
        }
        
        const data = await response.json();
        setSession(data);
        setIsResolved(data.resolved || false);
        
        // Convert the conversation history to the format expected by the chat UI
        const formattedMessages = data.conversation.map((msg: any) => {
          if (msg.role === 'user') {
            return {
              role: 'user',
              content: msg.content,
              timestamp: msg.timestamp
            };
          } else if (msg.role === 'agent') {
            return {
              role: 'assistant',
              content: msg.content,
              agent: msg.agent || 'AI Assistant',
              timestamp: msg.timestamp
            };
          } else {
            return {
              role: 'system',
              content: msg.content,
              timestamp: msg.timestamp
            };
          }
        });
        
        setMessages(formattedMessages);
      } catch (err) {
        console.error("Error fetching session:", err);
        setError("Failed to load session data");
        
        // Fallback to dummy data
        setMessages([
          {
            role: "user",
            content: "hi",
            timestamp: "02/04/2025, 16:20:28"
          },
          {
            role: "assistant",
            content: "How can I assist you today?",
            agent: "AI Assistant",
            timestamp: "02/04/2025, 16:20:29"
          },
          {
            role: "system",
            content: "Human support has taken over this conversation.",
            timestamp: "02/04/2025, 16:25:20"
          }
        ]);
      } finally {
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
        const ws = new WebSocket(`ws://localhost:8001/operator/${sessionId}`);
        
        ws.onopen = () => {
          console.log('Operator WebSocket connected');
          setConnected(true);
          
          // Enable human override
          fetch(`http://localhost:8001/override/${sessionId}`, {
            method: 'POST'
          }).then(response => {
            if (!response.ok) {
              console.error('Failed to enable human override');
            } else {
              console.log('Human override enabled');
              
              // Add system message about human override
              setMessages(prev => [...prev, {
                role: 'system',
                content: 'Human support has taken over this conversation.',
                timestamp: new Date().toLocaleString()
              }]);
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
                content: traceEvent.content,
                timestamp: new Date().toLocaleString()
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
    
    if (sessionId && !isResolved) {
      connectToWebSocket();
    }
    
    // Cleanup function
    return () => {
      if (webSocketRef.current) {
        webSocketRef.current.close();
      }
    };
  }, [sessionId, isResolved]);

  const handleSendMessage = () => {
    if (newMessage.trim() === "") return;
    if (!connected || !webSocketRef.current) {
      setError('WebSocket not connected. Please try again.');
      return;
    }

    // Add operator message to chat
    const message: Message = {
      role: 'assistant',
      content: newMessage,
      agent: 'Human Support',
      timestamp: new Date().toLocaleString()
    };

    setMessages([...messages, message]);
    
    // Send message to WebSocket
    webSocketRef.current.send(JSON.stringify({
      message: newMessage
    }));
    
    setNewMessage("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleResolveChat = async () => {
    if (!sessionId) return;

    try {
      const response = await fetch(`http://localhost:8001/sessions/${sessionId}/toggle-resolve`, {
        method: 'POST',
      });

      if (response.ok) {
        const resolvedMessage: Message = {
          role: 'system',
          content: "This session has been marked as resolved. The chat is now closed.",
          timestamp: new Date().toLocaleString()
        };

        setMessages([...messages, resolvedMessage]);
        setIsResolved(true);
        
        // Close WebSocket connection
        if (webSocketRef.current) {
          webSocketRef.current.close();
        }
      }
    } catch (err) {
      console.error("Error resolving session:", err);
      setError("Failed to resolve session. Please try again.");
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
    </div>
  }

  if (error) {
    return <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="text-red-500 text-xl">Error: {error}</div>
      <Link to="/operator" className="mt-4 text-indigo-600 hover:underline">
        Return to Dashboard
      </Link>
    </div>
  }

  return (
    <div className="min-h-screen bg-white">
      <OperatorNavbar />

      <div className="container mx-auto max-w-5xl py-6 px-4">
        <div className="flex items-center justify-between mb-6">
          <Link
            to="/operator"
            className="flex items-center text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            <span className="text-sm font-medium">Back to Dashboard</span>
          </Link>

          <div className="flex items-center space-x-2">
            <Badge className={isResolved ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-indigo-50 text-indigo-700 border border-indigo-200"}>
              {isResolved ? "Resolved" : "Active"}
            </Badge>
            <Badge className="bg-red-50 text-red-700 border border-red-200">High Priority</Badge>
          </div>
        </div>

        <div className="flex flex-col h-[calc(100vh-180px)] bg-white rounded-xl shadow-sm border border-slate-100">
          {/* Header */}
          <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-indigo-50 to-white shadow-sm">
            <div className="flex items-center">
              <div className="mr-4 h-10 w-10 rounded-full bg-indigo-600 flex items-center justify-center shadow-md ring-2 ring-indigo-100">
                <span className="text-white font-medium">S</span>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Session <span className="text-indigo-600">{sessionId}</span>
                </h2>
                <div className="flex items-center text-xs text-slate-500">
                  <Clock className="h-3 w-3 mr-1" />
                  Started: {session?.started_at ? formatDate(session.started_at) : "02/04/2025, 16:19:59"}
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="text-sm border-slate-200 text-slate-700 hover:bg-slate-50"
              onClick={handleResolveChat}
              disabled={isResolved}
            >
              <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
              {isResolved ? "Resolved" : "Resolve"}
            </Button>
          </div>

          {/* System notice */}
          <div className="px-6 py-3 bg-amber-50 border-b border-amber-100">
            <p className="text-sm text-amber-800 flex items-center">
              <AlertCircle className="h-4 w-4 mr-2" />
              You are now chatting as a human support operator. The AI assistant has been paused.
              {!connected && !isResolved && (
                <span className="ml-2 text-red-600 font-medium">Not connected to chat server</span>
              )}
            </p>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {messages.map((message, index) => {
              const isUser = message.role === 'user';
              const isSystem = message.role === 'system';
              const isAgent = message.role === 'assistant';
              
              return (
                <div 
                  key={index} 
                  className={cn(
                    "flex flex-col",
                    isUser ? "items-end" : "items-start",
                    isSystem ? "items-center" : "",
                  )}
                >
                  <div className="flex items-center mb-1 space-x-2">
                    <span className="text-xs font-medium text-slate-500">
                      {isAgent ? (message.agent || "AI Assistant") : isUser ? "User" : "System"}
                    </span>
                    {message.timestamp && (
                      <span className="text-xs text-slate-400">{message.timestamp}</span>
                    )}
                  </div>
                  
                  <div
                    className={cn(
                      "max-w-[80%] rounded-lg p-3",
                      isUser
                        ? "bg-slate-100 text-slate-800"
                        : isAgent
                          ? message.agent === "Human Support"
                            ? "bg-indigo-600 text-white"
                            : "bg-blue-50 border border-blue-100 text-slate-800"
                          : "bg-amber-50 border border-amber-100 text-amber-800 text-sm max-w-[90%]",
                    )}
                  >
                    <p className={isSystem ? "text-center" : ""}>{message.content}</p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <div className="p-4 border-t border-slate-100 bg-white">
            {isResolved ? (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-center">
                <p className="text-sm text-slate-600">This session has been resolved and is now closed</p>
                <Badge className="mt-1 bg-emerald-100 text-emerald-800">Resolved</Badge>
              </div>
            ) : (
              <div className="flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your message here..."
                  className="flex-1 border-slate-200 focus-visible:ring-indigo-500"
                  disabled={!connected}
                />
                <Button 
                  onClick={handleSendMessage} 
                  className="bg-indigo-600 hover:bg-indigo-700"
                  disabled={!connected || newMessage.trim() === ""}
                >
                  <Send className="h-4 w-4" />
                  <span className="sr-only">Send</span>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
