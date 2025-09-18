"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Trophy, Medal, Award, Crown } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface LeaderboardEntry {
  user_id: string
  current_streak: number
  longest_streak: number
  total_checkins: number
  xp_earned: number
  rank: number
  profiles: {
    id: string
    username: string
    name?: string
    avatar_url?: string
    bio?: string
  }
}

interface LeaderboardCardProps {
  participants: LeaderboardEntry[]
  challengeTitle?: string
}

export function LeaderboardCard({ participants, challengeTitle }: LeaderboardCardProps) {
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-5 w-5 text-yellow-500" />
      case 2:
        return <Trophy className="h-5 w-5 text-gray-400" />
      case 3:
        return <Medal className="h-5 w-5 text-amber-600" />
      default:
        return <Award className="h-4 w-4 text-gray-500" />
    }
  }

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return (
          <Badge className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-black font-bold">👑 Champion</Badge>
        )
      case 2:
        return <Badge className="bg-gradient-to-r from-gray-300 to-gray-500 text-black font-bold">🥈 Runner-up</Badge>
      case 3:
        return (
          <Badge className="bg-gradient-to-r from-amber-400 to-amber-600 text-black font-bold">🥉 Third Place</Badge>
        )
      default:
        return (
          <Badge variant="outline" className="font-semibold">
            #{rank}
          </Badge>
        )
    }
  }

  const getStreakEmoji = (streak: number) => {
    if (streak >= 30) return "🔥🔥🔥"
    if (streak >= 21) return "🔥🔥"
    if (streak >= 7) return "🔥"
    if (streak >= 3) return "💪"
    return "🌱"
  }

  const getUserDisplayName = (participant: LeaderboardEntry) => {
    return participant.profiles?.name || participant.profiles?.username || "Anonymous User"
  }

  const getUserUsername = (participant: LeaderboardEntry) => {
    return participant.profiles?.username || "anonymous"
  }

  return (
    <Card className="w-full bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
      <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20">
        <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
          <Trophy className="h-5 w-5 text-yellow-500" />
          Leaderboard {challengeTitle && `- ${challengeTitle}`}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          {participants.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <Trophy className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p className="font-medium">No participants yet</p>
              <p className="text-sm">Be the first to join!</p>
            </div>
          ) : (
            participants.map((participant) => (
              <div
                key={participant.user_id}
                className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all hover:shadow-md ${
                  participant.rank === 1
                    ? "bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-300 dark:from-yellow-900/20 dark:to-amber-900/20 dark:border-yellow-600"
                    : participant.rank === 2
                      ? "bg-gradient-to-r from-gray-50 to-slate-50 border-gray-300 dark:from-gray-900/20 dark:to-slate-900/20 dark:border-gray-600"
                      : participant.rank === 3
                        ? "bg-gradient-to-r from-amber-50 to-orange-50 border-amber-300 dark:from-amber-900/20 dark:to-orange-900/20 dark:border-amber-600"
                        : "bg-gray-50 border-gray-200 dark:bg-gray-800/50 dark:border-gray-600"
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    {getRankIcon(participant.rank)}
                    <span className="font-bold text-xl text-gray-900 dark:text-gray-100">#{participant.rank}</span>
                  </div>

                  <Avatar className="h-10 w-10 border-2 border-white dark:border-gray-700">
                    <AvatarImage src={participant.profiles?.avatar_url || "/placeholder.svg"} />
                    <AvatarFallback className="bg-gradient-to-br from-purple-400 to-blue-500 text-white font-bold">
                      {getUserDisplayName(participant).charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">{getUserDisplayName(participant)}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">@{getUserUsername(participant)}</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {participant.total_checkins} check-ins • {participant.xp_earned} XP
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-2xl text-gray-900 dark:text-gray-100">
                        {participant.current_streak}
                      </span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">days</span>
                      <span className="text-lg">{getStreakEmoji(participant.current_streak)}</span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Best: {participant.longest_streak} days</p>
                  </div>

                  {getRankBadge(participant.rank)}
                </div>
              </div>
            ))
          )}
        </div>

        {participants.length > 0 && (
          <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg border border-purple-200 dark:border-purple-700">
            <p className="text-sm text-center text-gray-700 dark:text-gray-300 font-medium">
              🏆 Top performer gets{" "}
              <span className="font-bold text-purple-600 dark:text-purple-400">+100 bonus XP</span> at challenge end!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
