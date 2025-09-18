"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Gift, Calendar, Check, Loader2 } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

interface DailyRewardCardProps {
  canClaim: boolean
  currentStreak: number
  onRewardClaimed: (result: any) => void
}

export function DailyRewardCard({ canClaim, currentStreak, onRewardClaimed }: DailyRewardCardProps) {
  const [claiming, setClaiming] = useState(false)
  const [claimed, setClaimed] = useState(false)

  const handleClaimReward = async () => {
    try {
      setClaiming(true)

      console.log("🎁 Claiming daily reward...")
      const response = await fetch("/api/coins/claim-daily-reward", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to claim reward")
      }

      const result = await response.json()
      console.log("✅ Daily reward claimed:", result)

      setClaimed(true)
      onRewardClaimed(result)

      toast({
        title: "Daily Reward Claimed!",
        description: `You received ${result.reward_amount} coins. Current streak: ${result.streak} days!`,
        variant: "success",
      })
    } catch (error) {
      console.error("❌ Error claiming reward:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to claim daily reward",
        variant: "destructive",
      })
    } finally {
      setClaiming(false)
    }
  }

  // If already claimed or can't claim, show appropriate UI
  const alreadyClaimed = !canClaim || claimed

  return (
    <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm overflow-hidden min-w-0">
      <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br from-primary/20 to-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Gift className="h-5 w-5 text-primary flex-shrink-0" />
          <span className="truncate">Daily Reward</span>
        </CardTitle>
        <CardDescription className="text-sm">Claim your daily coins</CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex flex-col items-center justify-center p-3 sm:p-4 space-y-3 sm:space-y-4 min-w-0">
          <div
            className={cn(
              "w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center transition-all flex-shrink-0",
              alreadyClaimed
                ? "bg-muted"
                : "bg-gradient-to-br from-primary to-primary-foreground shadow-lg shadow-primary/20",
            )}
          >
            {claiming ? (
              <Loader2 className="h-8 w-8 sm:h-10 sm:w-10 text-white animate-spin" />
            ) : alreadyClaimed ? (
              <Check className="h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground" />
            ) : (
              <Gift className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
            )}
          </div>

          <div className="text-center min-w-0 w-full">
            <h3 className="text-lg sm:text-xl font-bold mb-1 truncate">
              {alreadyClaimed ? "Already Claimed" : "5 Coins Available"}
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4 line-clamp-2">
              {alreadyClaimed
                ? "Come back tomorrow for more rewards!"
                : "Claim your daily reward to increase your streak"}
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground min-w-0">
            <Calendar className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">Current streak: {currentStreak} days</span>
          </div>

          <Button
            onClick={handleClaimReward}
            disabled={alreadyClaimed || claiming}
            size="sm"
            className={cn(
              "w-full min-w-0",
              alreadyClaimed && "bg-muted text-muted-foreground hover:bg-muted hover:text-muted-foreground",
            )}
          >
            {claiming ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin flex-shrink-0" />
                <span className="truncate">Claiming...</span>
              </>
            ) : alreadyClaimed ? (
              <>
                <Check className="mr-2 h-4 w-4 flex-shrink-0" />
                <span className="truncate">Claimed</span>
              </>
            ) : (
              <span className="truncate">Claim Reward</span>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
