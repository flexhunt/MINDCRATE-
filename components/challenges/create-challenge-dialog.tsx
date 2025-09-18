"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { ChallengeService } from "@/lib/challenges/challenge-service"
import type { ChallengeTemplate, CreateChallengeData } from "@/lib/challenges/challenge-types"
import { useToast } from "@/hooks/use-toast"

interface CreateChallengeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onChallengeCreated: () => void
  templates: ChallengeTemplate[]
}

export function CreateChallengeDialog({
  open,
  onOpenChange,
  onChallengeCreated,
  templates,
}: CreateChallengeDialogProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<string>("custom")
  const [formData, setFormData] = useState<CreateChallengeData>({
    title: "",
    description: "",
    type: "daily_checkin",
    duration_days: 7,
    rules: "",
    penalty_reward: "",
    is_public: false,
    max_participants: 10,
  })

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId)
    const template = templates.find((t) => t.id === templateId)
    if (template) {
      setFormData({
        title: template.name,
        description: template.description || "",
        type: template.type,
        duration_days: template.duration_days,
        rules: template.rules || "",
        penalty_reward: "",
        is_public: false,
        max_participants: 10,
      })
    } else {
      setFormData({
        title: "",
        description: "",
        type: "daily_checkin",
        duration_days: 7,
        rules: "",
        penalty_reward: "",
        is_public: false,
        max_participants: 10,
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      let challenge
      if (selectedTemplate !== "custom") {
        challenge = await ChallengeService.createFromTemplate(selectedTemplate, formData)
      } else {
        challenge = await ChallengeService.createChallenge(formData)
      }

      toast({
        title: "Challenge Created! 🎉",
        description: `"${challenge.title}" is ready. Time to build that willpower!`,
      })

      onChallengeCreated()
      onOpenChange(false)

      // Reset form
      setFormData({
        title: "",
        description: "",
        type: "daily_checkin",
        duration_days: 7,
        rules: "",
        penalty_reward: "",
        is_public: false,
        max_participants: 10,
      })
      setSelectedTemplate("custom")
    } catch (error: any) {
      console.error("Error creating challenge:", error)

      let errorMessage = "Failed to create challenge. Please try again."
      if (error.message?.includes("Already joined")) {
        errorMessage = "You're already in this challenge!"
      } else if (error.message?.includes("recursion")) {
        errorMessage = "Database error. Please try again in a moment."
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Create New Challenge 🚀
          </DialogTitle>
          <DialogDescription>Start a new challenge to build better habits with friends</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Template Selection */}
          <div className="space-y-2">
            <Label>Choose a Template (Optional)</Label>
            <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Select a template or create custom" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="custom">Custom Challenge</SelectItem>
                {templates
                  .filter((t) => t.is_popular)
                  .map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name} ({template.duration_days} days)
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Challenge Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., No Social Media for 7 Days"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration">Duration (Days) *</Label>
              <Input
                id="duration"
                type="number"
                min="1"
                max="365"
                value={formData.duration_days}
                onChange={(e) => setFormData({ ...formData, duration_days: Number.parseInt(e.target.value) })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="What is this challenge about?"
              rows={3}
            />
          </div>

          {/* Challenge Type */}
          <div className="space-y-2">
            <Label>Challenge Type</Label>
            <Select value={formData.type} onValueChange={(value: any) => setFormData({ ...formData, type: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily_checkin">Daily Check-in</SelectItem>
                <SelectItem value="score_based">Score Based</SelectItem>
                <SelectItem value="time_bound">Time Bound</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Rules */}
          <div className="space-y-2">
            <Label htmlFor="rules">Rules & Guidelines</Label>
            <Textarea
              id="rules"
              value={formData.rules}
              onChange={(e) => setFormData({ ...formData, rules: e.target.value })}
              placeholder="What are the rules? How do participants succeed?"
              rows={3}
            />
          </div>

          {/* Penalty/Reward */}
          <div className="space-y-2">
            <Label htmlFor="penalty">Penalty/Reward (Optional)</Label>
            <Input
              id="penalty"
              value={formData.penalty_reward}
              onChange={(e) => setFormData({ ...formData, penalty_reward: e.target.value })}
              placeholder="e.g., Loser buys coffee for everyone"
            />
          </div>

          {/* Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="max_participants">Max Participants</Label>
              <Input
                id="max_participants"
                type="number"
                min="2"
                max="100"
                value={formData.max_participants}
                onChange={(e) => setFormData({ ...formData, max_participants: Number.parseInt(e.target.value) })}
              />
            </div>
            <div className="flex items-center space-x-2 pt-6">
              <Switch
                id="is_public"
                checked={formData.is_public}
                onCheckedChange={(checked) => setFormData({ ...formData, is_public: checked })}
              />
              <Label htmlFor="is_public">Make Public</Label>
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end space-x-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !formData.title}
              className="bg-gradient-to-r from-purple-600 to-blue-600"
            >
              {loading ? "Creating..." : "Create Challenge 🚀"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
