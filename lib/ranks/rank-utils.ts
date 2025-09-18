import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

export interface RankInfo {
  name: string
  color: string
  minScore: number
  nextRank?: string
  nextRankScore?: number
  progress?: number
}

const RANKS: Record<string, RankInfo> = {
  bronze: { name: "Bronze", color: "#CD7F32", minScore: 0 },
  silver: { name: "Silver", color: "#C0C0C0", minScore: 50 },
  gold: { name: "Gold", color: "#FFD700", minScore: 150 },
  platinum: { name: "Platinum", color: "#E5E4E2", minScore: 300 },
  diamond: { name: "Diamond", color: "#B9F2FF", minScore: 600 },
  ace: { name: "Ace", color: "#FF5733", minScore: 1000 },
  conqueror: { name: "Conqueror", color: "#9932CC", minScore: 1500 },
  grandmaster: { name: "Grandmaster", color: "#FF0000", minScore: 2200 },
}

// Calculate next rank information
function calculateNextRank(currentRank: string, totalScore: number): RankInfo {
  const rankInfo = { ...RANKS[currentRank] }

  // Find the next rank
  const rankKeys = Object.keys(RANKS)
  const currentIndex = rankKeys.indexOf(currentRank)

  if (currentIndex < rankKeys.length - 1) {
    const nextRankKey = rankKeys[currentIndex + 1]
    const nextRank = RANKS[nextRankKey]

    rankInfo.nextRank = nextRank.name
    rankInfo.nextRankScore = nextRank.minScore

    // Calculate progress to next rank
    const currentMinScore = rankInfo.minScore
    const nextMinScore = nextRank.minScore
    const scoreRange = nextMinScore - currentMinScore
    const userProgress = totalScore - currentMinScore

    rankInfo.progress = Math.min(Math.floor((userProgress / scoreRange) * 100), 99)
  } else {
    // Already at highest rank
    rankInfo.progress = 100
  }

  return rankInfo
}

// Get user's current rank
export async function getUserRank(userId: string) {
  const supabase = createClient(cookies())

  // First check if the user exists in user_rank_data
  const { data: rankData, error: rankError } = await supabase
    .from("user_rank_data")
    .select("current_rank, total_score")
    .eq("user_id", userId)
    .single()

  if (rankError || !rankData) {
    // If not found in user_rank_data, check if there's a view called user_ranks
    const { data: viewData, error: viewError } = await supabase
      .from("user_ranks")
      .select("current_rank, total_score")
      .eq("user_id", userId)
      .single()

    if (viewError || !viewData) {
      // If not found in either, create a new entry in user_rank_data
      await supabase.from("user_rank_data").insert({ user_id: userId, current_rank: "bronze", total_score: 0 })

      return {
        ...RANKS.bronze,
        progress: 0,
        nextRank: RANKS.silver.name,
        nextRankScore: RANKS.silver.minScore,
      }
    }

    return calculateNextRank(viewData.current_rank, viewData.total_score)
  }

  return calculateNextRank(rankData.current_rank, rankData.total_score)
}

// Add activity score
export async function addActivityScore(userId: string, activityType: string, score: number) {
  const supabase = createClient(cookies())

  // Call the add_activity_score function
  const { error } = await supabase.rpc("add_activity_score", {
    p_user_id: userId,
    p_activity_type: activityType,
    p_score: score,
  })

  return !error
}

// Get all ranks for reference
export function getAllRanks() {
  return RANKS
}

// Define activity score values
export const ACTIVITY_SCORES = {
  CHAT_MESSAGE: 1,
  QUIZ_ATTEMPT: 3,
  QUIZ_LEVEL_CLEARED: 5,
  ARTICLE_PUBLISHED: 7,
  ITEM_PURCHASED: 2,
  TASK_COMPLETED: 3,
}

// Calculate rank from score
export function calculateRankFromScore(score: number): string {
  const RANK_TIERS = {
    BRONZE: { name: "bronze", minScore: 0 },
    SILVER: { name: "silver", minScore: 50 },
    GOLD: { name: "gold", minScore: 150 },
    PLATINUM: { name: "platinum", minScore: 300 },
    DIAMOND: { name: "diamond", minScore: 600 },
    ACE: { name: "ace", minScore: 1000 },
    CONQUEROR: { name: "conqueror", minScore: 1500 },
    GRANDMASTER: { name: "grandmaster", minScore: 2200 },
  }
  if (score >= RANK_TIERS.GRANDMASTER.minScore) return RANK_TIERS.GRANDMASTER.name
  if (score >= RANK_TIERS.CONQUEROR.minScore) return RANK_TIERS.CONQUEROR.name
  if (score >= RANK_TIERS.ACE.minScore) return RANK_TIERS.ACE.name
  if (score >= RANK_TIERS.DIAMOND.minScore) return RANK_TIERS.DIAMOND.name
  if (score >= RANK_TIERS.PLATINUM.minScore) return RANK_TIERS.PLATINUM.name
  if (score >= RANK_TIERS.GOLD.minScore) return RANK_TIERS.GOLD.name
  if (score >= RANK_TIERS.SILVER.minScore) return RANK_TIERS.SILVER.name
  return RANK_TIERS.BRONZE.name
}

// Get rank badge path
export function getRankBadgePath(rank: string): string {
  return `/badges/${rank.toLowerCase()}.png`
}

// Get next rank information
export function getNextRankInfo(currentScore: number): { nextRank: string; pointsNeeded: number } | null {
  const RANK_TIERS = {
    BRONZE: { name: "bronze", minScore: 0 },
    SILVER: { name: "silver", minScore: 50 },
    GOLD: { name: "gold", minScore: 150 },
    PLATINUM: { name: "platinum", minScore: 300 },
    DIAMOND: { name: "diamond", minScore: 600 },
    ACE: { name: "ace", minScore: 1000 },
    CONQUEROR: { name: "conqueror", minScore: 1500 },
    GRANDMASTER: { name: "grandmaster", minScore: 2200 },
  }
  const ranks = Object.values(RANK_TIERS).sort((a, b) => a.minScore - b.minScore)

  for (const rank of ranks) {
    if (currentScore < rank.minScore) {
      return {
        nextRank: rank.name,
        pointsNeeded: rank.minScore - currentScore,
      }
    }
  }

  // If user has reached the highest rank
  return null
}
