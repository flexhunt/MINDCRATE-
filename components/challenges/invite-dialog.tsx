"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Copy, Share2, Users } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { ChallengeService } from "@/lib/challenges/challenge-service"

interface InviteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  challengeId: string
}

export function InviteDialog({ open, onOpenChange, challengeId }: InviteDialogProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [inviteCode, setInviteCode] = useState("")
  const { toast } = useToast()

  const generateInviteCode = async () => {
    setIsGenerating(true)
    try {
      const code = await ChallengeService.createInviteCode(challengeId)
      setInviteCode(code)
      toast({
        title: "Invite code generated! 🎉",
        description: "Share this code with your friends",
      })
    } catch (error) {
      console.error("Error generating invite code:", error)
      toast({
        title: "Error generating invite code",
        description: "Please try again",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const copyInviteCode = () => {
    if (!inviteCode) return
    navigator.clipboard.writeText(inviteCode)
    toast({
      title: "Copied! 📋",
      description: "Invite code copied to clipboard",
    })
  }

  const shareChallenge = () => {
    if (!inviteCode) return
    const shareText = `Join my challenge on Mindcrate! Use code: ${inviteCode}\n\n${window.location.origin}/challenges/join/${inviteCode}`

    if (navigator.share) {
      navigator.share({
        title: `Join Challenge`,
        text: shareText,
      })
    } else {
      navigator.clipboard.writeText(shareText)
      toast({
        title: "Share text copied! 📱",
        description: "Paste this anywhere to invite friends",
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Invite Friends to Challenge
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {!inviteCode ? (
            <div className="text-center py-6">
              <Button
                onClick={generateInviteCode}
                disabled={isGenerating}
                className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
              >
                {isGenerating ? "Generating..." : "Generate Invite Code"}
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="invite-code">Invite Code</Label>
                <div className="flex gap-2">
                  <Input
                    id="invite-code"
                    value={inviteCode}
                    readOnly
                    className="font-mono text-center text-lg font-bold"
                  />
                  <Button size="icon" onClick={copyInviteCode}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Share Link</Label>
                <div className="flex gap-2">
                  <Input
                    value={`${typeof window !== "undefined" ? window.location.origin : ""}/challenges/join/${inviteCode}`}
                    readOnly
                    className="text-sm"
                  />
                  <Button size="icon" onClick={shareChallenge}>
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">How to invite:</h4>
                <ul className="text-sm space-y-1 text-gray-600 dark:text-gray-300">
                  <li>
                    • Share the invite code: <span className="font-mono font-bold">{inviteCode}</span>
                  </li>
                  <li>• Send the link via WhatsApp/Instagram</li>
                  <li>• Friends can join at /challenges/join/{inviteCode}</li>
                </ul>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
