"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import { useToast } from "@/components/ui/toast/use-toast"

export function RefreshBalanceButton() {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const { toast } = useToast()

  const refreshBalance = async () => {
    setIsRefreshing(true)
    try {
      const response = await fetch("/api/coins/refresh-balance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error("Failed to refresh balance")
      }

      toast({
        title: "Balance refreshed",
        description: "Your coin balance has been refreshed.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to refresh balance. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsRefreshing(false)
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={refreshBalance} disabled={isRefreshing} className="h-7 px-2 text-xs">
      <RefreshCw className={`h-3 w-3 mr-1 ${isRefreshing ? "animate-spin" : ""}`} />
      Refresh
    </Button>
  )
}
