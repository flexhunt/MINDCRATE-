"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import { Loader2, Gift, CheckCircle, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface ReferralCodeInputProps {
  hasUsedReferralCode: boolean
  usedReferralCode?: string
}

export default function ReferralCodeInput({ hasUsedReferralCode, usedReferralCode }: ReferralCodeInputProps) {
  const [referralCode, setReferralCode] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isValidating, setIsValidating] = useState(false)
  const [isValid, setIsValid] = useState<boolean | null>(null)

  // If user already used a code, show status
  if (hasUsedReferralCode) {
    return (
      <Card className="border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-900">
        <CardHeader className="pb-3">
          <CardTitle className="text-green-800 dark:text-green-300 flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Referral Code Applied
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700">
            <Gift className="h-4 w-4" />
            <AlertDescription className="text-green-800 dark:text-green-300">
              You've successfully used referral code: <strong>{usedReferralCode}</strong>
              <br />
              You earned 25 coins as a welcome bonus! 🎉
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
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

      const result = await response.json()
      setIsValid(result.valid)
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

    if (isValid === false) {
      toast({
        title: "Invalid Code",
        description: "Please enter a valid referral code",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch("/api/referrals/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ referralCode: referralCode.trim() }),
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Success! 🎉",
          description: result.message,
        })
        // Refresh page to show updated status
        window.location.reload()
      } else {
        toast({
          title: "Error",
          description: result.error,
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
                placeholder="Enter referral code (e.g., ABC12345)"
                value={referralCode}
                onChange={(e) => {
                  const code = e.target.value.toUpperCase()
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
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Gift className="mr-2 h-4 w-4" />
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
