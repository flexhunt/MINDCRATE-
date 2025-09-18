"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Trophy, Medal, Award, Crown } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface LeaderboardEntry {
  id: string
  username: string
  name: string
  avatar_url: string | null
  score: number
  rank: number
}

export default function QuizLeaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true)
        setError(null)

        // Try to use the RPC function first
        const { data: rpcData, error: rpcError } = await supabase.rpc("get_quiz_leaderboard", { limit_count: 10 })

        if (!rpcError && rpcData && rpcData.length > 0) {
          setLeaderboard(rpcData)
          setLoading(false)
          return
        }

        console.log("RPC function failed or returned no data, trying direct query...")

        // Fallback: Direct query using the same logic as leaderboard
        const { data: directData, error: directError } = await supabase.from("user_progress").select(`
            user_id,
            score,
            profiles!inner(id, username, name, avatar_url)
          `)

        if (directError) {
          console.error("Error with direct query:", directError)
          setError("Unable to load quiz scores")
          return
        }

        // Group by user and sum scores (same logic as leaderboard)
        const userScores = new Map()

        directData.forEach((item) => {
          const userId = item.profiles.id
          const currentScore = userScores.get(userId) || 0
          userScores.set(userId, currentScore + (item.score || 0))
        })

        // Convert to leaderboard format and sort
        const leaderboardData: LeaderboardEntry[] = []
        const processedUsers = new Set()

        directData.forEach((item) => {
          const userId = item.profiles.id
          if (!processedUsers.has(userId)) {
            processedUsers.add(userId)
            leaderboardData.push({
              id: userId,
              username: item.profiles.username || "user",
              name: item.profiles.name || "Anonymous",
              avatar_url: item.profiles.avatar_url,
              score: userScores.get(userId) || 0,
              rank: 0, // Will be set after sorting
            })
          }
        })

        // Sort by score descending and assign ranks
        leaderboardData.sort((a, b) => b.score - a.score)
        leaderboardData.forEach((entry, index) => {
          entry.rank = index + 1
        })

        // Take top 10
        setLeaderboard(leaderboardData.slice(0, 10))
      } catch (error) {
        console.error("Error in leaderboard fetch:", error)
        setError("Failed to load leaderboard")
      } finally {
        setLoading(false)
      }
    }

    fetchLeaderboard()
  }, [supabase])

  // Function to render rank icon
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-6 w-6 text-yellow-500" />
      case 2:
        return <Medal className="h-6 w-6 text-gray-400" />
      case 3:
        return <Award className="h-6 w-6 text-amber-600" />
      default:
        return (
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-sm font-bold">{rank}</div>
        )
    }
  }

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return <Badge className="bg-yellow-500 text-white">🥇 Champion</Badge>
      case 2:
        return <Badge className="bg-gray-400 text-white">🥈 Runner-up</Badge>
      case 3:
        return <Badge className="bg-amber-600 text-white">🥉 Third Place</Badge>
      default:
        return null
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl flex items-center gap-2">
              <Trophy className="h-6 w-6 text-yellow-500" />
              Quiz Leaderboard
            </CardTitle>
            <CardDescription>Top performers based on total quiz scores</CardDescription>
          </div>
          <Trophy className="h-8 w-8 text-yellow-500" />
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Trophy className="mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        ) : leaderboard.length > 0 ? (
          <div className="space-y-3">
            {leaderboard.map((entry) => (
              <div
                key={entry.id}
                className={cn(
                  "flex items-center gap-4 rounded-lg border p-4 transition-all hover:shadow-md",
                  entry.rank === 1 &&
                    "bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-950/20 dark:to-yellow-900/20 border-yellow-200",
                  entry.rank === 2 &&
                    "bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-700/50 border-gray-200",
                  entry.rank === 3 &&
                    "bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-950/20 dark:to-amber-900/20 border-amber-200",
                )}
              >
                <div className="flex h-12 w-12 items-center justify-center">{getRankIcon(entry.rank)}</div>

                <Avatar className="h-12 w-12 ring-2 ring-background">
                  <AvatarImage src={entry.avatar_url || "/placeholder.svg"} alt={entry.name || entry.username} />
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                    {(entry.name || entry.username || "U").charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-lg truncate">{entry.name || "Anonymous"}</p>
                    {getRankBadge(entry.rank)}
                  </div>
                  <p className="text-sm text-muted-foreground">@{entry.username || "user"}</p>
                </div>

                <div className="text-right">
                  <div className="flex flex-col items-end">
                    <p className="text-2xl font-bold text-primary">{entry.score}</p>
                    <p className="text-xs text-muted-foreground">total points</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Trophy className="mb-4 h-16 w-16 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No quiz scores yet</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Be the first to complete a quiz and claim the top spot!
            </p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>🎯</span>
              <span>Complete quiz levels to earn points and climb the leaderboard</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
