"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Coins } from "lucide-react"

interface CoinBalanceProps {
  userId: string
  className?: string
}

export default function CoinBalance({ userId, className }: CoinBalanceProps) {
  const [balance, setBalance] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function fetchBalance() {
      try {
        // Get the current session to check user ID format
        const { data: sessionData } = await supabase.auth.getSession()
        console.log("Session user:", sessionData?.session?.user)
        console.log("User ID being used:", userId)

        // First check if the user has a coin balance record
        const { data, error } = await supabase.from("user_coins").select("balance").eq("user_id", userId)

        if (error) {
          console.error("Error fetching coin balance:", error)
          return
        }

        // If no record exists, create one using upsert to avoid duplicate key errors
        if (!data || data.length === 0) {
          console.log("No coin balance record found, creating one...")

          // Use upsert instead of insert to handle potential race conditions
          const { data: newData, error: upsertError } = await supabase
            .from("user_coins")
            .upsert(
              {
                user_id: userId,
                balance: 0,
                lifetime_earned: 0,
              },
              {
                onConflict: "user_id", // Specify the conflict column
                ignoreDuplicates: true, // Ignore the operation if there's a conflict
              },
            )
            .select("balance")

          if (upsertError) {
            // If there's still an error, just try to fetch the record again
            console.error("Error creating coin balance record:", upsertError)
            const { data: retryData, error: retryError } = await supabase
              .from("user_coins")
              .select("balance")
              .eq("user_id", userId)

            if (!retryError && retryData && retryData.length > 0) {
              setBalance(retryData[0]?.balance || 0)
            } else {
              // If all else fails, just show 0
              setBalance(0)
            }
            return
          }

          setBalance(newData?.[0]?.balance || 0)
        } else {
          // Use the first record if multiple exist (shouldn't happen, but just in case)
          setBalance(data[0]?.balance || 0)
        }
      } catch (error) {
        console.error("Error fetching coin balance:", error)
        // Default to 0 if there's an error
        setBalance(0)
      } finally {
        setIsLoading(false)
      }
    }

    if (userId) {
      fetchBalance()
    }

    // Subscribe to realtime changes
    const channel = supabase
      .channel("coin_balance_changes")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "user_coins",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          setBalance(payload.new.balance)
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, supabase])

  return (
    <div className={`flex items-center gap-1 font-medium ${className}`}>
      <Coins className="h-4 w-4 text-yellow-500" />
      {isLoading ? <span className="animate-pulse">...</span> : <span>{balance?.toLocaleString()}</span>}
    </div>
  )
}
