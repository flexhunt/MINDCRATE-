"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Check, Copy, Loader2 } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

export default function ReferralCard({ referralCode }: { referralCode: string }) {
  const [copied, setCopied] = useState(false)
  const [referralLink, setReferralLink] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // Generate referral link
    setReferralLink(`${window.location.origin}/signup?ref=${referralCode}`)
  }, [referralCode])

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink)
    setCopied(true)
    toast({
      title: "Referral link copied",
      description: "Share this link with your friends!",
    })

    setTimeout(() => {
      setCopied(false)
    }, 2000)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Referral Program</CardTitle>
        <CardDescription>Share your referral code and earn coins!</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p>Share your unique referral link with friends and family. When they sign up, you both get bonus coins!</p>
        <div className="flex items-center">
          <Input
            type="text"
            value={referralLink}
            readOnly
            className="flex-1 mr-2"
            aria-label="Referral link"
            aria-describedby="referral-code-description"
          />
          <Button variant="outline" size="sm" onClick={handleCopy} disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : copied ? (
              <Check className="h-4 w-4" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
            {copied ? "Copied!" : "Copy"}
          </Button>
        </div>
        <p id="referral-code-description" className="text-sm text-muted-foreground">
          Share this link with your friends to earn rewards.
        </p>
      </CardContent>
    </Card>
  )
}
