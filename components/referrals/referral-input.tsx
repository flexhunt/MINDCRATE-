"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "@/components/ui/use-toast"
import { Gift, Loader2, CheckCircle, AlertCircle } from "lucide-react"

interface ReferralInputProps {
  onSuccess?: (data: any) => void
  defaultCode?: string
}

export default function ReferralInput({ onSuccess, defaultCode }: ReferralInputProps) {
  const [referralCode, setReferralCode] = useState(defaultCode || "")
  const [loading, setLoading] = useState(false)
  const [validating, setValidating] = useState(false)
  const [validation, setValidation] = useState<{
    valid: boolean
    error?: string
    referrer?: { name: string; username: string }
  } | null>(null)

  const validateReferralCode = async (code: string) => {
    if (!code.trim()) {
      setValidation(null)
      return
    }

    setValidating(true)
    try {
      const response = await fetch("/api/referrals/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ referralCode: code }),
      })

      const data = await response.json()
      setValidation(data)
    } catch (error) {
      setValidation({ valid: false, error: "Failed to validate referral code" })
    } finally {
      setValidating(false)
    }
  }

  const handleCodeChange = (value: string) => {
    setReferralCode(value.toUpperCase())

    // Debounce validation
    const timeoutId = setTimeout(() => {
      validateReferralCode(value)
    }, 500)

    return () => clearTimeout(timeoutId)
  }

  const processReferral = async () => {
    if (!referralCode.trim()) {
      toast({
        title: "Error",
        description: "Please enter a referral code",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/referrals/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ referralCode }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Success!",
          description: `You've earned ${data.referred_coins} coins! Your referrer earned ${data.referrer_coins} coins.`,
        })
        onSuccess?.(data)
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to process referral",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process referral code",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gift className="h-5 w-5" />
          Have a Referral Code?
        </CardTitle>
        <CardDescription>Enter a referral code to get bonus coins when you sign up!</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Input
                placeholder="Enter referral code"
                value={referralCode}
                onChange={(e) => handleCodeChange(e.target.value)}
                className="uppercase"
                maxLength={8}
              />
              {validating && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              )}
            </div>
            <Button onClick={processReferral} disabled={loading || !validation?.valid}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                "Apply Code"
              )}
            </Button>
          </div>

          {/* Validation Status */}
          {validation && (
            <Alert className={validation.valid ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
              <div className="flex items-center gap-2">
                {validation.valid ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-600" />
                )}
                <AlertDescription className={validation.valid ? "text-green-800" : "text-red-800"}>
                  {validation.valid ? (
                    <>
                      Valid referral code from{" "}
                      <strong>{validation.referrer?.name || validation.referrer?.username || "a user"}</strong>! You'll
                      get 25 bonus coins.
                    </>
                  ) : (
                    validation.error
                  )}
                </AlertDescription>
              </div>
            </Alert>
          )}
        </div>

        {/* Reward Info */}
        <div className="bg-muted/50 p-3 rounded-lg">
          <h4 className="font-medium text-sm mb-1">Referral Bonus</h4>
          <p className="text-sm text-muted-foreground">
            Get <strong>25 coins</strong> when you sign up with a valid referral code!
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
