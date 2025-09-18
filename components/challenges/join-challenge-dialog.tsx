"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ChallengeService } from "@/lib/challenges/challenge-service"
import { useToast } from "@/hooks/use-toast"

interface JoinChallengeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onChallengeJoined: () => void
}

export function JoinChallengeDialog({ open, onOpenChange, onChallengeJoined }: JoinChallengeDialogProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [inviteCode, setInviteCode] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteCode.trim()) return

    setLoading(true)

    try {
      const result = await ChallengeService.joinByInviteCode(inviteCode.trim().toUpperCase())

      if (result.success) {
        toast({
          title: "Challenge Joined! 🎉",
          description: "You're now part of the challenge. Let's build that willpower!",
        })
        onChallengeJoined()
        setInviteCode("")
      } else {
        toast({
          title: "Failed to Join",
          description: result.error || "Invalid invite code",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error joining challenge:", error)
      toast({
        title: "Error",
        description: "Failed to join challenge. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Join Challenge 🤝
          </DialogTitle>
          <DialogDescription>Enter the invite code to join a challenge with friends</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="invite-code">Invite Code</Label>
            <Input
              id="invite-code"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              placeholder="Enter 8-character code"
              maxLength={8}
              className="text-center text-lg font-mono tracking-wider"
            />
          </div>

          <div className="flex justify-end space-x-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !inviteCode.trim()}
              className="bg-gradient-to-r from-purple-600 to-blue-600"
            >
              {loading ? "Joining..." : "Join Challenge"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
