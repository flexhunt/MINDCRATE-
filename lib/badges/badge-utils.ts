import { createClient } from "@/lib/supabase/client"

export interface Badge {
  id: number
  name: string
  description: string | null
  image_url: string | null
  rarity: "common" | "uncommon" | "rare" | "epic" | "legendary"
  created_at: string
}

export interface UserBadge {
  badge_id: number
  awarded_at: string
  badge: Badge
}

export const BADGE_TIERS = {
  common: { name: "Common", color: "#78909C" },
  uncommon: { name: "Uncommon", color: "#4CAF50" },
  rare: { name: "Rare", color: "#2196F3" },
  epic: { name: "Epic", color: "#9C27B0" },
  legendary: { name: "Legendary", color: "#F44336" },
}

export async function getUserBadges(userId: string): Promise<UserBadge[]> {
  if (!userId) return []

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

    if (error) {
      console.error("Error fetching user badges:", error)
      return []
    }

    // Safely filter and map the data
    return (data || [])
      .filter((item) => item && typeof item === "object" && item.badge && typeof item.badge === "object")
      .map((item) => ({
        badge_id: item.badge_id,
        awarded_at: item.awarded_at,
        badge: item.badge as Badge,
      }))
  } catch (error) {
    console.error("Error in getUserBadges:", error)
    return []
  }
}

export async function getUserSelectedBadge(userId: string): Promise<Badge | null> {
  if (!userId) return null

  try {
    const supabase = createClient()

    const { data, error } = await supabase
      .from("profiles")
      .select(`
        selected_badge_id,
        selected_badge:badges(*)
      `)
      .eq("id", userId)
      .single()

    if (error || !data) {
      return null
    }

    // Safely check if selected_badge exists and is an object
    if (data.selected_badge && typeof data.selected_badge === "object") {
      return data.selected_badge as Badge
    }

    return null
  } catch (error) {
    console.error("Error fetching selected badge:", error)
    return null
  }
}

export async function setSelectedBadge(userId: string, badgeId: number | null): Promise<boolean> {
  if (!userId) return false

  try {
    const supabase = createClient()

    const { error } = await supabase.from("profiles").update({ selected_badge_id: badgeId }).eq("id", userId)

    if (error) {
      console.error("Error setting selected badge:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Error in setSelectedBadge:", error)
    return false
  }
}

export async function getAllBadges(): Promise<Badge[]> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase.from("badges").select("*").order("name")

    if (error) {
      console.error("Error fetching all badges:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Error in getAllBadges:", error)
    return []
  }
}

// Fallback function for login streak (since we removed the login_streaks table)
export async function getUserLoginStreak(
  userId: string,
): Promise<{ current_streak: number; longest_streak: number } | null> {
  // Return default values since we removed login streaks
  return {
    current_streak: 0,
    longest_streak: 0,
  }
}

export function getBadgeImagePath(badgeName: string): string {
  return `/badges/${badgeName.toLowerCase().replace(/\s+/g, "-")}.png`
}
