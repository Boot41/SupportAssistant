import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, MessageSquare, CheckCircle, Clock } from "lucide-react"
import AgentNavbar from "@/components/agent-navbar"

export default function AgentSessionDetails({ params }: { params: { id: string } }) {
  // Sample session data
  const sessionData = {
    id: params.id,
    started: "02/04/2025, 16:19:59",
    ended: "N/A",
    status: "Active",
    priority: "High",
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
      {
        id: "4",
        sender: "HumanSupport",
        content: "hi",
        timestamp: "02/04/2025, 16:25:27",
      },
    ],
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <AgentNavbar />

      <main className="container mx-auto py-8 px-4">
        <div className="mb-6">
          <Link
            href="/agent/dashboard"
            className="flex items-center text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
        </div>

        <Card className="border-0 shadow-lg mb-6">
          <CardHeader className="bg-gradient-to-r from-emerald-700 to-emerald-900 text-white p-4 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xl font-bold">Session: {params.id}</CardTitle>
              <div className="flex flex-wrap gap-x-6 gap-y-2 mt-2 text-sm text-emerald-100">
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  Started: {sessionData.started}
                </div>
                <div className="flex items-center">
                  Status: <Badge className="ml-2 bg-white text-emerald-700">{sessionData.status}</Badge>
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
                className="bg-transparent border-white text-white hover:bg-white hover:text-emerald-900"
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
                        bgColor = "bg-emerald-700 text-white"
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
                  <Link href={`/agent/support/${params.id}`} className="flex-1">
                    <Button className="w-full bg-emerald-700 hover:bg-emerald-800">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Continue Chat
                    </Button>
                  </Link>
                </div>
              </div>

              <div>
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
                        <p className="text-sm text-slate-500">Duration</p>
                        <p>00:05:34</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">AI Handoff Reason</p>
                        <p>Technical question beyond AI scope</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">Status</p>
                        <Badge className="bg-emerald-100 text-emerald-800">{sessionData.status}</Badge>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">Priority</p>
                        <Badge className="bg-red-100 text-red-800">{sessionData.priority}</Badge>
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

