"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowUpRight, ArrowDownLeft, Gift, Users, User, Clock } from "lucide-react"
import { format } from "date-fns"

interface TransactionHistoryProps {
  userId: string
  limit?: number
  className?: string
  showHeader?: boolean
}

export default function TransactionHistory({
  userId,
  limit = 5,
  className = "",
  showHeader = false,
}: TransactionHistoryProps) {
  const [transactions, setTransactions] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    async function fetchTransactions() {
      try {
        setIsLoading(true)
        setError(null)

        // Try to query the transactions table
        const { data, error } = await supabase
          .from("coin_transactions")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(limit)

        if (error) {
          // Check if the error is about the table not existing
          if (error.message.includes("does not exist")) {
            setError("error-message coin_transactions-table-missing")
            setTransactions([])
            return
          }

          throw error
        }

        setTransactions(data || [])
      } catch (error: any) {
        console.error("Error fetching transactions:", error)
        setError(`Failed to load transactions: ${error.message}`)
        setTransactions([])
      } finally {
        setIsLoading(false)
      }
    }

    if (userId) {
      fetchTransactions()
    }
  }, [userId, limit, supabase])

  function getTransactionIcon(type: string, amount: number) {
    switch (type) {
      case "daily_reward":
        return <Gift className="h-4 w-4 text-green-500" />
      case "referral_bonus":
        return <Users className="h-4 w-4 text-blue-500" />
      case "referred_bonus":
        return <User className="h-4 w-4 text-purple-500" />
      case "profile_complete":
        return <User className="h-4 w-4 text-orange-500" />
      case "coin_link":
        return <Gift className="h-4 w-4 text-emerald-500" />
      default:
        return amount > 0 ? (
          <ArrowDownLeft className="h-4 w-4 text-green-500" />
        ) : (
          <ArrowUpRight className="h-4 w-4 text-red-500" />
        )
    }
  }

  function getTransactionTitle(type: string, amount: number) {
    switch (type) {
      case "daily_reward":
        return "Daily Reward"
      case "referral_bonus":
        return "Referral Bonus"
      case "referred_bonus":
        return "Signup Bonus"
      case "profile_complete":
        return "Profile Completion"
      case "coin_link":
        return "Coin Link Reward"
      default:
        return amount > 0 ? "Coins Received" : "Coins Spent"
    }
  }

  const content = (
    <>
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
              <div className="space-y-2 flex-1">
                <div className="h-4 w-1/3 bg-muted animate-pulse rounded" />
                <div className="h-3 w-1/2 bg-muted animate-pulse rounded" />
              </div>
              <div className="h-5 w-16 bg-muted animate-pulse rounded" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-6">
          <Clock className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">Transaction history will be available soon</p>
          {error.includes("error-message") && <div className="hidden">{error}</div>}
        </div>
      ) : transactions.length === 0 ? (
        <div className="text-center py-6">
          <Clock className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No transactions yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {transactions.map((transaction) => {
            const { id, amount, transaction_type, description, created_at } = transaction

            return (
              <div key={id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-muted/30 transition-colors">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted/50">
                  {getTransactionIcon(transaction_type, amount)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{getTransactionTitle(transaction_type, amount)}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {format(new Date(created_at), "MMM d, yyyy • h:mm a")}
                  </p>
                </div>
                <p className={`font-medium tabular-nums ${amount > 0 ? "text-green-600" : "text-red-600"}`}>
                  {amount > 0 ? "+" : ""}
                  {amount}
                </p>
              </div>
            )
          })}
        </div>
      )}
    </>
  )

  // If we don't want to show the header, just return the content
  if (!showHeader) {
    return <div className={className}>{content}</div>
  }

  // Otherwise, return the content wrapped in a Card
  return (
    <Card
      className={`overflow-hidden border bg-background/50 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-300 ${className}`}
    >
      <CardHeader>
        <CardTitle>Transaction History</CardTitle>
        <CardDescription>Your recent coin transactions</CardDescription>
      </CardHeader>
      <CardContent>{content}</CardContent>
    </Card>
  )
}
