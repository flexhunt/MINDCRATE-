export async function deleteUser(userId: string) {
  try {
    const supabase = createClient()

    // Check if current user is admin
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: "Not authenticated" }
    }

    const { data: adminCheck } = await supabase.from("admin_users").select("user_id").eq("user_id", user.id).single()

    if (!adminCheck) {
      return { success: false, error: "Not authorized" }
    }

    // Delete user data in order (foreign key constraints)
    const tables = [
      "chat_messages",
      "user_activities",
      "challenge_participants",
      "course_purchases",
      "quiz_results",
      "user_coins",
      "profiles",
    ]

    for (const table of tables) {
      const { error } = await supabase.from(table).delete().eq("user_id", userId)

      if (error && !error.message.includes("does not exist")) {
        console.error(`Error deleting from ${table}:`, error)
      }
    }

    return { success: true }
  } catch (error) {
    console.error("Delete user error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}
