"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Check, X, Award } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"

interface Badge {
  id: number
  name: string
  description: string | null
  image_url: string | null
  rarity: string
}

interface UserBadge {
  badge_id: number
  awarded_at: string
  badge: Badge
}

interface BadgeSelectorProps {
  userId: string
  currentSelectedBadgeId?: string | null
  onBadgeSelected?: () => void
}

export function BadgeSelector({ userId, currentSelectedBadgeId, onBadgeSelected }: BadgeSelectorProps) {
  const [userBadges, setUserBadges] = useState<UserBadge[]>([])
  const [selectedBadgeId, setSelectedBadgeId] = useState<string | null>(currentSelectedBadgeId || null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    loadUserBadges()
  }, [userId])

  const loadUserBadges = async () => {
    try {
      const supabase = createClient()

      const { data, error } = await supabase
        .from("user_badges")
        .select(`
          badge_id,
          awarded_at,
          badge:badges(*)
        `)
        .eq("user_id", userId)
        .order("awarded_at", { ascending: false })

      if (error) throw error

      setUserBadges(data || [])
    } catch (error) {
      console.error("Error loading user badges:", error)
      toast({
        title: "Error",
        description: "Failed to load your badges.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSelectBadge = async (badgeId: number) => {
    setUpdating(true)
    try {
      const supabase = createClient()

      const { error } = await supabase.from("profiles").update({ selected_badge_id: badgeId }).eq("id", userId)

      if (error) throw error

      setSelectedBadgeId(badgeId.toString())
      toast({
        title: "Badge selected!",
        description: "Your badge will now appear next to your name.",
      })
      onBadgeSelected?.()
    } catch (error) {
      console.error("Error selecting badge:", error)
      toast({
        title: "Error",
        description: "Failed to select badge.",
        variant: "destructive",
      })
    } finally {
      setUpdating(false)
    }
  }

  const handleUnselectBadge = async () => {
    setUpdating(true)
    try {
      const supabase = createClient()

      const { error } = await supabase.from("profiles").update({ selected_badge_id: null }).eq("id", userId)

      if (error) throw error

      setSelectedBadgeId(null)
      toast({
        title: "Badge unselected",
        description: "Your badge has been removed.",
      })
      onBadgeSelected?.()
    } catch (error) {
      console.error("Error unselecting badge:", error)
      toast({
        title: "Error",
        description: "Failed to unselect badge.",
        variant: "destructive",
      })
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Select Your Display Badge</CardTitle>
          <CardDescription>Loading your badges...</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (userBadges.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Badges to Display</CardTitle>
          <CardDescription>You need to earn badges first before you can display them!</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <Award className="h-16 w-16 text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground text-center max-w-md">
            Complete activities, participate in challenges, or contribute to the platform to earn badges.
          </p>
          <Button className="mt-4" asChild>
            <a href="/challenges">Explore Challenges</a>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Select Your Display Badge</CardTitle>
        <CardDescription>Choose a badge to display next to your name everywhere on the platform</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* No badge option */}
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <X className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium">No Badge</p>
                <p className="text-sm text-muted-foreground">Don't display any badge</p>
              </div>
            </div>
            <Button
              variant={selectedBadgeId === null ? "default" : "outline"}
              size="sm"
              onClick={handleUnselectBadge}
              disabled={updating}
            >
              {selectedBadgeId === null && <Check className="h-4 w-4 mr-1" />}
              {selectedBadgeId === null ? "Selected" : "Select"}
            </Button>
          </div>

          {/* Badge options */}
          {userBadges.map((userBadge) => (
            <div key={userBadge.badge_id} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-2xl bg-primary/10">
                  {userBadge.badge.image_url ? (
                    <img
                      src={userBadge.badge.image_url || "/placeholder.svg"}
                      alt={userBadge.badge.name}
                      className="w-10 h-10 rounded-full"
                    />
                  ) : (
                    "🏆"
                  )}
                </div>
                <div>
                  <p className="font-medium">{userBadge.badge.name}</p>
                  <p className="text-sm text-muted-foreground">{userBadge.badge.description}</p>
                  <p className="text-xs capitalize text-primary">{userBadge.badge.rarity}</p>
                </div>
              </div>
              <Button
                variant={selectedBadgeId === userBadge.badge_id.toString() ? "default" : "outline"}
                size="sm"
                onClick={() => handleSelectBadge(userBadge.badge_id)}
                disabled={updating}
              >
                {selectedBadgeId === userBadge.badge_id.toString() && <Check className="h-4 w-4 mr-1" />}
                {selectedBadgeId === userBadge.badge_id.toString() ? "Selected" : "Select"}
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
