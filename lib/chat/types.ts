export interface ChatMessage {
  id: string
  user_id: string
  message: string
  created_at: string
  user: {
    username: string
    avatar_url?: string
  }
}

export interface RankInfo {
  name: string
  color: string
}

export const RANK_COLORS: Record<string, RankInfo> = {
  bronze: { name: "Bronze", color: "#a97142" },
  silver: { name: "Silver", color: "#c0c0c0" },
  gold: { name: "Gold", color: "#ffd700" },
  platinum: { name: "Platinum", color: "#e5e4e2" },
  diamond: { name: "Diamond", color: "#b9f2ff" },
  ace: { name: "Ace", color: "#ff5733" },
  conqueror: { name: "Conqueror", color: "#9c27b0" },
  grandmaster: { name: "Grandmaster", color: "#9c27b0" },
}
