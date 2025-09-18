"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import { Loader2, Gift, CheckCircle, AlertCircle, Coins, User, Calendar } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

interface ReferralCodeEntryProps {
  userId: string
}

interface ReferralStatus {
  hasUsedCode: boolean
  usedCode?: string
  referrerInfo?: {
    username: string
    name: string
    avatar_url?: string
    joinedAt: string
  }
  coinsEarned?: number
}

export default function ReferralCodeEntry({ userId }: ReferralCodeEntryProps) {
  const [referralCode, setReferralCode] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isValidating, setIsValidating] = useState(false)
  const [isValid, setIsValid] = useState<boolean | null>(null)
  const [referralStatus, setReferralStatus] = useState<ReferralStatus | null>(null)
  const [loading, setLoading] = useState(true)

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) {
        router.push("/login?redirect=" + encodeURIComponent(window.location.pathname))
      }
    }
    checkAuth()
  }, [router, supabase])

  // Check if user has already used a referral code
  useEffect(() => {
    checkReferralStatus()
  }, [userId])

  const checkReferralStatus = async () => {
    try {
      const response = await fetch("/api/referrals/check-status")

      if (!response.ok) {
        throw new Error("Failed to check status")
      }

      const data = await response.json()
      setReferralStatus(data)
    } catch (error) {
      console.error("Error checking referral status:", error)
      // Don't show error to user, just continue with form
    } finally {
      setLoading(false)
    }
  }

  const validateReferralCode = async (code: string) => {
    if (code.length < 3) {
      setIsValid(null)
      return
    }

    setIsValidating(true)
    try {
      const response = await fetch("/api/referrals/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ referralCode: code }),
      })

      if (!response.ok) {
        throw new Error("Validation failed")
      }

      const result = await response.json()
      setIsValid(result.valid)

      if (!result.valid) {
        console.log("Invalid code:", result.error)
      }
    } catch (error) {
      console.error("Error validating referral code:", error)
      setIsValid(false)
    } finally {
      setIsValidating(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!referralCode.trim()) {
      toast({
        title: "Error",
        description: "Please enter a referral code",
        variant: "destructive",
      })
      return
    }

    if (isValid !== true) {
      toast({
        title: "Invalid Code",
        description: "Please enter a valid referral code",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      console.log("Processing referral code:", referralCode.trim())

      const response = await fetch("/api/referrals/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ referralCode: referralCode.trim() }),
      })

      console.log("Response status:", response.status)

      const result = await response.json()
      console.log("Response data:", result)

      if (result.success) {
        toast({
          title: "Success! 🎉",
          description: result.message || "Referral code applied successfully! You earned 25 coins!",
        })

        // Refresh the status
        await checkReferralStatus()
      } else {
        console.error("Referral processing failed:", result.error)
        toast({
          title: "Error",
          description: result.error || "Failed to process referral code",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error processing referral:", error)
      toast({
        title: "Error",
        description: "Failed to process referral code. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="ml-2">Loading referral status...</span>
        </CardContent>
      </Card>
    )
  }

  // If user already used a code, show who they used it from
  if (referralStatus?.hasUsedCode) {
    return (
      <Card className="border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-900">
        <CardHeader className="pb-3">
          <CardTitle className="text-green-800 dark:text-green-300 flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Referral Code Applied
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700">
            <Coins className="h-4 w-4" />
            <AlertDescription className="text-green-800 dark:text-green-300">
              You've successfully used referral code: <strong>{referralStatus.usedCode}</strong>
              <br />
              You earned {referralStatus.coinsEarned || 25} coins as a welcome bonus! 🎉
            </AlertDescription>
          </Alert>

          {/* Show referrer info if available */}
          {referralStatus.referrerInfo && (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border">
              <h4 className="font-medium text-green-800 dark:text-green-300 mb-3 flex items-center gap-2">
                <User className="h-4 w-4" />
                You were referred by:
              </h4>
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage
                    src={referralStatus.referrerInfo.avatar_url || ""}
                    alt={referralStatus.referrerInfo.name || referralStatus.referrerInfo.username}
                  />
                  <AvatarFallback>
                    {(referralStatus.referrerInfo.name || referralStatus.referrerInfo.username).charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {referralStatus.referrerInfo.name || referralStatus.referrerInfo.username}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">@{referralStatus.referrerInfo.username}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 flex items-center gap-1 mt-1">
                    <Calendar className="h-3 w-3" />
                    Member since {new Date(referralStatus.referrerInfo.joinedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  // Show referral code entry form
  return (
    <Card className="border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-900">
      <CardHeader>
        <CardTitle className="text-blue-800 dark:text-blue-300 flex items-center gap-2">
          <Gift className="h-5 w-5" />
          Enter Referral Code
        </CardTitle>
        <CardDescription className="text-blue-600 dark:text-blue-400">
          Got a referral code? Enter it here to earn 25 coins! You can only use one referral code per account.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="referralCode">Referral Code</Label>
            <div className="relative">
              <Input
                id="referralCode"
                placeholder="Enter referral code (e.g., ABC123)"
                value={referralCode}
                onChange={(e) => {
                  const code = e.target.value
                    .toUpperCase()
                    .replace(/[^A-Z0-9]/g, "")
                    .slice(0, 6)
                  setReferralCode(code)
                  validateReferralCode(code)
                }}
                className={`pr-10 ${
                  isValid === false
                    ? "border-red-500 focus:border-red-500"
                    : isValid === true
                      ? "border-green-500 focus:border-green-500"
                      : ""
                }`}
                disabled={isSubmitting}
                maxLength={6}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {isValidating ? (
                  <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                ) : isValid === false ? (
                  <AlertCircle className="h-4 w-4 text-red-500" />
                ) : isValid === true ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : null}
              </div>
            </div>
            {isValid === false && <p className="text-sm text-red-600">Invalid referral code</p>}
            {isValid === true && <p className="text-sm text-green-600">Valid referral code! ✓</p>}
          </div>

          <Button
            type="submit"
            disabled={isSubmitting || isValid !== true}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Coins className="mr-2 h-4 w-4" />
                Apply Referral Code & Earn 25 Coins
              </>
            )}
          </Button>
        </form>

        <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <p className="text-sm text-yellow-800 dark:text-yellow-300">
            💡 <strong>Note:</strong> You can only use one referral code per account. Choose wisely!
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
