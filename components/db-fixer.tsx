"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { fixDatabaseIssues } from "@/lib/db-fix-utils"

export default function DatabaseFixer() {
  const [isFixing, setIsFixing] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const checkAndFixDatabase = async () => {
      try {
        // Get current user
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!session) return

        // Check for errors in console that might indicate database issues
        const originalError = console.error
        let hasDbError = false

        console.error = (...args) => {
          const errorMessage = args.join(" ")
          if (
            errorMessage.includes("JSON object requested") ||
            errorMessage.includes("multiple (or no) rows returned") ||
            errorMessage.includes("does not exist")
          ) {
            hasDbError = true
          }
          originalError(...args)
        }

        // Wait a bit to catch any errors
        await new Promise((resolve) => setTimeout(resolve, 2000))

        // Restore original console.error
        console.error = originalError

        // If we detected errors, try to fix them
        if (hasDbError) {
          setIsFixing(true)
          const result = await fixDatabaseIssues(session.user.id)

          if (result.success) {
            console.log("Database issues fixed:", result)
            // Refresh the page to apply fixes
            window.location.reload()
          }
        }
      } catch (error) {
        console.error("Error in database fixer:", error)
      } finally {
        setIsFixing(false)
      }
    }

    checkAndFixDatabase()
  }, [supabase])

  // No visible UI
  return null
}
