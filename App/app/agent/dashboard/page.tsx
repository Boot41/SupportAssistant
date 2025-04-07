"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MessageSquare, Eye, CheckCircle, Clock, Search, Filter, RefreshCw } from "lucide-react"
import { Input } from "@/components/ui/input"
import AgentNavbar from "@/components/agent-navbar"

export default function AgentDashboard() {
  const [activeTab, setActiveTab] = useState("assigned")
  const [isRefreshing, setIsRefreshing] = useState(false)

  const assignedSessions = [
    { id: "ebfa85eb1c97", started: "02/04/2025, 16:19:59", ended: "N/A", status: "Active", priority: "High" },
    { id: "80b74a3e1f4b", started: "02/04/2025, 16:33:08", ended: "N/A", status: "Active", priority: "Low" },
  ]

  const resolvedSessions = [
    {
      id: "c4b09654a413",
      started: "02/04/2025, 16:44:50",
      ended: "02/04/2025, 16:47:46",
      status: "Resolved",
      priority: "Medium",
    },
    {
      id: "f89926cefc59",
      started: "03/04/2025, 14:10:20",
      ended: "03/04/2025, 14:15:33",
      status: "Resolved",
      priority: "Low",
    },
    {
      id: "8e17e075d8fa",
      started: "03/04/2025, 14:21:39",
      ended: "03/04/2025, 14:30:12",
      status: "Resolved",
      priority: "High",
    },
  ]

  const stats = [
    { label: "Assigned Sessions", value: 2, icon: Clock, color: "bg-emerald-100 text-emerald-700" },
    { label: "Resolved Today", value: 3, icon: CheckCircle, color: "bg-sky-100 text-sky-700" },
  ]

  const handleRefresh = () => {
    setIsRefreshing(true)

    // Simulate a refresh delay
    setTimeout(() => {
      // In a real app, you would fetch new data here
      setIsRefreshing(false)
    }, 1000)
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <AgentNavbar />

      <main className="container mx-auto py-8 px-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>{/* Paragraph removed */}</div>
          <div className="mt-4 md:mt-0">{/* Badge removed */}</div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {stats.map((stat, index) => (
            <Card key={index} className="border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                    <p className="text-3xl font-bold text-slate-800 mt-1">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-full ${stat.color}`}>
                    <stat.icon className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border-0 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl font-bold flex items-center">
              <MessageSquare className="mr-2 h-5 w-5 text-slate-600" />
              Your Support Sessions
            </CardTitle>
            <CardDescription>Manage and monitor your assigned interview support sessions</CardDescription>
          </CardHeader>

          <CardContent>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
              <div className="flex gap-2 w-full sm:w-auto">
                <Input
                  placeholder="Search sessions..."
                  className="max-w-xs"
                  startIcon={<Search className="h-4 w-4 text-slate-400" />}
                />
                <Button variant="outline" size="icon">
                  <Filter className="h-4 w-4" />
                </Button>
              </div>

              <Button
                variant="outline"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className={isRefreshing ? "animate-spin-slow" : ""}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>

            <Tabs defaultValue="assigned" className="w-full" onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="assigned" className="flex items-center">
                  <Clock className="mr-2 h-4 w-4" />
                  Assigned
                  <Badge className="ml-2 bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                    {assignedSessions.length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="resolved" className="flex items-center">
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Resolved
                  <Badge className="ml-2 bg-sky-100 text-sky-700 hover:bg-sky-100">{resolvedSessions.length}</Badge>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="assigned" className="mt-0">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-left">
                        <th className="p-3 font-medium text-slate-600 rounded-tl-lg">No.</th>
                        <th className="p-3 font-medium text-slate-600">Session ID</th>
                        <th className="p-3 font-medium text-slate-600">Started</th>
                        <th className="p-3 font-medium text-slate-600">Priority</th>
                        <th className="p-3 font-medium text-slate-600 rounded-tr-lg">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assignedSessions.map((session, index) => (
                        <tr
                          key={session.id}
                          className={`border-b border-slate-200 hover:bg-slate-50 transition-colors ${
                            index === assignedSessions.length - 1 ? "border-b-0" : ""
                          }`}
                        >
                          <td className="p-3 font-medium text-slate-700">{assignedSessions.length - index}</td>
                          <td className="p-3 font-mono text-sm">{session.id}</td>
                          <td className="p-3 text-slate-700">{session.started}</td>
                          <td className="p-3">
                            <Badge
                              className={
                                session.priority === "High"
                                  ? "bg-red-100 text-red-800 hover:bg-red-100"
                                  : session.priority === "Medium"
                                    ? "bg-amber-100 text-amber-800 hover:bg-amber-100"
                                    : "bg-emerald-100 text-emerald-800 hover:bg-emerald-100"
                              }
                            >
                              {session.priority}
                            </Badge>
                          </td>
                          <td className="p-3">
                            <Link href={`/agent/support/${session.id}`}>
                              <Button size="sm" className="bg-emerald-700 hover:bg-emerald-800">
                                <MessageSquare className="h-4 w-4 mr-1" />
                                Assist
                              </Button>
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </TabsContent>

              <TabsContent value="resolved" className="mt-0">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-left">
                        <th className="p-3 font-medium text-slate-600 rounded-tl-lg">No.</th>
                        <th className="p-3 font-medium text-slate-600">Session ID</th>
                        <th className="p-3 font-medium text-slate-600">Started</th>
                        <th className="p-3 font-medium text-slate-600">Ended</th>
                        <th className="p-3 font-medium text-slate-600 rounded-tr-lg">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {resolvedSessions.map((session, index) => (
                        <tr
                          key={session.id}
                          className={`border-b border-slate-200 hover:bg-slate-50 transition-colors ${
                            index === resolvedSessions.length - 1 ? "border-b-0" : ""
                          }`}
                        >
                          <td className="p-3 font-medium text-slate-700">{resolvedSessions.length - index}</td>
                          <td className="p-3 font-mono text-sm">{session.id}</td>
                          <td className="p-3 text-slate-700">{session.started}</td>
                          <td className="p-3 text-slate-700">{session.ended}</td>
                          <td className="p-3">
                            <Link href={`/agent/session/${session.id}`}>
                              <Button size="sm" variant="outline" className="border-slate-300">
                                <Eye className="h-4 w-4 mr-1" />
                                Assist
                              </Button>
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

