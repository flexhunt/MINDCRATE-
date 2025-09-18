"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { toast } from "@/components/ui/use-toast"

interface SignOutButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string
}

export default function SignOutButton({ className, ...props }: SignOutButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    try {
      setIsLoading(true)

      // Sign out from Supabase
      const { error } = await supabase.auth.signOut()

      if (error) {
        throw error
      }

      // Clear any cookies or local storage if needed
      document.cookie.split(";").forEach((c) => {
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/")
      })

      // Force a hard redirect to the home page
      window.location.href = "/"

      // The router.replace is a fallback, but we prefer the hard redirect above
      router.replace("/")
    } catch (error) {
      console.error("Error signing out:", error)
      toast({
        title: "Error signing out",
        description: "Please try again",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button variant="outline" onClick={handleSignOut} disabled={isLoading} className={cn(className)} {...props}>
      {isLoading ? "Signing out..." : "Sign out"}
    </Button>
  )
}
