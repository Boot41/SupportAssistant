"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { LayoutDashboard, Users, Calendar, BarChart3, Settings, LogOut, Menu, X } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"

export default function AdminNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navItems = [
    { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { label: "Agents", href: "/admin/agents", icon: Users },
    { label: "Schedule", href: "/admin/schedule", icon: Calendar },
    { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
    { label: "Settings", href: "/admin/settings", icon: Settings },
  ]

  return (
    <header className="bg-white border-b border-slate-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link href="/admin/dashboard" className="flex items-center">
              <span className="text-xl font-bold text-slate-800">AI Interview</span>
              <Badge className="ml-2 bg-slate-800 text-white">Admin</Badge>
            </Link>
          </div>

          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item, index) => (
              <Link key={index} href={item.href}>
                <Button variant="ghost" className="flex items-center text-slate-600 hover:text-slate-900">
                  <item.icon className="h-4 w-4 mr-2" />
                  {item.label}
                </Button>
              </Link>
            ))}
          </nav>

          <div className="flex items-center">
            <Button variant="ghost" className="text-slate-600 hover:text-slate-900">
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>

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
          <Button variant="ghost" className="w-full justify-start text-slate-600 hover:text-slate-900">
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>
    </header>
  )
}

import { Badge } from "@/components/ui/badge"

