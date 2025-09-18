"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Calendar, Trophy, Zap, Flame } from "lucide-react"
import type { Challenge, ChallengeParticipant } from "@/lib/challenges/challenge-types"

interface ChallengeCardProps {
  challenge: Challenge
  participant: ChallengeParticipant
  onClick: () => void
}

export function ChallengeCard({ challenge, participant, onClick }: ChallengeCardProps) {
  const daysRemaining = Math.max(
    0,
    Math.ceil((new Date(challenge.ends_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)),
  )
  const totalDays = challenge.duration_days
  const progress = Math.max(0, ((totalDays - daysRemaining) / totalDays) * 100)

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500 dark:bg-green-600"
      case "completed":
        return "bg-blue-500 dark:bg-blue-600"
      case "failed":
        return "bg-red-500 dark:bg-red-600"
      case "quit":
        return "bg-gray-500 dark:bg-gray-600"
      default:
        return "bg-gray-500 dark:bg-gray-600"
    }
  }

  const getStreakEmoji = (streak: number) => {
    if (streak >= 30) return "👑"
    if (streak >= 21) return "🏆"
    if (streak >= 14) return "💎"
    if (streak >= 7) return "🔥"
    if (streak >= 3) return "⚡"
    return "💪"
  }

  const getStreakColor = (streak: number) => {
    if (streak >= 30) return "from-yellow-400 to-orange-500"
    if (streak >= 21) return "from-purple-400 to-pink-500"
    if (streak >= 14) return "from-blue-400 to-cyan-500"
    if (streak >= 7) return "from-red-400 to-orange-500"
    if (streak >= 3) return "from-green-400 to-blue-500"
    return "from-gray-400 to-gray-500"
  }

  return (
    <Card
      className="hover:shadow-lg transition-all duration-200 cursor-pointer hover:scale-105 border-l-4 border-l-purple-500 dark:border-l-purple-400 bg-card/50 backdrop-blur-sm"
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold line-clamp-1 text-foreground">{challenge.title}</CardTitle>
            <CardDescription className="line-clamp-2 text-muted-foreground">{challenge.description}</CardDescription>
          </div>
          <Badge variant="secondary" className={`${getStatusColor(participant.status)} text-white border-0`}>
            {participant.status}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium text-foreground">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-500 dark:text-blue-400" />
            <span className="text-muted-foreground">{daysRemaining} days left</span>
          </div>
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-orange-500 dark:text-orange-400" />
            <span className="text-muted-foreground">{participant.current_streak} streak</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-purple-500 dark:text-purple-400" />
            <span className="text-muted-foreground">{participant.xp_earned} XP</span>
          </div>
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-green-500 dark:text-green-400" />
            <span className="text-muted-foreground">#{participant.total_checkins} check-ins</span>
          </div>
        </div>

        {/* Streak Display */}
        {participant.current_streak > 0 && (
          <div
            className={`bg-gradient-to-r ${getStreakColor(participant.current_streak)} rounded-lg p-3 text-center text-white`}
          >
            <div className="text-2xl mb-1">{getStreakEmoji(participant.current_streak)}</div>
            <div className="text-sm font-medium">{participant.current_streak} Day Streak!</div>
            {participant.longest_streak > participant.current_streak && (
              <div className="text-xs opacity-90">Best: {participant.longest_streak} days</div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
