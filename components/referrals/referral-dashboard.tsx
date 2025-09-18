"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"
import { Copy, Share2, Users, Coins, TrendingUp, Gift, CheckCircle, Clock, AlertCircle } from "lucide-react"

interface ReferralStats {
  total_referrals: number
  successful_referrals: number
  total_coins_earned: number
  referral_level: number
  referral_code: string
  referral_link: string
  pending_referrals: number
  recent_referrals: Array<{
    id: string
    referred_user: string
    status: string
    coins_earned: number
    created_at: string
  }>
}

export default function ReferralDashboard() {
  const [stats, setStats] = useState<ReferralStats | null>(null)
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
      toast({
        title: "Error",
        description: "Failed to load referral statistics",
        variant: "destructive",
      })
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
          title: "Join me on this awesome platform!",
          text: "Use my referral code to get bonus coins when you sign up!",
          url: stats.referral_link,
        })
      } catch (error) {
        // User cancelled sharing
      }
    } else {
      copyToClipboard(stats.referral_link, "link")
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-red-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
      default:
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                <div className="h-4 w-4 bg-muted animate-pulse rounded" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-16 bg-muted animate-pulse rounded mb-1" />
                <div className="h-3 w-24 bg-muted animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <p className="text-muted-foreground">Failed to load referral data</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Referrals</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_referrals}</div>
            <p className="text-xs text-muted-foreground">People you've invited</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Successful Referrals</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.successful_referrals}</div>
            <p className="text-xs text-muted-foreground">Completed sign-ups</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Coins Earned</CardTitle>
            <Coins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_coins_earned}</div>
            <p className="text-xs text-muted-foreground">From referrals</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Referral Level</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Level {stats.referral_level}</div>
            <p className="text-xs text-muted-foreground">Your current tier</p>
          </CardContent>
        </Card>
      </div>

      {/* Referral Code & Link */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            Your Referral Code & Link
          </CardTitle>
          <CardDescription>Share your code or link to invite friends and earn coins!</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Referral Code */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Referral Code</label>
            <div className="flex gap-2">
              <Input value={stats.referral_code || ""} readOnly className="font-mono text-lg" />
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

          {/* Referral Link */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Referral Link</label>
            <div className="flex gap-2">
              <Input value={stats.referral_link || ""} readOnly className="text-sm" />
              <Button
                variant="outline"
                size="icon"
                onClick={() => copyToClipboard(stats.referral_link, "link")}
                disabled={!stats.referral_link}
              >
                {copied === "link" ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
              <Button variant="outline" size="icon" onClick={shareReferralLink} disabled={!stats.referral_link}>
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Reward Info */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Referral Rewards</h4>
            <div className="grid gap-2 text-sm">
              <div className="flex justify-between">
                <span>You earn:</span>
                <span className="font-medium">50 coins per successful referral</span>
              </div>
              <div className="flex justify-between">
                <span>Your friend gets:</span>
                <span className="font-medium">25 welcome bonus coins</span>
              </div>
              <div className="flex justify-between">
                <span>Usage limit:</span>
                <span className="font-medium text-green-600">Unlimited! 🚀</span>
              </div>
              <div className="flex justify-between">
                <span>Expiration:</span>
                <span className="font-medium text-green-600">Never expires! ♾️</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Referrals */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Referrals</CardTitle>
          <CardDescription>Your latest referral activity</CardDescription>
        </CardHeader>
        <CardContent>
          {stats.recent_referrals && stats.recent_referrals.length > 0 ? (
            <div className="space-y-4">
              {stats.recent_referrals.map((referral) => (
                <div key={referral.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(referral.status)}
                    <div>
                      <p className="font-medium">{referral.referred_user || "Anonymous User"}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(referral.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(referral.status)}>{referral.status}</Badge>
                    {referral.status === "completed" && (
                      <div className="flex items-center gap-1 text-sm font-medium">
                        <Coins className="h-4 w-4" />+{referral.coins_earned}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-medium mb-2">No referrals yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Start sharing your referral code to invite friends and earn coins!
              </p>
              <Button onClick={shareReferralLink} disabled={!stats.referral_link}>
                <Share2 className="h-4 w-4 mr-2" />
                Share Referral Link
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
