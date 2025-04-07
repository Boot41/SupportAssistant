"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { LayoutDashboard, Menu, X } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

export default function AgentNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [workMode, setWorkMode] = useState(true)

  const navItems = [{ label: "Dashboard", href: "/agent/dashboard", icon: LayoutDashboard }]

  return (
    <header className="bg-white border-b border-slate-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link href="/agent/dashboard" className="flex items-center">
              <span className="text-xl font-bold text-slate-800">Welcome Ashwini</span>
              <Badge className="ml-2 bg-emerald-700 text-white">Agent</Badge>
            </Link>
          </div>

          <nav className="hidden md:flex items-center space-x-1">{/* Navigation items removed */}</nav>

          <div className="flex items-center space-x-4">
            <div className="relative inline-flex items-center">
              <button
                type="button"
                onClick={() => setWorkMode(!workMode)}
                className={cn(
                  "relative inline-flex h-8 w-[120px] flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                  workMode ? "bg-emerald-600" : "bg-slate-200",
                )}
              >
                <span className="sr-only">Toggle work mode</span>
                <span
                  className={cn(
                    "pointer-events-none relative inline-block h-7 w-7 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                    workMode ? "translate-x-[84px]" : "translate-x-0",
                  )}
                />
                <span
                  className={cn(
                    "absolute inset-0 flex items-center justify-center text-xs font-medium",
                    workMode ? "text-white pl-2 pr-9" : "text-slate-500 pl-9 pr-2",
                  )}
                >
                  {workMode ? "Active" : "Inactive"}
                </span>
              </button>
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        className={cn(
          "md:hidden bg-white border-b border-slate-200 transition-all duration-300 ease-in-out",
          mobileMenuOpen ? "max-h-screen py-4" : "max-h-0 overflow-hidden py-0",
        )}
      >
        <div className="container mx-auto px-4 space-y-2">
          {navItems.map((item, index) => (
            <Link key={index} href={item.href} onClick={() => setMobileMenuOpen(false)}>
              <Button variant="ghost" className="w-full justify-start text-slate-600 hover:text-slate-900">
                <item.icon className="h-4 w-4 mr-2" />
                {item.label}
              </Button>
            </Link>
          ))}
        </div>
      </div>
    </header>
  )
}

