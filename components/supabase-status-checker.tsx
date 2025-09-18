"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { AlertCircle, Loader2 } from "lucide-react"

export default function SupabaseStatusChecker() {
  const [isChecking, setIsChecking] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<"unknown" | "connected" | "error">("unknown")
  const [errorDetails, setErrorDetails] = useState<string | null>(null)

  // Don't show this component on the login page
  useEffect(() => {
    // Check if we're on the login page (root path)
    if (typeof window !== "undefined" && window.location.pathname === "/") {
      return
    }

    checkConnection()
  }, [])

  const checkConnection = async () => {
    setIsChecking(true)
    setConnectionStatus("unknown")
    setErrorDetails(null)

    try {
      const supabase = createClient()
      const { data, error } = await supabase.auth.getSession()

      if (error) {
        console.error("Supabase connection check failed:", error)
        setConnectionStatus("error")
        setErrorDetails(error.message || "Could not connect to Supabase")
        return
      }

      // Try a simple database query as well
      const { error: dbError } = await supabase.from("profiles").select("count").limit(1)

      if (dbError) {
        console.error("Supabase database check failed:", dbError)
        setConnectionStatus("error")
        setErrorDetails(dbError.message || "Could not connect to Supabase database")
        return
      }

      setConnectionStatus("connected")
    } catch (error: any) {
      console.error("Supabase connection exception:", error)
      setConnectionStatus("error")
      setErrorDetails(error.message || "An unexpected error occurred")
    } finally {
      setIsChecking(false)
    }
  }

  // Only show in development and only if there's an error
  if (process.env.NODE_ENV !== "development" || connectionStatus === "connected") {
    return null
  }

  return (
    <div className="mb-4">
      {connectionStatus === "error" && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Connection Error</AlertTitle>
          <AlertDescription className="flex flex-col gap-2">
            <p>There was a problem connecting to our services: {errorDetails}</p>
            <Button variant="outline" size="sm" onClick={checkConnection} disabled={isChecking} className="w-fit">
              {isChecking ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Checking...
                </>
              ) : (
                "Check Again"
              )}
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {connectionStatus === "unknown" && isChecking && (
        <Alert>
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertTitle>Checking Connection</AlertTitle>
          <AlertDescription>Verifying connection to authentication services...</AlertDescription>
        </Alert>
      )}
    </div>
  )
}
