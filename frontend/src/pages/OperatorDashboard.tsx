import React, { useState, useEffect } from "react"
import { Button } from "../ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Badge } from "../ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs"
import {
  MessageSquare,
  Eye,
  CheckCircle,
  Users,
  Calendar,
  Clock,
  CheckCircle2,
  Filter,
  Search,
  RefreshCw,
  Bell,
} from "lucide-react"
import { Input } from "../ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import OperatorNavbar from "../components/operator-navbar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu"
import { Link } from "react-router-dom"

export default function OperatorDashboard() {
  const [activeTab, setActiveTab] = useState("active")
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [userData, setUserData] = useState(null)

  useEffect(() => {
    // Retrieve user data from localStorage
    const storedUserData = localStorage.getItem('userData')
    if (storedUserData) {
      try {
        const parsedData = JSON.parse(storedUserData)
        setUserData(parsedData)
        console.log('User data retrieved from localStorage:', parsedData)
      } catch (error) {
        console.error('Error parsing user data from localStorage:', error)
      }
    } else {
      console.log('No user data found in localStorage')
    }
  }, [])

  // Define the session type
  type Session = {
    id: string;
    started: string;
    ended: string | null;
    status: string;
    assignedTo: string;
    priority: string;
  };
  
  const [activeSessions, setActiveSessions] = useState<Session[]>([
    {
      id: "ebfa85eb1c97",
      started: "02/04/2025, 16:19:59",
      ended: null,
      status: "Active",
      assignedTo: "Unassigned",
      priority: "High",
    },
    {
      id: "80b74a3e1f4b",
      started: "02/04/2025, 15:45:32",
      ended: null,
      status: "Active",
      assignedTo: "Sarah Johnson",
      priority: "Medium",
    },
    {
      id: "c4b09654a413",
      started: "02/04/2025, 14:30:00",
      ended: "02/04/2025, 15:00:00",
      status: "Resolved",
      assignedTo: "Sarah Johnson",
      priority: "High",
    },
    {
      id: "f89926cefc59",
      started: "02/04/2025, 13:15:45",
      ended: "02/04/2025, 13:45:00",
      status: "Resolved",
      assignedTo: "Michael Chen",
      priority: "Medium",
    },
    {
      id: "8e17e075d8fa",
      started: "02/04/2025, 11:30:00",
      ended: "02/04/2025, 12:00:00",
      status: "Resolved",
      assignedTo: "Emily Rodriguez",
      priority: "Low",
    }
  ])

  const [resolvedSessions, setResolvedSessions] = useState<Session[]>([
    {
      id: "c4b09654a413",
      started: "02/04/2025, 14:30:00",
      ended: "02/04/2025, 15:00:00",
      status: "Resolved",
      assignedTo: "Sarah Johnson",
      priority: "High",
    },
    {
      id: "f89926cefc59",
      started: "02/04/2025, 13:15:45",
      ended: "02/04/2025, 13:45:00",
      status: "Resolved",
      assignedTo: "Michael Chen",
      priority: "Medium",
    },
    {
      id: "8e17e075d8fa",
      started: "02/04/2025, 11:30:00",
      ended: "02/04/2025, 12:00:00",
      status: "Resolved",
      assignedTo: "Emily Rodriguez",
      priority: "Low",
    }
  ])

  const [myAssignedSessions, setMyAssignedSessions] = useState<Session[]>([
    {
      id: "80b74a3e1f4b",
      started: "02/04/2025, 15:45:32",
      ended: null,
      status: "Active",
      assignedTo: "Sarah Johnson",
      priority: "Medium",
    }
  ])

  const stats = [
    { label: "Active Sessions", value: activeSessions.filter(s => s.status === "Active").length, icon: Clock, color: "bg-sky-100 text-sky-700" },
    { label: "Resolved Sessions", value: resolvedSessions.length, icon: CheckCircle2, color: "bg-emerald-100 text-emerald-700" },
    {
      label: "Today's Agent",
      value: "Ashwini",
      secondaryValue: "Available until 5:00 PM",
      icon: Users,
      color: "bg-violet-100 text-violet-700",
      trend: `${myAssignedSessions.length} sessions in progress`,
    },
  ]

  const handleRefresh = () => {
    setIsRefreshing(true)

    // Simulate a refresh delay
    setTimeout(() => {
      // In a real app, you would fetch new data here
      setIsRefreshing(false)
    }, 1000)
  }

  useEffect(() => {
    // Fetch sessions from the backend
    const fetchSessions = async () => {
      try {
        setIsRefreshing(true);
        const response = await fetch('http://localhost:8000/sessions');
        if (!response.ok) {
          throw new Error('Failed to fetch sessions');
        }
        const data = await response.json();
        
        // Transform the data to match our UI format
        const transformedSessions = data.map((session: any) => ({
          id: session.session_id,
          started: new Date(session.started_at).toLocaleString(),
          ended: session.ended_at ? new Date(session.ended_at).toLocaleString() : "N/A",
          status: session.ended_at ? "Ended" : "Active",
          assignedTo: session.user_id || "Unassigned",
          priority: session.resolved ? "High" : "Medium", // Default priority since not provided by backend
        }));

        // Sort by start date (newest first)
        transformedSessions.sort((a: any, b: any) => {
          return new Date(b.started).getTime() - new Date(a.started).getTime();
        });

        setActiveSessions(transformedSessions);
        
        // Filter resolved sessions
        const resolved = transformedSessions.filter((session: any) => session.status === "Ended");
        setResolvedSessions(resolved);
        
        // Filter assigned sessions (for demo, just use the first two)
        const assigned = transformedSessions.slice(0, 2);
        setMyAssignedSessions(assigned);
        
        setIsRefreshing(false);
      } catch (err) {
        console.error('Error fetching sessions:', err);
        setIsRefreshing(false);
      }
    };
    fetchSessions();
  }, []);
  console.log(activeSessions)
  return (
    <div className="min-h-screen bg-slate-50">
      <OperatorNavbar />

      <main className="container mx-auto py-8 px-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <p className="text-slate-500">Manage interview sessions and support operations</p>
          </div>
          <div className="mt-4 md:mt-0">
            <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 px-3 py-1">
              <Clock className="h-3.5 w-3.5 mr-1.5" />
              Last updated: {new Date().toLocaleTimeString()}
            </Badge>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Dashboard Overview</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {stats.map((stat, index) => (
              <Card
                key={index}
                className="border border-slate-200/60 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden group"
              >
                <div className={`h-1 w-full ${stat.color.replace("bg-", "bg-").replace("text-", "")}`}></div>
                <CardContent className="p-6">
                  <div className="flex items-start">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-500 mb-1">{stat.label}</p>
                      <div className="flex items-baseline gap-2">
                        <p className="text-2xl font-bold text-slate-800">{stat.value}</p>
                        {stat.secondaryValue && <p className="text-xs text-slate-600">{stat.secondaryValue}</p>}
                      </div>
                      {stat.trend && (
                        <p className="text-xs font-medium mt-2 inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100">
                          {stat.trend}
                        </p>
                      )}
                    </div>
                    <div
                      className={`p-3 rounded-full ${stat.color} transform transition-transform group-hover:scale-110`}
                    >
                      <stat.icon className="h-5 w-5" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
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
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        placeholder="Search sessions..."
                        className="pl-9 max-w-xs"
                      />
                    </div>
                    <Button variant="outline" size="icon">
                      <Filter className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="flex gap-2">
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
                </div>

                <Tabs defaultValue="active" className="w-full" onValueChange={setActiveTab}>
                  <TabsList className="mb-4">
                    <TabsTrigger value="active" className="flex items-center">
                      <Clock className="mr-2 h-4 w-4" />
                      Active
                      <Badge className="ml-2 bg-indigo-100 text-indigo-700 hover:bg-indigo-100">
                        {activeSessions.length}
                      </Badge>
                    </TabsTrigger>
                    <TabsTrigger value="todaysAgent" className="flex items-center">
                      <Users className="mr-2 h-4 w-4" />
                      Today's Agent
                      <Badge className="ml-2 bg-violet-100 text-violet-700 hover:bg-violet-100">
                        {myAssignedSessions.length}
                      </Badge>
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
                            <th className="p-3 font-medium text-slate-600 rounded-tl-lg">No.</th>
                            <th className="p-3 font-medium text-slate-600">Session ID</th>
                            <th className="p-3 font-medium text-slate-600">Started</th>
                            <th className="p-3 font-medium text-slate-600">Priority</th>
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
                              <td className="p-3 font-medium text-slate-700">{activeSessions.length - index}</td>
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
                              <td className="p-3 flex gap-2">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button size="sm" variant="outline" className="border-slate-300">
                                      <Users className="h-4 w-4 mr-1" />
                                      Request Help
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-56">
                                    <DropdownMenuLabel>Request assistance from:</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem>
                                      <div className="flex items-center">
                                        <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 mr-2 text-xs font-medium">
                                          A
                                        </div>
                                        <span>Aniket (Tuesday)</span>
                                      </div>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                      <div className="flex items-center">
                                        <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 mr-2 text-xs font-medium">
                                          D
                                        </div>
                                        <span>David (Wednesday)</span>
                                      </div>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                      <div className="flex items-center">
                                        <div className="w-6 h-6 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 mr-2 text-xs font-medium">
                                          P
                                        </div>
                                        <span>Priya (Thursday)</span>
                                      </div>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                      <div className="flex items-center">
                                        <div className="w-6 h-6 rounded-full bg-sky-100 flex items-center justify-center text-sky-700 mr-2 text-xs font-medium">
                                          R
                                        </div>
                                        <span>Rahul (Friday)</span>
                                      </div>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuSub>
                                      <DropdownMenuSubTrigger>
                                        <Bell className="h-4 w-4 mr-2" />
                                        <span>Notification options</span>
                                      </DropdownMenuSubTrigger>
                                      <DropdownMenuSubContent>
                                        <DropdownMenuItem>
                                          <CheckCircle className="h-4 w-4 mr-2" />
                                          <span>Urgent (immediate)</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem>
                                          <Clock className="h-4 w-4 mr-2" />
                                          <span>Standard (when available)</span>
                                        </DropdownMenuItem>
                                      </DropdownMenuSubContent>
                                    </DropdownMenuSub>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                                <Link to={`/operator/view/${session.id}`}>
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

                  <TabsContent value="todaysAgent" className="mt-0">
                    <div className="bg-indigo-50 p-4 rounded-lg mb-4 border border-indigo-100">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center text-white font-medium text-lg">
                          A
                        </div>
                        <div>
                          <h3 className="font-medium text-lg text-slate-800">Ashwini</h3>
                          <p className="text-slate-600">Today's support agent (Monday)</p>
                          <div className="flex items-center mt-1">
                            <Badge className="bg-emerald-100 text-emerald-800">Available</Badge>
                            <span className="text-xs text-slate-500 ml-2">9:00 AM - 5:00 PM</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <h3 className="text-sm font-medium text-slate-500 mb-2">Sessions Assigned to Today's Agent</h3>
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
                          {myAssignedSessions.map((session, index) => (
                            <tr
                              key={session.id}
                              className={`border-b border-slate-200 hover:bg-slate-50 transition-colors ${
                                index === myAssignedSessions.length - 1 ? "border-b-0" : ""
                              }`}
                            >
                              <td className="p-3 font-medium text-slate-700">{myAssignedSessions.length - index}</td>
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
                                <Link to={`/operator/support/${session.id}`}>
                                  <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700">
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
                              <td className="p-3 font-medium text-slate-700">{resolvedSessions.length - index}</td>
                              <td className="p-3 font-mono text-sm">{session.id}</td>
                              <td className="p-3 text-slate-700">{session.started}</td>
                              <td className="p-3 text-slate-700">{session.ended}</td>
                              <td className="p-3 text-slate-700">{session.assignedTo}</td>
                              <td className="p-3">
                                <Link to={`/operator/view/${session.id}`}>
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
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-xl font-bold flex items-center">
                  <Calendar className="mr-2 h-5 w-5 text-slate-600" />
                  Weekly Agent Schedule
                </CardTitle>
                <CardDescription>One agent per day, Monday to Friday</CardDescription>
              </CardHeader>

              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-2 border-l-4 border-indigo-500 bg-indigo-50 rounded-r-lg">
                    <div>
                      <p className="font-medium">Monday</p>
                      <p className="text-xs text-slate-500">April 8, 2025</p>
                      <p className="text-sm font-medium text-indigo-700">Ashwini</p>
                    </div>
                    <Badge className="bg-indigo-100 text-indigo-800">Today</Badge>
                  </div>

                  <div className="flex items-center justify-between p-2 border-l-4 border-emerald-500 bg-emerald-50 rounded-r-lg">
                    <div>
                      <p className="font-medium">Tuesday</p>
                      <p className="text-xs text-slate-500">April 9, 2025</p>
                      <p className="text-sm font-medium text-emerald-700">Aniket</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-2 border-l-4 border-amber-500 bg-amber-50 rounded-r-lg">
                    <div>
                      <p className="font-medium">Wednesday</p>
                      <p className="text-xs text-slate-500">April 10, 2025</p>
                      <p className="text-sm font-medium text-amber-700">David</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-2 border-l-4 border-violet-500 bg-violet-50 rounded-r-lg">
                    <div>
                      <p className="font-medium">Thursday</p>
                      <p className="text-xs text-slate-500">April 11, 2025</p>
                      <p className="text-sm font-medium text-violet-700">Priya</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-2 border-l-4 border-sky-500 bg-sky-50 rounded-r-lg">
                    <div>
                      <p className="font-medium">Friday</p>
                      <p className="text-xs text-slate-500">April 12, 2025</p>
                      <p className="text-sm font-medium text-sky-700">Rahul</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
