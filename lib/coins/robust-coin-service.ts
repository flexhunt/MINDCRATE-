import { createClient } from "@/lib/supabase/client"

/**
 * Deducts coins from a user's balance
 * Uses the dedicated deduct_coins function for reliable deduction
 */
export async function deductCoins(
  userId: string,
  amount: number,
  transactionType: string,
  description?: string,
  metadata?: any,
): Promise<{
  success: boolean
  message: string
  newBalance?: number
  previousBalance?: number
  transactionId?: string
}> {
  try {
    const supabase = createClient()

    // Call the dedicated deduct_coins function
    const { data, error } = await supabase.rpc("deduct_coins", {
      p_user_id: userId,
      p_amount: amount,
      p_transaction_type: transactionType,
      p_description: description,
      p_metadata: metadata,
    })

    if (error) {
      console.error("Error deducting coins:", error)
      return {
        success: false,
        message: error.message || "Failed to deduct coins",
      }
    }

    return {
      success: data.success,
      message: data.message,
      newBalance: data.new_balance,
      previousBalance: data.previous_balance,
      transactionId: data.transaction_id,
    }
  } catch (error: any) {
    console.error("Exception in deductCoins:", error)
    return {
      success: false,
      message: error.message || "An unexpected error occurred",
    }
  }
}

/**
 * Adds coins to a user's balance
 */
export async function addCoins(
  userId: string,
  amount: number,
  transactionType: string,
  description?: string,
  metadata?: any,
): Promise<{
  success: boolean
  message: string
  newBalance?: number
}> {
  try {
    const supabase = createClient()

    // Get current balance
    const { data: coinData, error: balanceError } = await supabase
      .from("user_coins")
      .select("balance, lifetime_earned")
      .eq("user_id", userId)
      .single()

    if (balanceError && balanceError.code !== "PGRST116") {
      console.error("Error fetching balance:", balanceError)
      return {
        success: false,
        message: balanceError.message || "Failed to fetch current balance",
      }
    }

    const currentBalance = coinData?.balance || 0
    const lifetimeEarned = coinData?.lifetime_earned || 0
    const newBalance = currentBalance + amount
    const newLifetimeEarned = amount > 0 ? lifetimeEarned + amount : lifetimeEarned

    // Update user_coins table
    const { error: updateError } = await supabase.from("user_coins").upsert({
      user_id: userId,
      balance: newBalance,
      lifetime_earned: newLifetimeEarned,
      updated_at: new Date().toISOString(),
    })

    if (updateError) {
      console.error("Error updating coins:", updateError)
      return {
        success: false,
        message: updateError.message || "Failed to update balance",
      }
    }

    // Record the transaction
    const { error: transactionError } = await supabase.from("coin_transactions").insert({
      user_id: userId,
      amount,
      balance_after: newBalance,
      transaction_type: transactionType,
      description,
      metadata,
    })

    if (transactionError) {
      console.error("Error recording transaction:", transactionError)
      // Continue anyway - the balance update was successful
    }

    return {
      success: true,
      message: "Coins added successfully",
      newBalance,
    }
  } catch (error: any) {
    console.error("Exception in addCoins:", error)
    return {
      success: false,
      message: error.message || "An unexpected error occurred",
    }
  }
}

/**
 * Gets a user's current coin balance
 */
export async function getBalance(userId: string): Promise<{
  success: boolean
  balance?: number
  message?: string
}> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase.from("user_coins").select("balance").eq("user_id", userId).single()

    if (error) {
      if (error.code === "PGRST116") {
        // No record found, create one
        const { data: newData, error: createError } = await supabase
          .from("user_coins")
          .insert({
            user_id: userId,
            balance: 0,
            lifetime_earned: 0,
          })
          .select("balance")
          .single()

        if (createError) {
          console.error("Error creating balance record:", createError)
          return {
            success: false,
            message: createError.message || "Failed to create balance record",
          }
        }

        return {
          success: true,
          balance: newData?.balance || 0,
        }
      }

      console.error("Error fetching balance:", error)
      return {
        success: false,
        message: error.message || "Failed to fetch balance",
      }
    }

    return {
      success: true,
      balance: data?.balance || 0,
    }
  } catch (error: any) {
    console.error("Exception in getBalance:", error)
    return {
      success: false,
      message: error.message || "An unexpected error occurred",
    }
  }
}
