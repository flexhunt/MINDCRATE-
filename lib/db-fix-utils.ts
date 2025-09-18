import { createClient } from "@/lib/supabase/client"

/**
 * Ensures a user has a coin balance record
 */
export async function ensureUserCoinBalance(userId: string) {
  const supabase = createClient()

  try {
    // Check if user has a coin balance record
    const { data, error } = await supabase.from("user_coins").select("balance").eq("user_id", userId)

    if (error) {
      console.error("Error checking coin balance:", error)
      return { success: false, error }
    }

    // If no record exists, create one using upsert to avoid duplicate key errors
    if (!data || data.length === 0) {
      const { data: newData, error: upsertError } = await supabase
        .from("user_coins")
        .upsert(
          {
            user_id: userId,
            balance: 0,
            lifetime_earned: 0,
            // Remove created_at and updated_at fields
          },
          {
            onConflict: "user_id",
            ignoreDuplicates: true,
          },
        )
        .select()

      if (upsertError) {
        console.error("Error creating coin balance record:", upsertError)

        // Try to fetch the record again in case it was created in a race condition
        const { data: retryData, error: retryError } = await supabase.from("user_coins").select().eq("user_id", userId)

        if (!retryError && retryData && retryData.length > 0) {
          return { success: true, data: retryData[0] }
        }

        return { success: false, error: upsertError }
      }

      return { success: true, data: newData?.[0] }
    }

    return { success: true, data: data[0] }
  } catch (error) {
    console.error("Error in ensureUserCoinBalance:", error)
    return { success: false, error }
  }
}

/**
 * Fixes database issues by creating missing records
 */
export async function fixDatabaseIssues(userId: string) {
  const results = await Promise.all([ensureUserCoinBalance(userId)])

  return {
    success: results.every((result) => result.success),
    results,
  }
}
