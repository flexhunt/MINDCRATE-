import { createClient } from "@/lib/supabase/client"
import { createClient as createServerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

export interface Badge {
  id: string
  name: string
  display_name: string
  description?: string
  icon: string
  color: string
  rarity: string
  requirement_type?: string
  requirement_value?: number
}

export interface UserBadge extends Badge {
  earned_at: string
}

export interface UserStats {
  messages_sent: number
  login_streak: number
  longest_login_streak: number
  total_logins: number
  courses_completed: number
  challenges_completed: number
  last_login_date?: string
}

// Client-side functions
export async function getUserBadges(userId: string): Promise<UserBadge[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("user_badges")
    .select(`
      earned_at,
      badges (
        id,
        name,
        display_name,
        description,
        icon,
        color,
        rarity,
        requirement_type,
        requirement_value
      )
    `)
    .eq("user_id", userId)
    .order("earned_at", { ascending: false })

  if (error) {
    console.error("Error fetching user badges:", error)
    return []
  }

  return (
    data?.map((item) => ({
      ...item.badges,
      earned_at: item.earned_at,
    })) || []
  )
}

export async function getAllBadges(): Promise<Badge[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("badges")
    .select("*")
    .eq("is_active", true)
    .order("rarity", { ascending: true })

  if (error) {
    console.error("Error fetching badges:", error)
    return []
  }

  return data || []
}

export async function getUserStats(userId: string): Promise<UserStats | null> {
  const supabase = createClient()

  const { data, error } = await supabase.from("user_stats").select("*").eq("user_id", userId).single()

  if (error) {
    console.error("Error fetching user stats:", error)
    return null
  }

  return data
}

export async function selectBadge(badgeId: string): Promise<boolean> {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return false

  // Check if user owns this badge
  const { data: userBadge } = await supabase
    .from("user_badges")
    .select("id")
    .eq("user_id", user.id)
    .eq("badge_id", badgeId)
    .single()

  if (!userBadge) return false

  // Update profile with selected badge
  const { error } = await supabase.from("profiles").update({ selected_badge_id: badgeId }).eq("id", user.id)

  return !error
}

export async function unselectBadge(): Promise<boolean> {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return false

  const { error } = await supabase.from("profiles").update({ selected_badge_id: null }).eq("id", user.id)

  return !error
}

// Server-side functions
export async function getUserBadgesServer(userId: string): Promise<UserBadge[]> {
  const supabase = createServerClient(cookies())

  const { data, error } = await supabase
    .from("user_badges")
    .select(`
      earned_at,
      badges (
        id,
        name,
        display_name,
        description,
        icon,
        color,
        rarity,
        requirement_type,
        requirement_value
      )
    `)
    .eq("user_id", userId)
    .order("earned_at", { ascending: false })

  if (error) {
    console.error("Error fetching user badges:", error)
    return []
  }

  return (
    data?.map((item) => ({
      ...item.badges,
      earned_at: item.earned_at,
    })) || []
  )
}

export async function getUserStatsServer(userId: string): Promise<UserStats | null> {
  const supabase = createServerClient(cookies())

  const { data, error } = await supabase.from("user_stats").select("*").eq("user_id", userId).single()

  if (error) {
    console.error("Error fetching user stats:", error)
    return null
  }

  return data
}
