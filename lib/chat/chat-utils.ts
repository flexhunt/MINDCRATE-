import { createClient } from "@/lib/supabase/client"

export const MAX_MESSAGE_LENGTH = 150
export const RATE_LIMIT_COUNT = 5
export const RATE_LIMIT_WINDOW_MS = 10000 // 10 seconds

export async function fetchRecentMessages(limit = 50) {
  const supabase = createClient()

  try {
    const { data, error } = await supabase
      .from("global_chat_messages")
      .select(`
        id,
        user_id,
        message,
        created_at,
        reply_to_id,
        profiles(id, username, avatar_url)
      `)
      .order("created_at", { ascending: true })
      .limit(limit)

    if (error) {
      console.error("Error fetching chat messages:", error)
      return []
    }

    // Process the data to ensure it has the expected structure
    return data.map((message) => ({
      ...message,
      user: message.profiles || { username: "Unknown User" },
    }))
  } catch (err) {
    console.error("Error in fetchRecentMessages:", err)
    return []
  }
}

export async function sendMessage(message: string, userId: string) {
  if (!message.trim() || message.length > MAX_MESSAGE_LENGTH) {
    throw new Error(`Message must be between 1 and ${MAX_MESSAGE_LENGTH} characters`)
  }

  const supabase = createClient()

  try {
    const { error } = await supabase.from("global_chat_messages").insert([{ user_id: userId, message: message.trim() }])

    if (error) {
      console.error("Error sending message:", error)
      throw error
    }

    return true
  } catch (err) {
    console.error("Error in sendMessage:", err)
    throw err
  }
}

// Frontend rate limiting
export class RateLimiter {
  private timestamps: number[] = []

  canSendMessage(): boolean {
    const now = Date.now()
    // Remove timestamps older than the window
    this.timestamps = this.timestamps.filter((time) => now - time < RATE_LIMIT_WINDOW_MS)

    // Check if we've hit the limit
    if (this.timestamps.length >= RATE_LIMIT_COUNT) {
      return false
    }

    // Add current timestamp
    this.timestamps.push(now)
    return true
  }

  getTimeUntilNextAllowed(): number {
    if (this.timestamps.length < RATE_LIMIT_COUNT) {
      return 0
    }

    const oldestTimestamp = this.timestamps[0]
    const now = Date.now()
    const timeUntilExpiry = RATE_LIMIT_WINDOW_MS - (now - oldestTimestamp)

    return Math.max(0, timeUntilExpiry)
  }
}

export async function deleteMessage(messageId: string, userId: string) {
  const supabase = createClient()

  try {
    const { error } = await supabase.from("global_chat_messages").delete().eq("id", messageId).eq("user_id", userId)

    if (error) {
      console.error("Error deleting message:", error)
      throw error
    }

    return true
  } catch (err) {
    console.error("Error in deleteMessage:", err)
    throw err
  }
}
