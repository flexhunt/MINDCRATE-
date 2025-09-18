"use client"

import type React from "react"

import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react"
import Link from "next/link"

interface SimpleLoginFormProps {
  isLoading: boolean
  setIsLoading: (isLoading: boolean) => void
}

export default function SimpleLoginForm({ isLoading, setIsLoading }: SimpleLoginFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isRedirecting, setIsRedirecting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email || !password) {
      setErrorMessage("Please enter both email and password")
      return
    }

    try {
      setIsLoading(true)
      setErrorMessage(null)
      setSuccessMessage(null)

      console.log("🔐 Login attempt:", email)

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error("❌ Login error:", error.message)
        setErrorMessage("Invalid email or password. Please try again.")
        return
      }

      console.log("✅ Login successful")
      setSuccessMessage("Login successful! Redirecting...")
      setIsRedirecting(true)

      setTimeout(() => {
        router.replace("/dashboard")
      }, 1000)
    } catch (error) {
      console.error("❌ Login catch error:", error)
      setErrorMessage("Something went wrong. Please try again.")
    } finally {
      if (!successMessage) {
        setIsLoading(false)
      }
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errorMessage && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      {successMessage && (
        <Alert className="mb-4 bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-300 border-green-200 dark:border-green-900">
          <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertDescription>{successMessage}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-medium">
          Email
        </label>
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value)
            setErrorMessage(null)
          }}
          disabled={isLoading || isRedirecting}
          required
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label htmlFor="password" className="text-sm font-medium">
            Password
          </label>
          <Link href="/forgot-password" className="text-xs text-muted-foreground hover:text-primary transition-colors">
            Forgot password?
          </Link>
        </div>
        <Input
          id="password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value)
            setErrorMessage(null)
          }}
          disabled={isLoading || isRedirecting}
          required
        />
      </div>

      <Button type="submit" className="w-full" disabled={isLoading || isRedirecting}>
        {isLoading || isRedirecting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {isRedirecting ? "Redirecting..." : "Logging in..."}
          </>
        ) : (
          "Login"
        )}
      </Button>
    </form>
  )
}
