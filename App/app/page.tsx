import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ShieldCheck, Users, ArrowRight } from "lucide-react"

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex flex-col">
      <header className="bg-white border-b border-slate-200 py-6">
        <div className="container mx-auto">
          <h1 className="text-3xl font-bold text-slate-800">AI Interview Support System</h1>
          <p className="text-slate-500 mt-2">Manage and support AI-powered interview sessions</p>
        </div>
      </header>

      <main className="flex-1 container mx-auto py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-slate-800 mb-12">Select Your Portal</h2>

          <div className="grid md:grid-cols-2 gap-8">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="bg-gradient-to-r from-slate-700 to-slate-900 text-white rounded-t-lg">
                <div className="flex items-center mb-2">
                  <ShieldCheck className="h-8 w-8 mr-3 text-slate-300" />
                  <CardTitle className="text-2xl">Admin Portal</CardTitle>
                </div>
                <CardDescription className="text-slate-300">
                  Manage interviews, assign agents, and monitor system performance
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <div className="bg-slate-100 p-1 rounded-full mr-3 mt-0.5">
                      <svg className="h-3 w-3 text-slate-700" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <span>View all ongoing interviews and active issues</span>
                  </li>
                  <li className="flex items-start">
                    <div className="bg-slate-100 p-1 rounded-full mr-3 mt-0.5">
                      <svg className="h-3 w-3 text-slate-700" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <span>Assign issues to human support agents</span>
                  </li>
                  <li className="flex items-start">
                    <div className="bg-slate-100 p-1 rounded-full mr-3 mt-0.5">
                      <svg className="h-3 w-3 text-slate-700" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <span>Monitor agent availability and scheduling</span>
                  </li>
                  <li className="flex items-start">
                    <div className="bg-slate-100 p-1 rounded-full mr-3 mt-0.5">
                      <svg className="h-3 w-3 text-slate-700" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <span>View analytics and performance reports</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                <Link href="/admin/dashboard" className="w-full">
                  <Button className="w-full bg-slate-800 hover:bg-slate-900">
                    Enter Admin Portal
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardFooter>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="bg-gradient-to-r from-emerald-700 to-emerald-900 text-white rounded-t-lg">
                <div className="flex items-center mb-2">
                  <Users className="h-8 w-8 mr-3 text-emerald-300" />
                  <CardTitle className="text-2xl">Agent Portal</CardTitle>
                </div>
                <CardDescription className="text-emerald-100">
                  Handle assigned support sessions and assist interview candidates
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <div className="bg-emerald-50 p-1 rounded-full mr-3 mt-0.5">
                      <svg className="h-3 w-3 text-emerald-700" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <span>View your assigned support sessions</span>
                  </li>
                  <li className="flex items-start">
                    <div className="bg-emerald-50 p-1 rounded-full mr-3 mt-0.5">
                      <svg className="h-3 w-3 text-emerald-700" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <span>Provide real-time support to interview candidates</span>
                  </li>
                  <li className="flex items-start">
                    <div className="bg-emerald-50 p-1 rounded-full mr-3 mt-0.5">
                      <svg className="h-3 w-3 text-emerald-700" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <span>Mark issues as resolved when completed</span>
                  </li>
                  <li className="flex items-start">
                    <div className="bg-emerald-50 p-1 rounded-full mr-3 mt-0.5">
                      <svg className="h-3 w-3 text-emerald-700" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <span>Track your support performance metrics</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                <Link href="/agent/dashboard" className="w-full">
                  <Button className="w-full bg-emerald-700 hover:bg-emerald-800">
                    Enter Agent Portal
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          </div>
        </div>
      </main>

      <footer className="bg-white border-t border-slate-200 py-6">
        <div className="container mx-auto text-center text-slate-500 text-sm">
          &copy; {new Date().getFullYear()} AI Interview Support System. All rights reserved.
        </div>
      </footer>
    </div>
  )
}

