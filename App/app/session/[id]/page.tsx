import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, MessageSquare, CheckCircle } from "lucide-react"

export default function SessionDetails({ params }: { params: { id: string } }) {
  // Sample conversation data
  const sessionData = {
    id: params.id,
    started: "02/04/2025, 16:19:59",
    ended: "02/04/2025, 16:20:33",
    status: "Active",
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
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <Link href="/" className="flex items-center text-slate-600 hover:text-slate-900 transition-colors">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Link>
      </div>

      <Card className="shadow-lg border-0 mb-6">
        <CardHeader className="bg-gradient-to-r from-slate-700 to-slate-900 text-white p-4">
          <CardTitle className="text-xl font-bold">Session: {params.id}</CardTitle>
          <div className="flex flex-wrap gap-x-6 gap-y-2 mt-2 text-sm text-slate-300">
            <div>Started: {sessionData.started}</div>
            <div>Ended: {sessionData.ended}</div>
            <div className="flex items-center">
              Status: <Badge className="ml-2 bg-emerald-500 text-white">{sessionData.status}</Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4">
          <div className="flex gap-3 mb-6">
            <Link href={`/support/${params.id}`}>
              <Button className="bg-slate-700 hover:bg-slate-800">
                <MessageSquare className="h-4 w-4 mr-2" />
                Join Chat
              </Button>
            </Link>
            <Button variant="outline" className="border-emerald-300 text-emerald-700 hover:bg-emerald-50">
              <CheckCircle className="h-4 w-4 mr-2" />
              Mark as Resolved
            </Button>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Conversation History</h3>
            <div className="space-y-4">
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
        </CardContent>
      </Card>
    </div>
  )
}

