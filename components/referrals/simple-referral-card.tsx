"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/use-toast"
import { Copy, Share2, Gift, CheckCircle, Coins, Users } from "lucide-react"

interface SimpleReferralStats {
  referral_code: string
  referral_link: string
  total_referrals: number
  total_coins_earned: number
}

export default function SimpleReferralCard() {
  const [stats, setStats] = useState<SimpleReferralStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState<"code" | "link" | null>(null)

  useEffect(() => {
    fetchReferralStats()
  }, [])

  const fetchReferralStats = async () => {
    try {
      const response = await fetch("/api/referrals/stats")
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error("Error fetching referral stats:", error)
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = async (text: string, type: "code" | "link") => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(type)
      toast({
        title: "Copied!",
        description: `Referral ${type} copied to clipboard`,
      })
      setTimeout(() => setCopied(null), 2000)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      })
    }
  }

  const shareReferralLink = async () => {
    if (!stats?.referral_link) return

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join me and earn coins! 🪙",
          text: "Use my referral code to get 25 bonus coins when you sign up!",
          url: stats.referral_link,
        })
      } catch (error) {
        // User cancelled sharing
      }
    } else {
      copyToClipboard(stats.referral_link, "link")
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="h-6 w-32 bg-muted animate-pulse rounded" />
          <div className="h-4 w-48 bg-muted animate-pulse rounded" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-10 bg-muted animate-pulse rounded" />
            <div className="h-10 bg-muted animate-pulse rounded" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!stats) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gift className="h-5 w-5" />
          Invite Friends & Earn Coins
        </CardTitle>
        <CardDescription>Share your permanent referral code - unlimited uses, never expires!</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-center gap-1 text-lg font-bold">
              <Users className="h-4 w-4" />
              {stats.total_referrals}
            </div>
            <p className="text-xs text-muted-foreground">Referrals</p>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-center gap-1 text-lg font-bold">
              <Coins className="h-4 w-4" />
              {stats.total_coins_earned}
            </div>
            <p className="text-xs text-muted-foreground">Coins Earned</p>
          </div>
        </div>

        {/* Referral Code */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Your Referral Code</label>
          <div className="flex gap-2">
            <Input value={stats.referral_code || ""} readOnly className="font-mono text-lg text-center" />
            <Button
              variant="outline"
              size="icon"
              onClick={() => copyToClipboard(stats.referral_code, "code")}
              disabled={!stats.referral_code}
            >
              {copied === "code" ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Share Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={() => copyToClipboard(stats.referral_link, "link")}
            variant="outline"
            className="flex-1"
            disabled={!stats.referral_link}
          >
            {copied === "link" ? <CheckCircle className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
            Copy Link
          </Button>
          <Button onClick={shareReferralLink} className="flex-1" disabled={!stats.referral_link}>
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
        </div>

        {/* Reward Info */}
        <div className="bg-green-50 dark:bg-green-950/20 p-3 rounded-lg border border-green-200 dark:border-green-800">
          <div className="text-sm space-y-1">
            <div className="flex justify-between font-medium">
              <span>You earn:</span>
              <span className="text-green-600">50 coins per referral</span>
            </div>
            <div className="flex justify-between font-medium">
              <span>They get:</span>
              <span className="text-green-600">25 bonus coins</span>
            </div>
            <div className="text-xs text-muted-foreground mt-2">
              ♾️ Unlimited uses • Never expires • Win-win for everyone!
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
