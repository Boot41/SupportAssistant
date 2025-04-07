import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, MessageSquare, CheckCircle, Clock, Users } from "lucide-react"
import AdminNavbar from "@/components/admin-navbar"

export default function AdminSessionDetails({ params }: { params: { id: string } }) {
  // Sample session data
  const sessionData = {
    id: params.id,
    started: "02/04/2025, 16:19:59",
    ended: "N/A",
    status: "Active",
    priority: "High",
    assignedTo: "Unassigned",
    conversation: [
      {
        id: "1",
        sender: "User",
        content: "hi",
        timestamp: "02/04/2025, 16:20:28",
      },
      {
        id: "2",
        sender: "TriageAgent",
        content: "How can I assist you today?",
        timestamp: "02/04/2025, 16:20:29",
      },
      {
        id: "3",
        sender: "System",
        content: "Human support has taken over this conversation.",
        timestamp: "02/04/2025, 16:25:20",
      },
    ],
  }

  const availableAgents = [
    { id: 1, name: "Sarah Johnson", status: "Available" },
    { id: 2, name: "Michael Chen", status: "Busy" },
    { id: 3, name: "Emily Rodriguez", status: "Away" },
    { id: 4, name: "David Kim", status: "Available" },
  ]

  return (
    <div className="min-h-screen bg-slate-50">
      <AdminNavbar />

      <main className="container mx-auto py-8 px-4">
        <div className="mb-6">
          <Link
            href="/admin/dashboard"
            className="flex items-center text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
        </div>

        <Card className="border-0 shadow-lg mb-6">
          <CardHeader className="bg-gradient-to-r from-slate-700 to-slate-900 text-white p-4 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xl font-bold">Session: {params.id}</CardTitle>
              <div className="flex flex-wrap gap-x-6 gap-y-2 mt-2 text-sm text-slate-300">
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  Started: {sessionData.started}
                </div>
                <div className="flex items-center">
                  Status: <Badge className="ml-2 bg-emerald-500 text-white">{sessionData.status}</Badge>
                </div>
                <div className="flex items-center">
                  Priority:
                  <Badge className="ml-2 bg-red-400 text-white">{sessionData.priority}</Badge>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="bg-transparent border-white text-white hover:bg-white hover:text-slate-900"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Mark as Resolved
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-slate-800 mb-4">Conversation History</h3>
                  <div className="space-y-4 bg-white p-4 rounded-lg border border-slate-200">
                    {sessionData.conversation.map((message) => {
                      let bgColor = "bg-white"
                      let textAlign = "text-left"
                      let border = "border border-slate-200"

                      if (message.sender === "User") {
                        bgColor = "bg-slate-100"
                        textAlign = "text-right"
                      } else if (message.sender === "TriageAgent") {
                        bgColor = "bg-sky-50"
                        border = "border border-sky-100"
                      } else if (message.sender === "System") {
                        bgColor = "bg-amber-50"
                        textAlign = "text-center"
                        border = "border border-amber-100"
                      } else if (message.sender === "HumanSupport") {
                        bgColor = "bg-slate-700 text-white"
                        border = ""
                      }

                      return (
                        <div key={message.id} className={`p-4 rounded-lg ${bgColor} ${border}`}>
                          <div className="flex justify-between items-center mb-2">
                            <div className="font-medium">
                              {message.sender === "TriageAgent" ? "AI Assistant" : message.sender}
                            </div>
                            <div className="text-sm text-slate-500">{message.timestamp}</div>
                          </div>
                          <div className={textAlign}>{message.content}</div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div className="flex gap-3">
                  <Link href={`/admin/support/${params.id}`} className="flex-1">
                    <Button className="w-full bg-slate-700 hover:bg-slate-800">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Join Chat as Admin
                    </Button>
                  </Link>
                </div>
              </div>

              <div>
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
                        {sessionData.assignedTo === "Unassigned" ? (
                          <Badge variant="outline" className="border-slate-400">
                            Unassigned
                          </Badge>
                        ) : (
                          <span className="font-medium">{sessionData.assignedTo}</span>
                        )}
                      </div>
                    </div>

                    <div className="mb-4">
                      <p className="text-sm text-slate-500 mb-2">Select Agent</p>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose an agent" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableAgents.map((agent) => (
                            <SelectItem key={agent.id} value={agent.id.toString()}>
                              <div className="flex items-center">
                                <span>{agent.name}</span>
                                <Badge
                                  className={
                                    agent.status === "Available"
                                      ? "ml-2 bg-emerald-100 text-emerald-800"
                                      : agent.status === "Busy"
                                        ? "ml-2 bg-amber-100 text-amber-800"
                                        : "ml-2 bg-slate-100 text-slate-800"
                                  }
                                >
                                  {agent.status}
                                </Badge>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <Button className="w-full bg-slate-800 hover:bg-slate-900">Assign Agent</Button>
                  </CardContent>
                </Card>

                <Card className="border border-slate-200 shadow-sm mt-6">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-semibold">Session Details</CardTitle>
                  </CardHeader>

                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-slate-500">Session ID</p>
                        <p className="font-mono text-sm">{params.id}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">Interview Type</p>
                        <p>Technical Assessment</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">Candidate</p>
                        <p>John Doe</p>
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
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

