import { createClient } from "@/lib/supabase/client"

// Enhanced query functions that always include verified status
export const getProfileWithVerified = async (userId: string) => {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, name, avatar_url, bio, website, verified, created_at")
    .eq("id", userId)
    .single()

  return { data, error }
}

export const getProfilesWithVerified = async (userIds: string[]) => {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, name, avatar_url, bio, verified, is_angle")
    .in("id", userIds)

  return { data, error }
}

export const getChatMessagesWithVerified = async (limit = 50) => {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("global_chat_messages")
    .select(`
      id,
      user_id,
      message,
      created_at,
      reply_to_id,
      mentions,
      user:profiles!user_id (
        id,
        username,
        avatar_url,
        verified,
        is_angle
      )
    `)
    .order("created_at", { ascending: false })
    .limit(limit)

  return { data, error }
}

export const getArticlesWithVerifiedAuthors = async () => {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("articles")
    .select(`
      *,
      author:profiles!author_id (
        id,
        username,
        name,
        avatar_url,
        verified
      )
    `)
    .eq("published", true)
    .order("created_at", { ascending: false })

  return { data, error }
}
