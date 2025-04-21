import React, { useState, useEffect, useRef } from "react"
import { Button } from "../ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Badge } from "../ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { ArrowLeft, MessageSquare, Clock, Users, AlertCircle, Flag, CheckCircle } from "lucide-react"
import OperatorNavbar from "../components/operator-navbar"
import { Link, useParams } from "react-router-dom"
import { useToast } from "../ui/use-toast"

// Define TypeScript interfaces for our data structures
interface Message {
  id: string
  sender: "User" | "TriageAgent" | "System" | "HumanSupport"
  content: string
  timestamp: string
  flagged?: boolean
  turn_id?: string
  tool_call?: {
    name: string
    args: any
    output: any
  }
  handoff?: {
    from: string
    to: string
  }
}

interface Agent {
  id: number
  name: string
  status: "Available" | "Busy" | "Away"
}

interface TicketData {
  id: string
  started: string
  started_at?: string
  ended: string
  ended_at?: string
  status: "Active" | "Resolved"
  resolved?: boolean
  priority: "High" | "Medium" | "Low"
  assignedTo: string
  hasJoined: boolean
  resolvedBy: string | null
  resolvedAt: string | null
  conversation: Message[]
}

// Define types for operators
interface Operator {
  full_name: string;
  email: string;
}

interface OperatorsResponse {
  operators: Operator[];
  total_count: number;
}

export default function OperatorTicketDetails() {
  const { ticketId } = useParams<{ ticketId: string }>()
  const [ticketData, setTicketData] = useState<TicketData | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [Operators, setOperators] = useState<OperatorsResponse | null>(null);
  const [selectedOperatorEmail, setSelectedOperatorEmail] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const storedUserData=localStorage.getItem('userData');
  const userData=JSON.parse(storedUserData || '');
  const { toast } = useToast();
  console.log(userData);
  useEffect(() => {
    // Fetch agent schedule data
    const fetchAgentSchedule = async () => {
      try {
        const response = await fetch('http://localhost:8001/operators');
        if (!response.ok) {
          throw new Error('Failed to fetch agent schedule');
        }
        const data = await response.json();
        console.log(data);
        setOperators(data);
      } catch (error) {
        console.error('Error fetching agent schedule:', error);
      }
    };

    fetchAgentSchedule();
  }, []);


  console.log("operator",Operators)
  const availableAgents: Agent[] = [
    { id: 1, name: "Sarah Johnson", status: "Available" },
    { id: 2, name: "Michael Chen", status: "Busy" },
    { id: 3, name: "Emily Rodriguez", status: "Away" },
    { id: 4, name: "David Kim", status: "Available" },
  ]

  useEffect(() => {
    const fetchTicket = async () => {
      if (!ticketId) return

      try {
        // First try to fetch from API
        const response = await fetch(`http://localhost:8001/tickets/${ticketId}`)

        if (response.ok) {
          const data = await response.json()
          // Transform API data to match our TicketData interface
          setTicketData({
            id: data.id || ticketId,
            started: formatDate(data.started_at) || "02/04/2025, 16:19:59",
            ended: data.ended_at ? formatDate(data.ended_at) : "N/A",
            status: data.resolved ? "Resolved" : "Active",
            priority: "High", // Assuming default if not provided by API
            assignedTo: data.assigned_to || "Unassigned",
            hasJoined: false, // Default value
            resolvedBy: data.resolved_by || null,
            resolvedAt: data.resolved_at ? formatDate(data.resolved_at) : null,
            conversation: data.conversation.map((msg: any) => ({
              id: msg.turn_id || String(Math.random()),
              sender: mapRoleToSender(msg.role),
              content: msg.content,
              timestamp: formatDate(msg.timestamp),
              flagged: msg.flagged || false,
              turn_id: msg.turn_id,
              tool_call: msg.tool_call,
              handoff: msg.handoff
            }))
          })
        } else {
          // If API fails, use dummy data
          useDummyData()
        }
      } catch (err) {
        console.error("Error fetching session:", err)
        // Fallback to dummy data
        useDummyData()
      } finally {
        setLoading(false)
      }
    }

    const useDummyData = () => {
      // Sample session data as fallback
      setTicketData({
        id: ticketId || "",
        started: "02/04/2025, 16:19:59",
        ended: ticketId === "c4b09654a413" || ticketId === "f89926cefc59" || ticketId === "8e17e075d8fa" ? "02/04/2025, 16:47:46" : "N/A",
        status: ticketId === "c4b09654a413" || ticketId === "f89926cefc59" || ticketId === "8e17e075d8fa" ? "Resolved" : "Active",
        priority: "High",
        assignedTo: "Unassigned",
        hasJoined: ticketId === "ebfa85eb1c97" || ticketId === "80b74a3e1f4b",
        resolvedBy: ticketId === "c4b09654a413" ? "Sarah Johnson" : ticketId === "f89926cefc59" ? "Michael Chen" : ticketId === "8e17e075d8fa" ? "Emily Rodriguez" : null,
        resolvedAt: ticketId === "c4b09654a413" || ticketId === "f89926cefc59" || ticketId === "8e17e075d8fa" ? "02/04/2025, 16:47:46" : null,
        conversation: [
          {
            id: "1",
            sender: "User",
            content: "hi",
            timestamp: "02/04/2025, 16:20:28",
            flagged: false,
            turn_id: "1"
          },
          {
            id: "2",
            sender: "TriageAgent",
            content: "How can I assist you today?",
            timestamp: "02/04/2025, 16:20:29",
            flagged: false,
            turn_id: "2"
          },
          {
            id: "3",
            sender: "System",
            content: "Human support has taken over this conversation.",
            timestamp: "02/04/2025, 16:25:20",
            flagged: false,
            turn_id: "3"
          },
        ],
      })
    }

    fetchTicket()
  }, [ticketId])

  useEffect(() => {
    // Scroll to bottom of conversation when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [ticketData?.conversation])

  const formatDate = (dateString?: string) => {
    if (!dateString) return ""
    const date = new Date(dateString)
    return date.toLocaleString()
  }

  const mapRoleToSender = (role?: string): "User" | "TriageAgent" | "System" | "HumanSupport" => {
    switch (role) {
      case 'user': return "User"
      case 'agent': return "TriageAgent"
      case 'system': return "System"
      case 'human': return "HumanSupport"
      default: return "System"
    }
  }

  const toggleMessageFlag = async (turnId: string) => {
    if (!ticketId || !ticketData) return

    try {
      // Try to call API
      const response = await fetch(`http://localhost:8001/tickets/${ticketId}/flag/${turnId}`, {
        method: 'POST',
      })

      // Update local state regardless of API response
      setTicketData(prevData => {
        if (!prevData) return prevData

        const updatedConversation = prevData.conversation.map(message => {
          if (message.turn_id === turnId) {
            return { ...message, flagged: !message.flagged }
          }
          return message
        })

        return { ...prevData, conversation: updatedConversation }
      })
    } catch (err) {
      console.error("Error toggling flag:", err)
    }
  }

  const toggleResolveStatus = async () => {
    if (!ticketId || !ticketData) return

    try {
      // Try to call API
      const response = await fetch(`http://localhost:8001/tickets/${ticketId}/toggle-resolve`, {
        method: 'POST',
      })

      // Update local state regardless of API response
      setTicketData(prevData => {
        if (!prevData) return prevData

        const newStatus = prevData.status === "Active" ? "Resolved" : "Active"
        const now = new Date().toLocaleString()

        return {
          ...prevData,
          status: newStatus,
          ended: newStatus === "Resolved" ? now : "N/A",
          resolvedAt: newStatus === "Resolved" ? now : null,
          resolvedBy: newStatus === "Resolved" ? "Current Operator" : null
        }
      })
    } catch (err) {
      console.error("Error toggling resolve status:", err)
    }
  }

  const assignAgent = async (agentEmail: string) => {
    setSelectedOperatorEmail(agentEmail);
  }

  const handleTicketTransfer = async () => {
    if (!ticketId || !selectedOperatorEmail || !userData?.email) return;

    try {
      // Call the ticket-transfer API
      const response = await fetch('http://localhost:8001/ticket-transfer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: userData.email,
          to: selectedOperatorEmail,
          ticketId: ticketId
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Ticket transfer successful:", data);
        
        // Update UI to show transfer was successful
        toast({
          title: "Ticket Transfer Initiated",
          description: "The operator has been notified about this ticket.",
          status: "success"
        });
        
        // Update local state to show the assigned operator
        const selectedOperator = Operators?.operators?.find(op => op.email === selectedOperatorEmail);
        if (selectedOperator && ticketData) {
          setTicketData({
            ...ticketData,
            assignedTo: selectedOperator.full_name
          });
        }
      } else {
        const errorData = await response.json();
        console.error("Ticket transfer failed:", errorData);
        toast({
          title: "Transfer Failed",
          description: errorData.detail || "Failed to transfer the ticket. Please try again.",
          status: "error"
        });
      }
    } catch (error) {
      console.error("Error transferring ticket:", error);
      toast({
        title: "Transfer Failed",
        description: "An error occurred while transferring the ticket. Please try again.",
        status: "error"
      });
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
    </div>
  }

  if (error || !ticketData) {
    return <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="text-red-500 text-xl">Error: {error || "Ticket not found"}</div>
      <Link to="/operator/dashboard" className="mt-4 text-indigo-600 hover:underline">
        Return to Dashboard
      </Link>
    </div>
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <OperatorNavbar />

      <main className="container mx-auto py-8 px-4">
        <div className="mb-6">
          <Link
            to="/operator"
            className="flex items-center text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
        </div>

        <Card className="border-0 shadow-lg mb-6">
          <CardHeader className="bg-gradient-to-r from-indigo-700 to-indigo-900 text-white p-4 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xl font-bold">Ticket: {ticketId}</CardTitle>
              <div className="flex flex-wrap gap-x-6 gap-y-2 mt-2 text-sm text-indigo-100">
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  Started: {ticketData.started}
                </div>
                <div className="flex items-center">
                  Status:
                  <Badge
                    className={`ml-2 ${
                      ticketData.status === "Active"
                        ? "bg-white text-indigo-700"
                        : "bg-emerald-400 text-white"
                    }`}
                  >
                    {ticketData.status}
                  </Badge>
                </div>
                <div className="flex items-center">
                  Priority:
                  <Badge className="ml-2 bg-red-400 text-white">{ticketData.priority}</Badge>
                </div>
              </div>
            </div>
            {/* <div className="flex gap-2">
              {ticketData.status === "Active" && !ticketData.hasJoined && (
                <div className="bg-indigo-800 px-3 py-2 rounded-md text-xs text-indigo-100 flex items-center">
                  <AlertCircle className="h-3.5 w-3.5 mr-1.5" />
                  Join chat to resolve
                </div>
              )}
            </div> */}
          </CardHeader>

          <CardContent className="p-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <div className="mb-6">
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-slate-800">Conversation History</h3>
                      <Badge variant="outline" className="px-2 py-1 border-indigo-200 text-indigo-700 bg-indigo-50">
                        <Clock className="h-3 w-3 mr-1" />
                        {ticketData.conversation.length} messages
                      </Badge>
                    </div>

                    <div className="bg-gradient-to-b from-white to-slate-50 rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                      <div className="bg-indigo-50 border-b border-indigo-100 px-4 py-3 flex items-center">
                        <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-medium mr-3">
                          AI
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-800">Interview Support Ticket</p>
                          <p className="text-xs text-slate-500">Started {ticketData.started}</p>
                        </div>
                      </div>

                      <div className="p-4 space-y-4 max-h-[500px] overflow-y-auto">
                        {ticketData.conversation.map((message: Message, index: number) => {
                          const containerClasses = "flex flex-col";
                          let messageBg = "bg-white";
                          let messageTextColor = "text-slate-800";
                          let messageBorder = "border border-slate-200";
                          let messageAlignment = "items-start";
                          let avatarBg = "bg-slate-200";
                          let avatarText = "text-slate-600";
                          let avatarContent = message.sender.charAt(0);

                          if (message.sender === "User") {
                            messageBg = "bg-slate-100";
                            messageAlignment = "items-end";
                            avatarBg = "bg-slate-400";
                            avatarText = "text-white";
                            avatarContent = "U";
                          } else if (message.sender === "TriageAgent") {
                            messageBg = "bg-blue-50";
                            messageBorder = "border border-blue-100";
                            avatarBg = "bg-blue-600";
                            avatarText = "text-white";
                            avatarContent = "AI";
                          } else if (message.sender === "System") {
                            messageBg = "bg-amber-50";
                            messageBorder = "border border-amber-100";
                            messageTextColor = "text-amber-800";
                            messageAlignment = "items-center";
                            avatarBg = "bg-amber-500";
                            avatarText = "text-white";
                            avatarContent = "S";
                          } else if (message.sender === "HumanSupport") {
                            messageBg = "bg-indigo-600";
                            messageBorder = "border-0";
                            messageTextColor = "text-white";
                            avatarBg = "bg-indigo-800";
                            avatarText = "text-white";
                            avatarContent = "H";
                          }

                          // Add flagged styling
                          if (message.flagged) {
                            messageBg = "bg-red-50";
                            messageBorder = "border border-red-200";
                          }

                          return (
                            <div key={message.id} className={`${containerClasses} ${messageAlignment}`}>
                              <div className="flex items-start gap-3 max-w-[85%]">
                                {message.sender !== "User" && (
                                  <div className={`w-8 h-8 rounded-full ${avatarBg} flex-shrink-0 flex items-center justify-center ${avatarText} text-sm font-medium`}>
                                    {avatarContent}
                                  </div>
                                )}

                                <div
                                  className={`rounded-lg p-3 ${messageBg} ${messageBorder} ${messageTextColor} shadow-sm relative overflow-hidden ${
                                    message.sender === "System" ? "border-l-4 border-l-amber-500 pl-4 bg-amber-50 text-amber-800" : ""
                                  } ${message.flagged ? "border-l-4 border-l-red-500" : ""}`}
                                >
                                  {message.sender === "System" && (
                                    <div className="absolute left-0 top-0 bottom-0 flex items-center justify-center">
                                      <div className="w-1 h-full bg-amber-500"></div>
                                    </div>
                                  )}
                                  <div className="flex justify-between items-center mb-1">
                                    <span className={`font-medium text-sm flex items-center ${message.sender === "System" ? "text-amber-800" : ""}`}>
                                      {message.sender === "System" && (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-amber-600" viewBox="0 0 20 20" fill="currentColor">
                                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                      )}
                                      {message.sender === "TriageAgent" ? "AI Assistant" : message.sender}
                                      
                                      {/* Flag button */}
                                      <button 
                                        onClick={() => message.turn_id && toggleMessageFlag(message.turn_id)}
                                        className={`ml-2 p-1 rounded-full ${message.flagged ? 'text-red-500' : 'text-gray-400 hover:text-gray-600'}`}
                                        title={message.flagged ? "Remove flag" : "Flag this message"}
                                      >
                                        <Flag className="h-3 w-3" />
                                      </button>
                                    </span>
                                    <span className="text-xs opacity-70 ml-4">
                                      {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  </div>
                                  <p className={message.sender === "System" ? "text-center font-medium" : ""}>{message.content}</p>
                                  
                                  {/* Display tool call information if present */}
                                  {message.tool_call && (
                                    <div className="mt-2 p-2 bg-slate-100 rounded-md text-xs font-mono">
                                      <div className="font-semibold">Tool: {message.tool_call.name}</div>
                                      <div className="mt-1">
                                        <pre className="whitespace-pre-wrap">{JSON.stringify(message.tool_call.args, null, 2)}</pre>
                                      </div>
                                      <div className="mt-1 pt-1 border-t border-slate-200">
                                        <pre className="whitespace-pre-wrap">{JSON.stringify(message.tool_call.output, null, 2)}</pre>
                                      </div>
                                    </div>
                                  )}
                                  
                                  {/* Display handoff information if present */}
                                  {message.handoff && (
                                    <div className="mt-2 p-2 bg-indigo-50 rounded-md text-xs text-indigo-700 flex items-center justify-center">
                                      <span className="font-semibold">{message.handoff.from}</span>
                                      <ArrowLeft className="h-3 w-3 mx-2" />
                                      <span className="font-semibold">{message.handoff.to}</span>
                                    </div>
                                  )}
                                </div>

                                {message.sender === "User" && (
                                  <div className={`w-8 h-8 rounded-full ${avatarBg} flex-shrink-0 flex items-center justify-center ${avatarText} text-sm font-medium`}>
                                    {avatarContent}
                                  </div>
                                )}
                              </div>

                              {index < ticketData.conversation.length - 1 && message.sender !== ticketData.conversation[index + 1].sender && (
                                <div className="w-full my-2 border-b border-slate-100"></div>
                              )}
                            </div>
                          );
                        })}
                        <div ref={messagesEndRef} />
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    {ticketData.status === "Active" ? (
                      <>
                        <Link to={`/operator/chat/${ticketId}`} className="flex-1">
                          <Button className="w-full bg-indigo-700 hover:bg-indigo-800 text-white">
                            <MessageSquare className="h-4 w-4 mr-2" />
                            {ticketData.hasJoined ? "Return to Chat" : "Join Chat"}
                          </Button>
                        </Link>
                        <Button 
                          className="bg-emerald-600 hover:bg-emerald-700 text-white"
                          onClick={toggleResolveStatus}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Mark as Resolved
                        </Button>
                      </>
                    ) : (
                      <>
                        <div className="w-full p-4 bg-slate-50 border border-slate-200 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-slate-700">Resolved by</p>
                              <p className="text-base font-semibold text-indigo-700">{ticketData.resolvedBy}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-slate-700">Resolved at</p>
                              <p className="text-sm text-slate-600">{ticketData.resolvedAt}</p>
                            </div>
                            <Badge className="bg-emerald-100 text-emerald-800">Closed</Badge>
                          </div>
                          <p className="mt-2 text-xs text-slate-500">This ticket has been marked as resolved and cannot be continued</p>
                        </div>
                        {/* <Button 
                          className="bg-amber-500 hover:bg-amber-600"
                          onClick={toggleResolveStatus}
                        >
{{ ... }}
                        </Button> */}
                      </>
                    )}
                  </div>
                </div>

                <div>
                  <Card className="border border-slate-200 shadow-sm mt-6">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg font-semibold">Ticket Details</CardTitle>
                    </CardHeader>

                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm text-slate-500">Ticket ID</p>
                          <p className="font-mono text-sm">{ticketId}</p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-500">Interview Type</p>
                          <p>Technical Assessment</p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-500">Candidate</p>
                          <p className="flex items-center">
                            <span className="bg-slate-200 rounded-md px-2 py-1 text-slate-400 text-xs font-mono">ID: {ticketId?.substring(0, 8)}</span>
                            <Badge variant="outline" className="ml-2 text-xs">
                              Name hidden for privacy
                            </Badge>
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-500">Position</p>
                          <p>Senior Software Engineer</p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-500">Duration</p>
                          <p>00:05:34</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
              <div className="lg:col-span-1">
                {ticketData.status === "Active" && (
                  <Card className="border border-slate-200 shadow-sm">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg font-semibold flex items-center">
                        <Users className="mr-2 h-5 w-5 text-slate-600" />
                        Assign Support Agent
                      </CardTitle>
                    </CardHeader>

                    <CardContent>
                      <div className="mb-4">
                        <p className="text-sm text-slate-500 mb-2">Current Assignment</p>
                        <div className="p-3 bg-slate-100 rounded-lg text-center">
                          {ticketData.assignedTo === "Unassigned" ? (
                            <Badge variant="outline" className="border-slate-400">
                              Unassigned
                            </Badge>
                          ) : (
                            <span className="font-medium">{ticketData.assignedTo}</span>
                          )}
                        </div>
                      </div>

                      <div className="mb-4 relative">
                        <p className="text-sm text-slate-500 mb-2">Select Agent</p>
                        <Select onValueChange={assignAgent}>
                        <SelectTrigger className="w-full">
                        <SelectValue placeholder="Choose an agent" />
                          </SelectTrigger>
                          <SelectContent position="popper" sideOffset={5} className="z-[9999] bg-white shadow-lg border border-slate-200 rounded-md">
                            {Operators?.operators?.map((operator) => (
                              <SelectItem key={operator.email} value={operator.email}>
                                <div className="flex items-center">
                                  <span>{operator.full_name}</span>
                                  <Badge className="ml-2 bg-emerald-100 text-emerald-800">
                                    Available
                                  </Badge>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <Button 
                        className="w-full bg-indigo-800 hover:bg-indigo-900 text-white"
                        onClick={handleTicketTransfer}
                        disabled={!selectedOperatorEmail}
                      >
                        Assign Agent
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
