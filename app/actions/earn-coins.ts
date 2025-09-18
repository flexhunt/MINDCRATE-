"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { validateEarningOpportunityCompletion } from "@/lib/earn-coins/earn-coin-utils"

export async function completeEarningOpportunity(opportunityId: string, userId: string, customData?: any) {
  const supabase = createClient()

  // Validate request
  const { data: opportunity, error: oppError } = await supabase
    .from("coin_earning_opportunities")
    .select("*")
    .eq("id", opportunityId)
    .single()

  if (oppError || !opportunity) {
    console.error("Error finding opportunity:", oppError)
    return {
      success: false,
      message: "Opportunity not found",
    }
  }

  const { valid, error } = await validateEarningOpportunityCompletion({ opportunityId, userId, customData })

  if (!valid) {
    return {
      success: false,
      message: error,
    }
  }

  try {
    // Get current balance
    const { data: userData, error: userError } = await supabase
      .from("user_coins")
      .select("balance, lifetime_earned")
      .eq("user_id", userId)
      .single()

    let currentBalance = 0
    let lifetimeEarned = 0
    if (!userError && userData) {
      currentBalance = userData.balance || 0
      lifetimeEarned = userData.lifetime_earned || 0
    }

    // Update user's coin balance
    const { error: updateError } = await supabase.from("user_coins").upsert({
      user_id: userId,
      balance: currentBalance + opportunity.coins,
      lifetime_earned: lifetimeEarned + opportunity.coins,
      updated_at: new Date().toISOString(),
    })

    if (updateError) {
      console.error("Error updating user balance:", updateError)
      return {
        success: false,
        message: "Error updating coin balance",
      }
    }

    // Record transaction
    const { error: transactionError } = await supabase.from("coin_transactions").insert({
      user_id: userId,
      amount: opportunity.coins,
      transaction_type: "earning_opportunity",
      description: opportunity.title,
      created_at: new Date().toISOString(),
      metadata: customData,
    })

    if (transactionError) {
      console.error("Error creating transaction:", transactionError)
      return {
        success: false,
        message: "Error recording transaction",
      }
    }

    revalidatePath("/earn-coins")
    revalidatePath("/dashboard")

    return {
      success: true,
      message: `You earned ${opportunity.coins} coins!`,
    }
  } catch (error: any) {
    console.error("Error processing coin link:", error)
    return {
      success: false,
      message: "An unexpected error occurred",
    }
  }
}
