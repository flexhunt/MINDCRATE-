"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Coins } from "lucide-react"
import { RefreshBalanceButton } from "./refresh-balance-button"

interface EnhancedCoinBalanceProps {
  userId: string
  className?: string
  showRefresh?: boolean
}

export default function EnhancedCoinBalance({ userId, className, showRefresh = true }: EnhancedCoinBalanceProps) {
  const [balance, setBalance] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  const fetchBalance = async () => {
    try {
      setIsLoading(true)
      // First check if the user has a coin balance record
      const { data, error } = await supabase.from("user_coins").select("balance").eq("user_id", userId).single()

      if (error) {
        if (error.code === "PGRST116") {
          // No rows returned, create a new record
          const { data: newData, error: upsertError } = await supabase
            .from("user_coins")
            .upsert(
              {
                user_id: userId,
                balance: 0,
                lifetime_earned: 0,
              },
              {
                onConflict: "user_id",
                ignoreDuplicates: false,
              },
            )
            .select("balance")
            .single()

          if (upsertError) {
            console.error("Error creating coin balance record:", upsertError)
            setBalance(0)
            return
          }

          setBalance(newData?.balance || 0)
        } else {
          console.error("Error fetching coin balance:", error)
          setBalance(0)
        }
      } else {
        setBalance(data?.balance || 0)
      }
    } catch (error) {
      console.error("Error in fetchBalance:", error)
      setBalance(0)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (userId) {
      fetchBalance()
    }

    // Subscribe to realtime changes
    const channel = supabase
      .channel(`coin_balance_changes_${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*", // Listen for all events (INSERT, UPDATE, DELETE)
          schema: "public",
          table: "user_coins",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log("Coin balance changed:", payload)
          if (payload.eventType === "UPDATE" || payload.eventType === "INSERT") {
            setBalance(payload.new.balance)
          }
        },
      )
      .subscribe((status) => {
        console.log("Subscription status:", status)
      })

    // Also subscribe to coin transactions to refresh balance when transactions occur
    const transactionChannel = supabase
      .channel(`coin_transactions_${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "coin_transactions",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log("New coin transaction:", payload)
          // Refresh balance when a new transaction occurs
          fetchBalance()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
      supabase.removeChannel(transactionChannel)
    }
  }, [userId, supabase])

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex items-center gap-1 font-medium">
        <Coins className="h-4 w-4 text-yellow-500" />
        {isLoading ? <span className="animate-pulse">...</span> : <span>{balance?.toLocaleString()}</span>}
      </div>
      {showRefresh && <RefreshBalanceButton />}
    </div>
  )
}
