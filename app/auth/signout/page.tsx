"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

export default function SignOut() {
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function signOut() {
      try {
        // Sign out from Supabase
        await supabase.auth.signOut()

        // Clear cookies
        document.cookie.split(";").forEach((c) => {
          document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/")
        })

        // Force a hard redirect to the home page
        window.location.href = "/"
      } catch (error) {
        console.error("Error during sign out:", error)
        // Still try to redirect even if there's an error
        window.location.href = "/"
      }
    }

    signOut()
  }, [router, supabase])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Signing out...</h1>
        <div className="h-8 w-8 mx-auto animate-spin rounded-full border-b-2 border-t-2 border-gray-900"></div>
      </div>
    </div>
  )
}
