"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Send, Clock, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface Message {
  id: string
  sender: "User" | "TriageAgent" | "System" | "HumanSupport"
  content: string
  timestamp: string
}

export default function SupportSession({ params }: { params: { id: string } }) {
  const [messages, setMessages] = useState<Message[]>([
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
  ])

  const [newMessage, setNewMessage] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = () => {
    if (newMessage.trim() === "") return

    const message: Message = {
      id: Date.now().toString(),
      sender: "HumanSupport",
      content: newMessage,
      timestamp: new Date().toLocaleString(),
    }

    setMessages([...messages, message])
    setNewMessage("")
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
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
        <CardHeader className="bg-gradient-to-r from-slate-700 to-slate-900 text-white p-4 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-xl font-bold">Live Support: Session {params.id}</CardTitle>
            <div className="flex items-center mt-2 text-sm text-slate-300">
              <Clock className="h-4 w-4 mr-1" />
              Started: 02/04/2025, 16:19:59
              <Badge className="ml-4 bg-emerald-500 text-white">Active</Badge>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="bg-transparent border-white text-white hover:bg-white hover:text-slate-900"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Mark as Resolved
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="bg-slate-50 p-4 border-b border-slate-200">
            <div className="flex items-center">
              <Badge className="bg-sky-100 text-sky-800 mr-2">Notice</Badge>
              <p className="text-slate-700">
                You are now chatting as a human support operator. The AI assistant has been paused.
              </p>
            </div>
          </div>

          <div className="h-[400px] overflow-y-auto p-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "mb-4 max-w-[80%] rounded-lg p-3",
                  message.sender === "User" ? "ml-auto bg-slate-100" : "",
                  message.sender === "TriageAgent" ? "bg-sky-50 border border-sky-100" : "",
                  message.sender === "HumanSupport" ? "bg-slate-700 text-white" : "",
                  message.sender === "System"
                    ? "mx-auto bg-amber-50 border border-amber-100 text-amber-800 text-sm max-w-[90%]"
                    : "",
                )}
              >
                <div className="flex justify-between items-start mb-1">
                  <span
                    className={cn(
                      "text-xs font-semibold",
                      message.sender === "HumanSupport" ? "text-slate-300" : "text-slate-500",
                    )}
                  >
                    {message.sender === "TriageAgent" ? "AI Assistant" : message.sender}
                  </span>
                  <span
                    className={cn("text-xs", message.sender === "HumanSupport" ? "text-slate-300" : "text-slate-400")}
                  >
                    {message.timestamp}
                  </span>
                </div>
                <p className={message.sender === "System" ? "text-center" : ""}>{message.content}</p>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 border-t border-slate-200 bg-white">
            <div className="flex gap-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message here..."
                className="flex-1"
              />
              <Button onClick={handleSendMessage} className="bg-slate-700 hover:bg-slate-800">
                <Send className="h-4 w-4 mr-2" />
                Send
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

