import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = createClient()

    // Get the current user
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession()

    if (authError || !session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id
    console.log("📊 Fetching fresh dashboard stats for user:", userId)

    // Get fresh coin balance - no caching
    const { data: coinData } = await supabase.from("user_coins").select("balance").eq("user_id", userId).single()

    const coins = coinData?.balance || 0

    // Get fresh quiz total score
    const { data: quizData } = await supabase.from("user_progress").select("score").eq("user_id", userId)

    const quizTotalScore = quizData?.reduce((sum, item) => sum + (item.score || 0), 0) || 0

    // Get fresh courses completed
    const { data: coursesData } = await supabase.from("course_purchases").select("id").eq("user_id", userId)

    const coursesCompleted = coursesData?.length || 0

    // Get fresh daily reward status
    const { data: rewardStatus, error: rewardError } = await supabase.rpc("get_daily_reward_status", {
      p_user_id: userId,
    })

    let canClaimDailyReward = true
    let currentStreak = 0

    if (!rewardError && rewardStatus) {
      canClaimDailyReward = rewardStatus.can_claim || false
      currentStreak = rewardStatus.current_streak || 0
    } else {
      // Fallback: check manually with fresh data
      const { data: dailyReward } = await supabase
        .from("daily_rewards")
        .select("last_claimed_at, streak_count")
        .eq("user_id", userId)
        .single()

      if (dailyReward) {
        const lastClaimedDate = new Date(dailyReward.last_claimed_at).toDateString()
        const todayDate = new Date().toDateString()
        canClaimDailyReward = lastClaimedDate !== todayDate
        currentStreak = dailyReward.streak_count || 0
      }
    }

    // Get fresh chat messages count
    const { data: chatData } = await supabase
      .from("global_chat_messages")
      .select("id")
      .eq("user_id", userId)
      .limit(1000)

    const chatMessages = chatData?.length || 0

    // Get fresh leaderboard data
    const { data: leaderboardData } = await supabase.rpc("get_quiz_leaderboard", {
      limit_count: 5,
    })

    // Get fresh recent activities
    const { data: activitiesData } = await supabase
      .from("user_activities")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(5)

    // Return fresh data with no-cache headers
    const response = NextResponse.json({
      stats: {
        coins,
        courses_completed: coursesCompleted,
        quiz_total_score: quizTotalScore,
        chat_messages: chatMessages,
        current_streak: currentStreak,
        can_claim_daily_reward: canClaimDailyReward,
        articles_read: Math.floor(Math.random() * 10) + 1, // Placeholder
      },
      leaderboard: leaderboardData || [],
      activities: activitiesData || [],
    })

    // Set no-cache headers
    response.headers.set("Cache-Control", "no-cache, no-store, must-revalidate")
    response.headers.set("Pragma", "no-cache")
    response.headers.set("Expires", "0")

    return response
  } catch (error) {
    console.error("❌ Error fetching dashboard stats:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
