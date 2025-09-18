"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Zap, Trophy, Coins, MessageSquare, BookOpen, Target, Flame } from "lucide-react"

interface UserStats {
  id: string
  username?: string
  name?: string
  avatar_url?: string
  level?: number
  xp?: number
  coins?: number
  total_messages?: number
  challenges_completed?: number
  articles_read?: number
  courses_completed?: number
  login_streak?: number
  created_at?: string
  last_active?: string
}

interface UserStatsWidgetProps {
  userId?: string
  compact?: boolean
  className?: string
}

export function UserStatsWidget({ userId, compact = false, className = "" }: UserStatsWidgetProps) {
  const [stats, setStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function fetchStats() {
      try {
        // Get current user if no userId provided
        let targetUserId = userId
        if (!targetUserId) {
          const {
            data: { session },
          } = await supabase.auth.getSession()
          if (!session) return
          targetUserId = session.user.id
        }

        const { data: user, error } = await supabase
          .from("profiles")
          .select(`
            id, username, name, avatar_url, level, xp, coins,
            total_messages, challenges_completed, articles_read,
            courses_completed, login_streak, created_at, last_active
          `)
          .eq("id", targetUserId)
          .single()

        if (error) {
          console.error("Error fetching user stats:", error)
          // Set default stats if user not found
          setStats({
            id: targetUserId,
            level: 1,
            xp: 0,
            coins: 0,
            total_messages: 0,
            challenges_completed: 0,
            articles_read: 0,
            courses_completed: 0,
            login_streak: 0,
          })
        } else {
          setStats(user)
        }
      } catch (error) {
        console.error("Error fetching user stats:", error)
        // Set default stats on error
        setStats({
          id: userId || "unknown",
          level: 1,
          xp: 0,
          coins: 0,
          total_messages: 0,
          challenges_completed: 0,
          articles_read: 0,
          courses_completed: 0,
          login_streak: 0,
        })
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [userId, supabase])

  if (loading) {
    return (
      <Card className={`${compact ? "w-full" : "w-full max-w-md"} ${className}`}>
        <CardContent className="p-4">
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-4 bg-muted rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!stats) {
    return (
      <Card className={`${compact ? "w-full" : "w-full max-w-md"} ${className}`}>
        <CardContent className="p-4">
          <p className="text-muted-foreground">No stats available</p>
        </CardContent>
      </Card>
    )
  }

  const level = stats.level || 1
  const xp = stats.xp || 0
  const xpToNextLevel = level * 100 - xp
  const xpProgress = xp % 100

  if (compact) {
    return (
      <div
        className={`flex items-center gap-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 rounded-lg ${className}`}
      >
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            <Zap className="h-3 w-3 mr-1" />
            Level {level}
          </Badge>
          <span className="text-sm font-medium">{xp} XP</span>
        </div>
        <div className="flex items-center gap-2">
          <Coins className="h-4 w-4 text-yellow-600" />
          <span className="text-sm font-medium">{stats.coins || 0}</span>
        </div>
        <div className="flex items-center gap-2">
          <Flame className="h-4 w-4 text-red-500" />
          <span className="text-sm font-medium">{stats.login_streak || 0}</span>
        </div>
      </div>
    )
  }

  return (
    <Card className={`w-full max-w-md ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            <span>Your Stats</span>
          </div>
          <Badge variant="outline">Level {level}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* XP Progress */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span>XP Progress</span>
            <span>{xpProgress}/100</span>
          </div>
          <Progress value={xpProgress} className="h-2" />
          <p className="text-xs text-muted-foreground mt-1">{xpToNextLevel} XP to next level</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center p-2 bg-yellow-50 dark:bg-yellow-950 rounded">
            <div className="text-lg font-bold text-yellow-600 flex items-center justify-center gap-1">
              <Coins className="h-4 w-4" />
              {stats.coins || 0}
            </div>
            <div className="text-xs text-muted-foreground">Coins</div>
          </div>
          <div className="text-center p-2 bg-red-50 dark:bg-red-950 rounded">
            <div className="text-lg font-bold text-red-600 flex items-center justify-center gap-1">
              <Flame className="h-4 w-4" />
              {stats.login_streak || 0}
            </div>
            <div className="text-xs text-muted-foreground">Day Streak</div>
          </div>
          <div className="text-center p-2 bg-blue-50 dark:bg-blue-950 rounded">
            <div className="text-lg font-bold text-blue-600 flex items-center justify-center gap-1">
              <MessageSquare className="h-4 w-4" />
              {stats.total_messages || 0}
            </div>
            <div className="text-xs text-muted-foreground">Messages</div>
          </div>
          <div className="text-center p-2 bg-green-50 dark:bg-green-950 rounded">
            <div className="text-lg font-bold text-green-600 flex items-center justify-center gap-1">
              <Target className="h-4 w-4" />
              {stats.challenges_completed || 0}
            </div>
            <div className="text-xs text-muted-foreground">Challenges</div>
          </div>
        </div>

        {/* Additional Stats */}
        <div className="text-sm space-y-1 pt-2 border-t">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground flex items-center gap-1">
              <BookOpen className="h-3 w-3" />
              Articles Read:
            </span>
            <span className="font-medium">{stats.articles_read || 0}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground flex items-center gap-1">
              <Trophy className="h-3 w-3" />
              Courses Completed:
            </span>
            <span className="font-medium">{stats.courses_completed || 0}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Also export as default for compatibility
export default UserStatsWidget
