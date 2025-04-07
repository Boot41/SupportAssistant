import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "AI Interview Support System",
  description: "Support assistance service for AI interviews",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <main className="min-h-screen bg-slate-100">
            <header className="bg-slate-900 border-b border-slate-700 py-2">
              <div className="container mx-auto flex justify-between items-center">
                <h1 className="text-xl font-bold text-white">Dashboard | AI Interview Support System</h1>
                <Button variant="ghost" className="text-white hover:bg-slate-800 hover:text-white">
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
            </header>
            {children}
          </main>
        </ThemeProvider>
      </body>
    </html>
  )
}



import './globals.css'