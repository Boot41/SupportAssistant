import React from "react"
import { Button } from "../ui/button"
import { LayoutDashboard, Menu, X, LogOut } from "lucide-react"
import { useState } from "react"
import { cn } from "../lib/utils"
import { Badge } from "../ui/badge"
import { useNavigate } from "react-router-dom"
import { Link } from "react-router-dom"

export default function OperatorNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const navigate = useNavigate()

  const navItems = [{ label: "Dashboard", href: "/operator/dashboard", icon: LayoutDashboard }]

  return (
    <header className="bg-white border-b border-slate-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/operator/dashboard" className="flex items-center">
              <span className="text-xl font-bold text-slate-800">Support Dashboard</span>
              <Badge className="ml-2 bg-indigo-600 text-white">Operator</Badge>
            </Link>
          </div>

          <nav className="hidden md:flex items-center space-x-1">{/* Navigation items removed */}</nav>

          <div className="flex items-center space-x-4">
            <Button variant="ghost" className="text-slate-600 hover:text-slate-900" onClick={() => navigate("/")}>
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
            <Link key={index} to={item.href} onClick={() => setMobileMenuOpen(false)}>
              <Button variant="ghost" className="w-full justify-start text-slate-600 hover:text-slate-900">
                <item.icon className="h-4 w-4 mr-2" />
                {item.label}
              </Button>
            </Link>
          ))}
          <Button
            variant="ghost"
            className="w-full justify-start text-slate-600 hover:text-slate-900"
            onClick={() => {
              setMobileMenuOpen(false)
              navigate("/")
            }}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>
    </header>
  )
}
