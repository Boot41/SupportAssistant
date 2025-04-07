"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Send, Clock, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"
import AgentNavbar from "@/components/agent-navbar"

interface Message {
  id: string
  sender: "User" | "TriageAgent" | "System" | "HumanSupport"
  content: string
  timestamp: string
}

export default function AgentSupportSession({ params }: { params: { id: string } }) {
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
    <div className="min-h-screen bg-white">
      <AgentNavbar />

      <div className="container mx-auto max-w-5xl py-6 px-4">
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/agent/dashboard"
            className="flex items-center text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            <span className="text-sm font-medium">Back to Dashboard</span>
          </Link>

          <div className="flex items-center space-x-2">
            <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200">Active</Badge>
            <Badge className="bg-red-50 text-red-700 border border-red-200">High Priority</Badge>
          </div>
        </div>

        <div className="flex flex-col h-[calc(100vh-180px)] bg-white rounded-xl shadow-sm border border-slate-100">
          {/* Header */}
          <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-emerald-50 to-white shadow-sm">
            <div className="flex items-center">
              <div className="mr-4 h-10 w-10 rounded-full bg-emerald-600 flex items-center justify-center shadow-md ring-2 ring-emerald-100">
                <span className="text-white font-medium">S</span>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Session <span className="text-emerald-600">{params.id}</span>
                </h2>
                <div className="flex items-center text-xs text-slate-500">
                  <Clock className="h-3 w-3 mr-1" />
                  Started: 02/04/2025, 16:19:59
                </div>
              </div>
            </div>
            <Button variant="outline" size="sm" className="text-sm border-slate-200 text-slate-700 hover:bg-slate-50">
              <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
              Resolve
            </Button>
          </div>

          {/* System notice */}
          <div className="px-6 py-3 bg-amber-50 border-b border-amber-100">
            <p className="text-sm text-amber-800">
              You are now chatting as a human support operator. The AI assistant has been paused.
            </p>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex flex-col",
                  message.sender === "User" ? "items-end" : "items-start",
                  message.sender === "System" ? "items-center" : "",
                )}
              >
                <div className="flex items-center mb-1 space-x-2">
                  <span className="text-xs font-medium text-slate-500">
                    {message.sender === "TriageAgent" ? "AI Assistant" : message.sender}
                  </span>
                  <span className="text-xs text-slate-400">{message.timestamp}</span>
                </div>
                <div
                  className={cn(
                    "max-w-[80%] rounded-lg p-3",
                    message.sender === "User"
                      ? "bg-slate-100 text-slate-800"
                      : message.sender === "TriageAgent"
                        ? "bg-blue-50 border border-blue-100 text-slate-800"
                        : message.sender === "HumanSupport"
                          ? "bg-emerald-600 text-white"
                          : "bg-amber-50 border border-amber-100 text-amber-800 text-sm max-w-[90%]",
                  )}
                >
                  <p className={message.sender === "System" ? "text-center" : ""}>{message.content}</p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <div className="p-4 border-t border-slate-100 bg-white">
            <div className="flex gap-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message here..."
                className="flex-1 border-slate-200 focus-visible:ring-emerald-500"
              />
              <Button onClick={handleSendMessage} className="bg-emerald-600 hover:bg-emerald-700">
                <Send className="h-4 w-4" />
                <span className="sr-only">Send</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

