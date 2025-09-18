"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { ChallengeService } from "@/lib/challenges/challenge-service"
import { useToast } from "@/hooks/use-toast"
import { CheckCircle, XCircle } from "lucide-react"

interface CheckinDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  challengeId: string
  onCheckinComplete: () => void
}

export function CheckinDialog({ open, onOpenChange, challengeId, onCheckinComplete }: CheckinDialogProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<"success" | "failed">("success")
  const [notes, setNotes] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await ChallengeService.checkIn(challengeId, { status, notes })

      // Get motivation message
      const motivationResponse = await fetch("/api/challenges/ai-motivation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challengeId,
          type: status === "failed" ? "failed" : "motivation",
        }),
      })

      const motivation = await motivationResponse.json()

      toast({
        title: status === "success" ? "Check-in Successful! 🎉" : "Thanks for being honest 💪",
        description:
          motivation.message || (status === "success" ? "Keep up the great work!" : "Tomorrow is a new day!"),
      })

      onCheckinComplete()
      setNotes("")
      setStatus("success")
    } catch (error) {
      console.error("Error checking in:", error)
      toast({
        title: "Error",
        description: "Failed to record check-in. Please try again.",
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
            Daily Check-in ✅
          </DialogTitle>
          <DialogDescription>How did you do today? Be honest - it's the only way to grow!</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <Label>How did you do today?</Label>
            <RadioGroup value={status} onValueChange={(value: any) => setStatus(value)}>
              <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-green-50">
                <RadioGroupItem value="success" id="success" />
                <Label htmlFor="success" className="flex items-center gap-2 cursor-pointer flex-1">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <div>
                    <div className="font-medium">I stayed strong! 💪</div>
                    <div className="text-sm text-gray-600">Successfully followed the challenge</div>
                  </div>
                </Label>
              </div>

              <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-red-50">
                <RadioGroupItem value="failed" id="failed" />
                <Label htmlFor="failed" className="flex items-center gap-2 cursor-pointer flex-1">
                  <XCircle className="w-5 h-5 text-red-500" />
                  <div>
                    <div className="font-medium">I slipped up 😔</div>
                    <div className="text-sm text-gray-600">But I'm being honest about it</div>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={
                status === "success"
                  ? "How are you feeling? What helped you stay strong?"
                  : "What happened? What will you do differently tomorrow?"
              }
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className={
                status === "success"
                  ? "bg-gradient-to-r from-green-600 to-blue-600"
                  : "bg-gradient-to-r from-red-600 to-orange-600"
              }
            >
              {loading ? "Recording..." : "Record Check-in"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
