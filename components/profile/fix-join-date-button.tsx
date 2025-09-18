"use client"

import { Button } from "@/components/ui/button"
import { useState } from "react"
import { toast } from "@/components/ui/toast/use-toast"
import { CalendarClock } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

export default function FixJoinDateButton({ userId }: { userId: string }) {
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClient()

  const handleFixJoinDate = async () => {
    setIsLoading(true)
    try {
      // Get the user's auth record to find the true created_at date
      const { data: authUser, error: authError } = await supabase.auth.getUser()

      if (authError || !authUser) {
        throw new Error(authError?.message || "Failed to get user data")
      }

      // Update the profile with the correct created_at date
      const { error } = await supabase
        .from("profiles")
        .update({
          created_at: authUser.user.created_at,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId)

      if (error) {
        throw new Error(error.message)
      }

      toast({
        title: "Success",
        description: "Your join date has been fixed. Refresh to see changes.",
        variant: "default",
      })

      // Reload the page to show the updated date
      setTimeout(() => {
        window.location.reload()
      }, 1500)
    } catch (error) {
      console.error("Error fixing join date:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button onClick={handleFixJoinDate} disabled={isLoading} variant="outline" size="sm">
      <CalendarClock className="h-4 w-4 mr-2" />
      {isLoading ? "Fixing..." : "Fix My Join Date"}
    </Button>
  )
}
