import { createClient } from "@/lib/supabase/server"

export async function processCoinLink(code: string, userId: string) {
  try {
    const supabase = createClient()

    // 1. Get the coin link
    const { data: link, error: linkError } = await supabase
      .from("coin_links")
      .select("*")
      .eq("code", code)
      .eq("active", true)
      .single()

    if (linkError || !link) {
      return {
        success: false,
        message: "Link not found or inactive",
      }
    }

    // 2. Check if user has already used this link
    const { count, error: countError } = await supabase
      .from("coin_link_uses")
      .select("*", { count: "exact", head: true })
      .eq("link_id", link.id)
      .eq("user_id", userId)

    if (countError) {
      return {
        success: false,
        message: "Error checking link usage",
      }
    }

    if (count && count >= link.max_uses) {
      return {
        success: false,
        message: "You have already used this link the maximum number of times",
      }
    }

    // 3. Record the use
    const { error: useError } = await supabase.from("coin_link_uses").insert({
      link_id: link.id,
      user_id: userId,
    })

    if (useError) {
      return {
        success: false,
        message: "Error recording link use",
      }
    }

    // 4. Get current balance
    const { data: coinData, error: coinError } = await supabase
      .from("user_coins")
      .select("balance")
      .eq("user_id", userId)
      .single()

    let currentBalance = 0
    if (!coinError && coinData) {
      currentBalance = coinData.balance
    }

    // 5. Update user's coin balance
    const { error: updateError } = await supabase.from("user_coins").upsert({
      user_id: userId,
      balance: currentBalance + link.coins,
    })

    if (updateError) {
      return {
        success: false,
        message: "Error updating coin balance",
      }
    }

    // 6. Return success
    return {
      success: true,
      message: "Coins awarded successfully",
      coins_awarded: link.coins,
    }
  } catch (error) {
    console.error("Error processing coin link:", error)
    return {
      success: false,
      message: "An unexpected error occurred",
    }
  }
}
