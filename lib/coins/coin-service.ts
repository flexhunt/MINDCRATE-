// Remove the next/headers import
// import { createClient } from "@/lib/supabase/server"
// import { cookies } from "next/headers"

// Coin reward constants
export const REWARDS = {
  DAILY_LOGIN: 10,
  STREAK_BONUS: 5, // Additional coins per day of streak
  PROFILE_COMPLETE: 50,
  DEBATE_WIN: 10, // Reward for winning a debate
}

// Create a version that accepts a supabase client instead of creating one
export async function getUserCoins(userId: string, supabase: any) {
  // Check if user has a coin balance record
  const { data, error } = await supabase.from("user_coins").select("*").eq("user_id", userId).single()

  if (error && error.code !== "PGRST116") {
    // PGRST116 is "no rows returned"
    console.error("Error fetching user coins:", error)
    throw error
  }

  // If no record exists, create one
  if (!data) {
    const { data: newData, error: insertError } = await supabase
      .from("user_coins")
      .insert({
        user_id: userId,
        balance: 0,
        lifetime_earned: 0,
      })
      .select()
      .single()

    if (insertError) {
      console.error("Error creating user coins record:", insertError)
      throw insertError
    }

    return newData
  }

  return data
}

export async function addCoins(
  userId: string,
  amount: number,
  transactionType: string,
  supabase: any,
  description?: string,
  metadata?: any,
) {
  // Start a transaction
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session || session.user.id !== userId) {
    throw new Error("Unauthorized")
  }

  // Get current balance
  const { data: coinData } = await supabase
    .from("user_coins")
    .select("balance, lifetime_earned")
    .eq("user_id", userId)
    .single()

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
    throw updateError
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
    throw transactionError
  }

  return {
    success: true,
    balance: newBalance,
    amount,
    transactionType,
  }
}

export async function claimDailyReward(userId: string, supabase: any) {
  // Check if user has already claimed today
  const { data: rewardData } = await supabase.from("daily_rewards").select("*").eq("user_id", userId).single()

  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()

  // If user has claimed today, return error
  if (rewardData?.last_claimed_at) {
    const lastClaimedDate = new Date(rewardData.last_claimed_at)
    const lastClaimedDay = new Date(
      lastClaimedDate.getFullYear(),
      lastClaimedDate.getMonth(),
      lastClaimedDate.getDate(),
    ).toISOString()

    if (lastClaimedDay === today) {
      return {
        success: false,
        message: "Daily reward already claimed today",
        nextClaimTime: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString(),
      }
    }

    // Check if this is a consecutive day (streak)
    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayDate = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate()).toISOString()

    const isStreak = lastClaimedDay === yesterdayDate
    const newStreakCount = isStreak ? rewardData.streak_count + 1 : 1

    // Update daily_rewards
    await supabase.from("daily_rewards").upsert({
      user_id: userId,
      last_claimed_at: now.toISOString(),
      streak_count: newStreakCount,
      updated_at: now.toISOString(),
    })

    // Calculate reward amount with streak bonus
    const streakBonus = (newStreakCount - 1) * REWARDS.STREAK_BONUS
    const totalReward = REWARDS.DAILY_LOGIN + streakBonus

    // Add coins
    await addCoins(
      userId,
      totalReward,
      "daily_reward",
      supabase,
      `Daily login reward with ${newStreakCount} day streak`,
      { streak: newStreakCount },
    )

    return {
      success: true,
      amount: totalReward,
      streak: newStreakCount,
      streakBonus: streakBonus,
    }
  } else {
    // First time claiming
    await supabase.from("daily_rewards").insert({
      user_id: userId,
      last_claimed_at: now.toISOString(),
      streak_count: 1,
    })

    // Add coins
    await addCoins(userId, REWARDS.DAILY_LOGIN, "daily_reward", supabase, "First daily login reward", { streak: 1 })

    return {
      success: true,
      amount: REWARDS.DAILY_LOGIN,
      streak: 1,
      streakBonus: 0,
    }
  }
}

export async function processReferral(referralCode: string, referredUserId: string, supabase: any) {
  // Find the referrer
  const { data: referrer } = await supabase.from("profiles").select("id").eq("referral_code", referralCode).single()

  if (!referrer) {
    return {
      success: false,
      message: "Invalid referral code",
    }
  }

  // Make sure user isn't referring themselves
  if (referrer.id === referredUserId) {
    return {
      success: false,
      message: "You cannot refer yourself",
    }
  }

  // Check if this user has already been referred
  const { data: existingReferral } = await supabase
    .from("referrals")
    .select("*")
    .eq("referred_id", referredUserId)
    .single()

  if (existingReferral) {
    return {
      success: false,
      message: "User has already been referred",
    }
  }

  // Create the referral record
  const { error: referralError } = await supabase.from("referrals").insert({
    referrer_id: referrer.id,
    referred_id: referredUserId,
    status: "completed",
    reward_claimed: true,
  })

  if (referralError) {
    console.error("Error creating referral:", referralError)
    throw referralError
  }

  // Award coins to both users
  await addCoins(
    referrer.id,
    REWARDS.REFERRAL_BONUS,
    "referral_bonus",
    supabase,
    "Referral bonus for inviting a new user",
    { referredId: referredUserId },
  )

  await addCoins(
    referredUserId,
    REWARDS.REFERRED_BONUS,
    "referred_bonus",
    supabase,
    "Bonus for signing up with a referral code",
    { referrerId: referrer.id },
  )

  return {
    success: true,
    referrerId: referrer.id,
    referredId: referredUserId,
  }
}

export async function getTransactionHistory(userId: string, supabase: any, limit = 10) {
  const { data, error } = await supabase
    .from("coin_transactions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error) {
    console.error("Error fetching transaction history:", error)
    throw error
  }

  return data || []
}

export async function getDailyRewardStatus(userId: string, supabase: any) {
  const { data, error } = await supabase.from("daily_rewards").select("*").eq("user_id", userId).single()

  if (error && error.code !== "PGRST116") {
    console.error("Error fetching daily reward status:", error)
    throw error
  }

  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()

  if (!data) {
    return {
      canClaim: true,
      streak: 0,
      lastClaimed: null,
    }
  }

  const lastClaimedDate = new Date(data.last_claimed_at)
  const lastClaimedDay = new Date(
    lastClaimedDate.getFullYear(),
    lastClaimedDate.getMonth(),
    lastClaimedDate.getDate(),
  ).toISOString()

  return {
    canClaim: lastClaimedDay !== today,
    streak: data.streak_count,
    lastClaimed: data.last_claimed_at,
  }
}
