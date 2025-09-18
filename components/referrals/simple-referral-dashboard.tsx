"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import { Copy, Gift, Users, Coins, Loader2 } from "lucide-react"

interface ReferralStats {
  referral_code: string
  referral_link: string
  total_referrals: number
  total_coins_earned: number
  recent_referrals: Array<{
    id: string
    created_at: string
    coins_earned: number
  }>
}

export default function SimpleReferralDashboard() {
  const [stats, setStats] = useState<ReferralStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [inputCode, setInputCode] = useState("")
  const [processing, setProcessing] = useState(false)
  const [hasUsedReferral, setHasUsedReferral] = useState(false)

  useEffect(() => {
    fetchStats()
    checkReferralStatus()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/referrals/stats")
      const data = await response.json()

      if (response.ok) {
        setStats(data)
      } else {
        console.error("Stats error:", data.error)
      }
    } catch (error) {
      console.error("Fetch stats error:", error)
    } finally {
      setLoading(false)
    }
  }

  const checkReferralStatus = async () => {
    try {
      const response = await fetch("/api/profile")
      const data = await response.json()

      if (response.ok && data.profile) {
        setHasUsedReferral(data.profile.has_used_referral || false)
      }
    } catch (error) {
      console.error("Check status error:", error)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({ title: "Copied!", description: "Referral link copied to clipboard" })
  }

  const processReferralCode = async () => {
    if (!inputCode.trim()) {
      toast({ title: "Error", description: "Please enter a referral code", variant: "destructive" })
      return
    }

    setProcessing(true)
    try {
      const response = await fetch("/api/referrals/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ referralCode: inputCode.trim() }),
      })

      const result = await response.json()

      if (result.success) {
        toast({ title: "Success! 🎉", description: result.message })
        setHasUsedReferral(true)
        setInputCode("")
      } else {
        toast({ title: "Error", description: result.error, variant: "destructive" })
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to process referral", variant: "destructive" })
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Your Referral Code */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            Your Referral Code
          </CardTitle>
          <CardDescription>Share this code to earn 50 coins per referral</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Referral Code</Label>
            <div className="flex gap-2">
              <Input value={stats?.referral_code || ""} readOnly className="font-mono text-lg" />
              <Button onClick={() => copyToClipboard(stats?.referral_code || "")} variant="outline">
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Referral Link</Label>
            <div className="flex gap-2">
              <Input value={stats?.referral_link || ""} readOnly className="text-sm" />
              <Button onClick={() => copyToClipboard(stats?.referral_link || "")} variant="outline">
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{stats?.total_referrals || 0}</p>
                <p className="text-sm text-muted-foreground">Total Referrals</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Coins className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">{stats?.total_coins_earned || 0}</p>
                <p className="text-sm text-muted-foreground">Coins Earned</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enter Referral Code */}
      {!hasUsedReferral && (
        <Card>
          <CardHeader>
            <CardTitle>Enter Referral Code</CardTitle>
            <CardDescription>Got a referral code? Enter it here to earn 25 coins!</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Enter referral code"
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                disabled={processing}
              />
              <Button onClick={processReferralCode} disabled={processing || !inputCode.trim()}>
                {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {hasUsedReferral && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-green-700">
              <Gift className="h-5 w-5" />
              <p className="font-medium">You've already used a referral code! 🎉</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
