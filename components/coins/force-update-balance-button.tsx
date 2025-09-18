"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import { useToast } from "@/components/ui/toast/use-toast"

export function ForceUpdateBalanceButton() {
  const [isUpdating, setIsUpdating] = useState(false)
  const { toast } = useToast()

  const forceUpdateBalance = async () => {
    setIsUpdating(true)
    try {
      const response = await fetch("/api/coins/force-update-balance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error("Failed to update balance")
      }

      const data = await response.json()

      if (data.updated) {
        toast({
          title: "Balance updated",
          description: `Your balance has been updated from ${data.previous_balance} to ${data.balance} coins.`,
        })
      } else {
        toast({
          title: "Balance is correct",
          description: "Your coin balance is already up to date.",
        })
      }

      // Force a page refresh to update all components
      window.location.reload()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update balance. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={forceUpdateBalance} disabled={isUpdating} className="h-8 px-3 text-xs">
      <RefreshCw className={`h-3 w-3 mr-2 ${isUpdating ? "animate-spin" : ""}`} />
      Force Update Balance
    </Button>
  )
}
