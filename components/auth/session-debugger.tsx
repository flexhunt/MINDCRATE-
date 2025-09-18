"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { RefreshCw, AlertCircle, CheckCircle2 } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

export default function SessionDebugger() {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [sessionData, setSessionData] = useState<any>(null)
  const [sessionError, setSessionError] = useState<string | null>(null)
  const supabase = createClient()

  const checkSession = async () => {
    setIsLoading(true)
    setSessionError(null)

    try {
      const { data, error } = await supabase.auth.getSession()

      if (error) {
        setSessionError(error.message)
        console.error("Session error:", error)
      } else {
        setSessionData(data)
        console.log("Session data:", data)
      }
    } catch (err: any) {
      setSessionError(err.message || "Unknown error")
      console.error("Session check error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    // Only run in development
    if (process.env.NODE_ENV === "development") {
      checkSession()
    }
  }, [])

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
      toast({
        title: "Signed out",
        description: "You have been signed out successfully.",
      })
      window.location.href = "/"
    } catch (error) {
      console.error("Sign out error:", error)
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Only show in development
  if (process.env.NODE_ENV !== "development") return null

  if (!isOpen) {
    return (
      <Button variant="outline" size="sm" className="fixed bottom-4 left-4 z-50" onClick={() => setIsOpen(true)}>
        Debug Session
      </Button>
    )
  }

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Session Debugger
            <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
              Close
            </Button>
          </CardTitle>
          <CardDescription>Check your current authentication session</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-4">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : sessionError ? (
            <div className="rounded-md bg-destructive/10 p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-destructive" />
                <div>
                  <p className="font-medium text-destructive">Session Error</p>
                  <p className="text-sm text-destructive/90">{sessionError}</p>
                </div>
              </div>
            </div>
          ) : sessionData?.session ? (
            <div className="rounded-md bg-green-500/10 p-4">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <div>
                  <p className="font-medium text-green-500">Session Active</p>
                  <p className="text-sm">User ID: {sessionData.session.user.id}</p>
                  <p className="text-sm">Email: {sessionData.session.user.email}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-md bg-amber-500/10 p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-amber-500" />
                <div>
                  <p className="font-medium text-amber-500">No Active Session</p>
                  <p className="text-sm">You are not currently logged in.</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={checkSession} disabled={isLoading}>
            {isLoading ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Checking...
              </>
            ) : (
              "Refresh Session"
            )}
          </Button>
          {sessionData?.session && (
            <Button variant="destructive" onClick={handleSignOut}>
              Sign Out
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}
