"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ExternalLink, Copy, AlertCircle, CheckCircle2 } from "lucide-react"
import { toast } from "@/components/ui/toast/use-toast"

interface InstructionsClientProps {
  url: string
  coins: number
  title: string
}

export default function InstructionsClient({ url, coins, title }: InstructionsClientProps) {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      toast({
        title: "Copied!",
        description: "Link copied to clipboard",
      })
      setTimeout(() => setCopied(false), 3000)
    } catch (err) {
      console.error("Failed to copy:", err)
      toast({
        title: "Error",
        description: "Failed to copy link to clipboard",
        variant: "destructive",
      })
    }
  }

  const openLink = () => {
    window.open(url, "_blank")
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Earn {coins} Coins</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Task: {title}</CardTitle>
          <CardDescription>Complete this task to earn {coins} coins</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Important Instructions</AlertTitle>
            <AlertDescription>Follow these steps carefully to ensure you receive your coins.</AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div className="rounded-md bg-muted p-4">
              <h3 className="font-medium mb-2">Step 1: Visit the V2links Page</h3>
              <p className="text-sm mb-4">
                Click the button below to open the V2links page. You'll need to complete the process on that page.
              </p>
              <div className="flex gap-2">
                <Button onClick={openLink} className="flex items-center gap-2">
                  <ExternalLink className="h-4 w-4" />
                  Open V2links
                </Button>
                <Button variant="outline" onClick={copyToClipboard} className="flex items-center gap-2">
                  {copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? "Copied!" : "Copy Link"}
                </Button>
              </div>
            </div>

            <div className="rounded-md bg-muted p-4">
              <h3 className="font-medium mb-2">Step 2: Complete the V2links Process</h3>
              <p className="text-sm mb-2">On the V2links page:</p>
              <ol className="list-decimal list-inside text-sm space-y-2 ml-2">
                <li>Wait for the countdown to complete (usually 5-15 seconds)</li>
                <li>Click the "Continue" or similar button that appears</li>
                <li>If there are any captchas, solve them</li>
                <li>You may need to disable any ad blockers temporarily</li>
                <li>Stay on the final page for at least 10 seconds</li>
              </ol>
            </div>

            <div className="rounded-md bg-muted p-4">
              <h3 className="font-medium mb-2">Step 3: Receive Your Coins</h3>
              <p className="text-sm">
                After completing the process, your account will be credited with {coins} coins. This usually happens
                automatically, but it may take a few minutes to reflect in your balance.
              </p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <p className="text-sm text-muted-foreground">Having trouble? Try refreshing the page or contact support.</p>
          <Button variant="outline" onClick={() => window.close()}>
            Close
          </Button>
        </CardFooter>
      </Card>

      <div className="bg-muted rounded-lg p-4">
        <h3 className="font-medium mb-2">Your Link:</h3>
        <div className="bg-background p-3 rounded border break-all font-mono text-sm">{url}</div>
      </div>
    </div>
  )
}
