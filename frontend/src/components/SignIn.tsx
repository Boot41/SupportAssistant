import React from 'react';
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "../ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { ShieldCheck, Loader2 } from "lucide-react"
import { cn } from "../lib/utils"
import { useGoogleLogin } from '@react-oauth/google'
import axios from 'axios'

export default function SignIn() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [mounted, setMounted] = useState(false)

  // Handle animation on mount
  useEffect(() => {
    setMounted(true)
  }, [])

  const login = useGoogleLogin({
    scope: 'openid profile email https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
    flow: 'auth-code',
    clientId: '274055029862-30ju5vqba01in57ftvv1i0n6mi6loo7d.apps.googleusercontent.com',
    onSuccess: async (codeResponse) => {
      try {
        const res = await axios.post('http://localhost:8000/auth', {
          code: codeResponse.code,
          redirect_uri: 'http://localhost:3000'
        });
        if(res.data.success) {
          console.log(res.data)
          // Store user data in localStorage
          localStorage.setItem('userData', JSON.stringify(res.data));
          // Redirect to operator dashboard
          window.location.href = '/operator';
        }
      } catch (err) {
        console.error('Auth failed', err);
      }
    },
    onError: (err) => console.error(err),
  });

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    setError("")
    login()
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-slate-50">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-grid-slate-200 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black_70%)] opacity-20"></div>

      {/* Content container */}
      <div
        className={cn(
          "w-full max-w-md px-4 z-10 transition-all duration-700 ease-out",
          mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
        )}
      >
        {/* Logo and title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-2 bg-white rounded-full shadow-sm mb-4">
            <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 p-3 rounded-full">
              <ShieldCheck className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">AI Interview Support</h1>
          <p className="text-slate-500 mt-2 max-w-sm mx-auto">
            Secure access to the operator portal for managing AI-powered interviews
          </p>
        </div>

        {/* Login card */}
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardHeader className="pb-4 space-y-1 bg-gradient-to-r from-indigo-600 to-indigo-800 text-white rounded-t-lg">
            <CardTitle className="text-2xl font-bold text-center">Sign in</CardTitle>
            <CardDescription className="text-center text-indigo-100">
              Use your Google account to access the system
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-2 pb-6 space-y-4">
            {/* Error message */}
            {error && (
              <div className="bg-red-50 text-red-800 text-sm p-3 rounded-md border border-red-100 flex items-start">
                <span className="leading-5">{error}</span>
              </div>
            )}

            {/* Google sign-in button */}
            <Button
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 h-12 shadow-sm transition-all hover:shadow relative overflow-hidden group"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
              ) : (
                <>
                  <span className="absolute inset-0 w-3 bg-gradient-to-r from-indigo-500 to-indigo-600 -translate-x-full group-hover:translate-x-0 transition-transform duration-300 ease-out"></span>
                  <svg width="20" height="20" viewBox="0 0 24 24" className="flex-shrink-0">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  <span className="relative">Continue with Google</span>
                </>
              )}
            </Button>

            {/* Permissions note */}
            <div className="pt-2 text-center">
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-500"></span>
                Your account must have operator permissions
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-xs text-slate-500 flex flex-col gap-1">
          <p>&copy; {new Date().getFullYear()} AI Interview Support System</p>
          <p className="text-slate-400">Secure • Reliable • Intelligent</p>
        </div>
      </div>
    </div>
  )
}
