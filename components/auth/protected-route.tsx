"use client"

import { useEffect, useState, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import SessionRecovery from "./session-recovery"
import { Loader2 } from "lucide-react"

interface ProtectedRouteProps {
  children: ReactNode
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [retryCount, setRetryCount] = useState(0)
  const [sessionError, setSessionError] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data, error } = await supabase.auth.getSession()

        if (error) {
          console.error("Session error:", error.message)
          setSessionError(true)

          // If we're within retry limits, attempt to refresh the session
          if (retryCount < 3) {
            console.log(`Retrying session check (${retryCount + 1}/3)...`)
            setRetryCount((prev) => prev + 1)

            // Try to refresh the session
            const { error: refreshError } = await supabase.auth.refreshSession()
            if (!refreshError) {
              // If refresh worked, check again after a short delay
              setTimeout(checkAuth, 1000)
              return
            }
          }

          // If we've exhausted retries or refresh failed, redirect
          router.replace("/login?redirect=" + encodeURIComponent(window.location.pathname))
          return
        }

        if (!data?.session) {
          // Before redirecting, check localStorage for any session data
          const hasLocalStorageSession = localStorage.getItem("supabase.auth.token") !== null

          if (hasLocalStorageSession && retryCount < 3) {
            console.log(`Found local storage session data. Retrying (${retryCount + 1}/3)...`)
            setRetryCount((prev) => prev + 1)
            setTimeout(checkAuth, 1000)
            return
          }

          router.replace("/login?redirect=" + encodeURIComponent(window.location.pathname))
        } else {
          setLoading(false)
          setSessionError(false)
        }
      } catch (err) {
        console.error("Auth check error:", err)
        setSessionError(true)
        router.replace("/login?redirect=" + encodeURIComponent(window.location.pathname))
      }
    }

    checkAuth()

    // Set up auth state listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        router.replace("/login")
      } else if (event === "SIGNED_IN" && session) {
        setLoading(false)
        setSessionError(false)
      } else if (event === "TOKEN_REFRESHED") {
        console.log("Token refreshed successfully")
        setLoading(false)
        setSessionError(false)
      }
    })

    return () => {
      subscription?.unsubscribe()
    }
  }, [router, supabase, retryCount])

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900 to-violet-800">
        <div className="w-full max-w-md rounded-xl bg-white/10 p-8 backdrop-blur-lg backdrop-filter dark:bg-black/20">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="relative h-16 w-16 rounded-full bg-gradient-to-r from-violet-500 to-purple-600 p-1">
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-white" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-white">
              {sessionError ? "Restoring Session..." : "Loading Your Dashboard"}
            </h1>
            <p className="text-gray-300">
              {sessionError
                ? "We're trying to restore your session. Please wait a moment..."
                : "Please wait while we load your personalized dashboard..."}
            </p>
          </div>

          <div className="mt-8">
            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-700">
              <div className="h-full animate-pulse rounded-full bg-gradient-to-r from-violet-500 to-purple-600"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <SessionRecovery />
      {children}
    </>
  )
}
