"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  MessageSquare,
  Eye,
  CheckCircle,
  Users,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle2,
  Filter,
  Search,
  UserPlus,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import AdminNavbar from "@/components/admin-navbar"

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("active")

  const activeSessions = [
    {
      id: "ebfa85eb1c97",
      started: "02/04/2025, 16:19:59",
      ended: "N/A",
      status: "Active",
      assignedTo: "Sarah Johnson",
      priority: "High",
    },
    {
      id: "64e40a897221",
      started: "02/04/2025, 16:32:07",
      ended: "N/A",
      status: "Active",
      assignedTo: "Unassigned",
      priority: "Medium",
    },
    {
      id: "80b74a3e1f4b",
      started: "02/04/2025, 16:33:08",
      ended: "N/A",
      status: "Active",
      assignedTo: "Michael Chen",
      priority: "Low",
    },
    {
      id: "9300110ae61f",
      started: "02/04/2025, 16:35:13",
      ended: "N/A",
      status: "Active",
      assignedTo: "Unassigned",
      priority: "High",
    },
    {
      id: "a6b51565e23a",
      started: "02/04/2025, 16:41:11",
      ended: "N/A",
      status: "Active",
      assignedTo: "Unassigned",
      priority: "Medium",
    },
  ]

  const resolvedSessions = [
    {
      id: "c4b09654a413",
      started: "02/04/2025, 16:44:50",
      ended: "02/04/2025, 16:47:46",
      status: "Resolved",
      assignedTo: "Sarah Johnson",
      priority: "Medium",
    },
    {
      id: "f89926cefc59",
      started: "03/04/2025, 14:10:20",
      ended: "03/04/2025, 14:15:33",
      status: "Resolved",
      assignedTo: "Michael Chen",
      priority: "Low",
    },
    {
      id: "8e17e075d8fa",
      started: "03/04/2025, 14:21:39",
      ended: "03/04/2025, 14:30:12",
      status: "Resolved",
      assignedTo: "Emily Rodriguez",
      priority: "High",
    },
  ]

  const agents = [
    { id: 1, name: "Sarah Johnson", status: "Available", activeSessions: 1, resolvedToday: 3 },
    { id: 2, name: "Michael Chen", status: "Busy", activeSessions: 1, resolvedToday: 2 },
    { id: 3, name: "Emily Rodriguez", status: "Away", activeSessions: 0, resolvedToday: 1 },
    { id: 4, name: "David Kim", status: "Available", activeSessions: 0, resolvedToday: 0 },
  ]

  const stats = [
    { label: "Active Sessions", value: 5, icon: Clock, color: "bg-sky-100 text-sky-700" },
    { label: "Unassigned", value: 3, icon: AlertCircle, color: "bg-amber-100 text-amber-700" },
    { label: "Resolved Today", value: 6, icon: CheckCircle2, color: "bg-emerald-100 text-emerald-700" },
    { label: "Available Agents", value: 2, icon: Users, color: "bg-violet-100 text-violet-700" },
  ]

  return (
    <div className="min-h-screen bg-slate-50">
      <AdminNavbar />

      <main className="container mx-auto py-8 px-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Admin Dashboard</h1>
            <p className="text-slate-500">Manage interview sessions and support agents</p>
          </div>
          <div className="mt-4 md:mt-0 flex gap-3">
            <Button className="bg-slate-800 hover:bg-slate-900">
              <UserPlus className="mr-2 h-4 w-4" />
              Add Agent
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-xl font-bold flex items-center">
                  <MessageSquare className="mr-2 h-5 w-5 text-slate-600" />
                  Interview Support Sessions
                </CardTitle>
                <CardDescription>Manage and monitor all interview support sessions</CardDescription>
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

                  <Select defaultValue="all">
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <SelectValue placeholder="Filter by priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Priorities</SelectItem>
                      <SelectItem value="high">High Priority</SelectItem>
                      <SelectItem value="medium">Medium Priority</SelectItem>
                      <SelectItem value="low">Low Priority</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Tabs defaultValue="active" className="w-full" onValueChange={setActiveTab}>
                  <TabsList className="mb-4">
                    <TabsTrigger value="active" className="flex items-center">
                      <Clock className="mr-2 h-4 w-4" />
                      Active
                      <Badge className="ml-2 bg-sky-100 text-sky-700 hover:bg-sky-100">{activeSessions.length}</Badge>
                    </TabsTrigger>
                    <TabsTrigger value="resolved" className="flex items-center">
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Resolved
                      <Badge className="ml-2 bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                        {resolvedSessions.length}
                      </Badge>
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="active" className="mt-0">
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-slate-100 text-left">
                            <th className="p-3 font-medium text-slate-600 rounded-tl-lg">Session ID</th>
                            <th className="p-3 font-medium text-slate-600">Started</th>
                            <th className="p-3 font-medium text-slate-600">Priority</th>
                            <th className="p-3 font-medium text-slate-600">Assigned To</th>
                            <th className="p-3 font-medium text-slate-600 rounded-tr-lg">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {activeSessions.map((session, index) => (
                            <tr
                              key={session.id}
                              className={`border-b border-slate-200 hover:bg-slate-50 transition-colors ${
                                index === activeSessions.length - 1 ? "border-b-0" : ""
                              }`}
                            >
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
                                {session.assignedTo === "Unassigned" ? (
                                  <Badge variant="outline" className="border-slate-300 text-slate-600">
                                    Unassigned
                                  </Badge>
                                ) : (
                                  <span className="text-slate-700">{session.assignedTo}</span>
                                )}
                              </td>
                              <td className="p-3 flex gap-2">
                                <Button size="sm" variant="outline" className="border-slate-300">
                                  <Users className="h-4 w-4 mr-1" />
                                  Assign
                                </Button>
                                <Link href={`/admin/session/${session.id}`}>
                                  <Button size="sm" variant="outline" className="border-slate-300">
                                    <Eye className="h-4 w-4 mr-1" />
                                    View
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
                            <th className="p-3 font-medium text-slate-600 rounded-tl-lg">Session ID</th>
                            <th className="p-3 font-medium text-slate-600">Started</th>
                            <th className="p-3 font-medium text-slate-600">Ended</th>
                            <th className="p-3 font-medium text-slate-600">Assigned To</th>
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
                              <td className="p-3 font-mono text-sm">{session.id}</td>
                              <td className="p-3 text-slate-700">{session.started}</td>
                              <td className="p-3 text-slate-700">{session.ended}</td>
                              <td className="p-3 text-slate-700">{session.assignedTo}</td>
                              <td className="p-3">
                                <Link href={`/admin/session/${session.id}`}>
                                  <Button size="sm" variant="outline" className="border-slate-300">
                                    <Eye className="h-4 w-4 mr-1" />
                                    View
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
          </div>

          <div>
            <Card className="border-0 shadow-md mb-8">
              <CardHeader className="pb-2">
                <CardTitle className="text-xl font-bold flex items-center">
                  <Users className="mr-2 h-5 w-5 text-slate-600" />
                  Support Agents
                </CardTitle>
                <CardDescription>Current status and availability</CardDescription>
              </CardHeader>

              <CardContent>
                <div className="space-y-4">
                  {agents.map((agent) => (
                    <div
                      key={agent.id}
                      className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg"
                    >
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-medium">
                          {agent.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </div>
                        <div className="ml-3">
                          <p className="font-medium">{agent.name}</p>
                          <div className="flex items-center mt-1">
                            <Badge
                              className={
                                agent.status === "Available"
                                  ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-100"
                                  : agent.status === "Busy"
                                    ? "bg-amber-100 text-amber-800 hover:bg-amber-100"
                                    : "bg-slate-100 text-slate-800 hover:bg-slate-100"
                              }
                            >
                              {agent.status}
                            </Badge>
                            <span className="text-xs text-slate-500 ml-2">
                              {agent.activeSessions} active • {agent.resolvedToday} resolved today
                            </span>
                          </div>
                        </div>
                      </div>
                      <Button size="sm" variant="ghost">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-xl font-bold flex items-center">
                  <Calendar className="mr-2 h-5 w-5 text-slate-600" />
                  Agent Schedule
                </CardTitle>
                <CardDescription>Today's availability</CardDescription>
              </CardHeader>

              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-2 border-l-4 border-emerald-500 bg-emerald-50 rounded-r-lg">
                    <div>
                      <p className="font-medium">Sarah Johnson</p>
                      <p className="text-xs text-slate-500">9:00 AM - 5:00 PM</p>
                    </div>
                    <Badge className="bg-emerald-100 text-emerald-800">Available</Badge>
                  </div>

                  <div className="flex items-center justify-between p-2 border-l-4 border-amber-500 bg-amber-50 rounded-r-lg">
                    <div>
                      <p className="font-medium">Michael Chen</p>
                      <p className="text-xs text-slate-500">10:00 AM - 6:00 PM</p>
                    </div>
                    <Badge className="bg-amber-100 text-amber-800">Busy</Badge>
                  </div>

                  <div className="flex items-center justify-between p-2 border-l-4 border-slate-400 bg-slate-50 rounded-r-lg">
                    <div>
                      <p className="font-medium">Emily Rodriguez</p>
                      <p className="text-xs text-slate-500">8:00 AM - 4:00 PM</p>
                    </div>
                    <Badge className="bg-slate-100 text-slate-800">Away</Badge>
                  </div>

                  <div className="flex items-center justify-between p-2 border-l-4 border-emerald-500 bg-emerald-50 rounded-r-lg">
                    <div>
                      <p className="font-medium">David Kim</p>
                      <p className="text-xs text-slate-500">11:00 AM - 7:00 PM</p>
                    </div>
                    <Badge className="bg-emerald-100 text-emerald-800">Available</Badge>
                  </div>
                </div>

                <Button variant="outline" className="w-full mt-4">
                  <Calendar className="mr-2 h-4 w-4" />
                  View Full Schedule
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}

