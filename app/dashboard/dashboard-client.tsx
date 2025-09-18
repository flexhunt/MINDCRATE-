"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  BookOpen,
  MessageSquare,
  Trophy,
  Coins,
  Star,
  Crown,
  Sparkles,
  TrendingUp,
  Award,
  Brain,
  Play,
  Clock,
  File as Fire,
  RefreshCw,
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { DailyRewardCard } from "@/components/dashboard/daily-reward-card"
import { toast } from "@/hooks/use-toast"
import NewAppShell from "@/components/layout/new-app-shell"
import { PushNotificationSetup } from "@/components/notifications/push-notification-setup"

interface DashboardClientProps {
  user: any
  profile: any
}

export function DashboardClient({ user, profile }: DashboardClientProps) {
  const [mounted, setMounted] = useState(false)
  const [stats, setStats] = useState({
    coins: 0,
    courses_completed: 0,
    articles_read: 0,
    chat_messages: 0,
    quiz_total_score: 0,
    current_streak: 0,
    can_claim_daily_reward: false,
  })
  const [leaderboard, setLeaderboard] = useState<any[]>([])
  const [recentActivity, setRecentActivity] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const loadDashboardData = async () => {
    if (!user?.id) return

    try {
      console.log("📊 Loading fresh dashboard data for user:", user.id)
      setRefreshing(true)

      const response = await fetch(`/api/dashboard/stats`, {
        method: "GET",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
        cache: "no-store",
      })

      if (!response.ok) throw new Error("Failed to fetch stats")

      const data = await response.json()
      console.log("✅ Fresh dashboard data received:", data)

      if (data.stats) {
        setStats(data.stats)
        setLeaderboard(data.leaderboard || [])
        setRecentActivity(data.activities || [])
      } else {
        console.error("❌ Unexpected data structure:", data)
        toast({
          title: "Error",
          description: "Received invalid data format",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("❌ Error loading dashboard data:", error)
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    if (user?.id) {
      setLoading(true)
      loadDashboardData()
    }
  }, [user?.id])

  const handleRefresh = async () => {
    await loadDashboardData()
  }

  const handleRewardClaimed = (rewardResult: any) => {
    setStats((prev) => ({
      ...prev,
      coins: rewardResult.new_balance || prev.coins + 5,
      current_streak: rewardResult.streak || prev.current_streak + 1,
      can_claim_daily_reward: false,
    }))
  }

  const quickActions = [
    {
      title: "Take Quiz",
      description: "Test your knowledge",
      icon: Brain,
      href: "/quiz",
      color: "from-purple-500 to-purple-600",
      badge: "Daily",
    },
    {
      title: "Join Chat",
      description: "Community discussion",
      icon: MessageSquare,
      href: "/chat",
      color: "from-blue-500 to-blue-600",
      badge: "Live",
    },
    {
      title: "Browse Courses",
      description: "Continue learning",
      icon: BookOpen,
      href: "/courses",
      color: "from-green-500 to-green-600",
      badge: "New",
    },
    {
      title: "Earn Coins",
      description: "Complete tasks",
      icon: Coins,
      href: "/earn-coins",
      color: "from-yellow-500 to-yellow-600",
      badge: "Bonus",
    },
  ]

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-32 bg-gray-200 dark:bg-gray-800 rounded-2xl"></div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 dark:bg-gray-800 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <NewAppShell user={user} profile={profile} currentPath="/dashboard">
      <div className="space-y-6">
        <PushNotificationSetup />

        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
          <div className="container mx-auto px-4 py-6 space-y-6">
            {/* Welcome Header */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-6 text-white">
              <div className="absolute inset-0 bg-black/10" />
              <div className="relative z-10">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h1 className="text-2xl md:text-3xl font-bold">
                      Welcome back, {profile?.username || user?.email?.split("@")[0] || "User"}! 👋
                    </h1>
                    <p className="text-indigo-100 opacity-90">Ready to continue your learning journey?</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button
                      onClick={handleRefresh}
                      disabled={refreshing}
                      variant="secondary"
                      size="sm"
                      className="bg-white/20 hover:bg-white/30 text-white border-white/20"
                    >
                      <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
                    </Button>
                    <div className="hidden md:block">
                      <Avatar className="h-16 w-16 ring-4 ring-white/20">
                        <AvatarImage src={profile?.avatar_url || "/placeholder.svg"} alt={profile?.username} />
                        <AvatarFallback className="bg-white/20 text-white text-xl font-bold">
                          {(profile?.username || user?.email || "U").charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950/20 dark:to-yellow-900/20 border-yellow-200/50 dark:border-yellow-800/30 min-w-0">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center justify-between min-w-0">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm font-medium text-yellow-700 dark:text-yellow-300 truncate">
                        Coins
                      </p>
                      <p className="text-xl sm:text-2xl font-bold text-yellow-800 dark:text-yellow-200 truncate">
                        {stats.coins}
                      </p>
                    </div>
                    <div className="p-2 bg-yellow-500 rounded-lg flex-shrink-0">
                      <Coins className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20 border-green-200/50 dark:border-green-800/30 min-w-0">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center justify-between min-w-0">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm font-medium text-green-700 dark:text-green-300 truncate">
                        Courses
                      </p>
                      <p className="text-xl sm:text-2xl font-bold text-green-800 dark:text-green-200 truncate">
                        {stats.courses_completed}
                      </p>
                    </div>
                    <div className="p-2 bg-green-500 rounded-lg flex-shrink-0">
                      <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/20 border-purple-200/50 dark:border-purple-800/30 min-w-0">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center justify-between min-w-0">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm font-medium text-purple-700 dark:text-purple-300 truncate">
                        Quiz Score
                      </p>
                      <p className="text-xl sm:text-2xl font-bold text-purple-800 dark:text-purple-200 truncate">
                        {stats.quiz_total_score}
                      </p>
                    </div>
                    <div className="p-2 bg-purple-500 rounded-lg flex-shrink-0">
                      <Trophy className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/20 dark:to-orange-900/20 border-orange-200/50 dark:border-orange-800/30 min-w-0">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center justify-between min-w-0">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm font-medium text-orange-700 dark:text-orange-300 truncate">
                        Streak
                      </p>
                      <p className="text-xl sm:text-2xl font-bold text-orange-800 dark:text-orange-200 truncate">
                        {stats.current_streak}
                      </p>
                    </div>
                    <div className="p-2 bg-orange-500 rounded-lg flex-shrink-0">
                      <Fire className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Daily Reward and Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
              <div className="lg:col-span-1">
                <DailyRewardCard
                  canClaim={stats.can_claim_daily_reward}
                  currentStreak={stats.current_streak}
                  onRewardClaimed={handleRewardClaimed}
                />
              </div>

              <Card className="lg:col-span-2 border-0 shadow-lg bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm min-w-0">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Sparkles className="h-5 w-5 text-primary flex-shrink-0" />
                    <span className="truncate">Quick Actions</span>
                  </CardTitle>
                  <CardDescription className="text-sm">Jump into your favorite activities</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    {quickActions.map((action) => (
                      <Link key={action.title} href={action.href} className="min-w-0">
                        <Card className="group hover:shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer border-2 hover:border-primary/20 bg-white dark:bg-gray-800 min-w-0">
                          <CardContent className="p-3 sm:p-4">
                            <div className="flex items-start justify-between mb-2 sm:mb-3 min-w-0">
                              <div
                                className={`p-2 rounded-lg bg-gradient-to-r ${action.color} text-white flex-shrink-0`}
                              >
                                <action.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                              </div>
                              <Badge variant="secondary" className="text-xs flex-shrink-0 ml-2">
                                {action.badge}
                              </Badge>
                            </div>
                            <div className="min-w-0">
                              <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors text-sm sm:text-base truncate">
                                {action.title}
                              </h3>
                              <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                                {action.description}
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 lg:gap-6">
              {/* Quiz Leaderboard */}
              <Card className="xl:col-span-2 border-0 shadow-lg bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm min-w-0">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between min-w-0">
                    <div className="min-w-0 flex-1">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Trophy className="h-5 w-5 text-yellow-500 flex-shrink-0" />
                        <span className="truncate">Quiz Leaderboard</span>
                      </CardTitle>
                      <CardDescription className="text-sm">Top performers this week</CardDescription>
                    </div>
                    <Button asChild variant="outline" size="sm" className="flex-shrink-0 ml-2 bg-transparent">
                      <Link href="/quiz">
                        <Play className="h-4 w-4 mr-1 sm:mr-2" />
                        <span className="hidden sm:inline">Take Quiz</span>
                        <span className="sm:hidden">Quiz</span>
                      </Link>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {leaderboard.length > 0 ? (
                    <div className="space-y-2 sm:space-y-3">
                      {leaderboard.map((entry, index) => (
                        <div
                          key={entry.id}
                          className={cn(
                            "flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg transition-colors min-w-0",
                            index === 0 &&
                              "bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-950/20 dark:to-yellow-900/20",
                            index === 1 &&
                              "bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-700/50",
                            index === 2 &&
                              "bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-950/20 dark:to-orange-900/20",
                            index > 2 && "hover:bg-muted/50",
                          )}
                        >
                          <div className="flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0">
                            {index === 0 && <Crown className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500" />}
                            {index === 1 && <Award className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500" />}
                            {index === 2 && <Award className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500" />}
                            {index > 2 && (
                              <span className="text-xs sm:text-sm font-medium text-muted-foreground">#{index + 1}</span>
                            )}
                          </div>
                          <Avatar className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0">
                            <AvatarImage src={entry.avatar_url || "/placeholder.svg"} alt={entry.username} />
                            <AvatarFallback className="text-xs sm:text-sm">
                              {(entry.name || entry.username || "U").charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm sm:text-base truncate">{entry.name || entry.username}</p>
                            <p className="text-xs sm:text-sm text-muted-foreground truncate">@{entry.username}</p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="font-bold text-sm sm:text-lg">{entry.score}</p>
                            <p className="text-xs text-muted-foreground">points</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 sm:py-8">
                      <Trophy className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-3" />
                      <h3 className="font-medium mb-1 text-sm sm:text-base">No quiz scores yet</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground mb-4">Be the first to complete a quiz!</p>
                      <Button asChild size="sm">
                        <Link href="/quiz">Start Quiz</Link>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm min-w-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    Recent Activity
                  </CardTitle>
                  <CardDescription>Your latest actions</CardDescription>
                </CardHeader>
                <CardContent>
                  {recentActivity.length > 0 ? (
                    <div className="space-y-3">
                      {recentActivity.map((activity, index) => (
                        <div
                          key={index}
                          className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div className="p-2 bg-primary/10 rounded-lg">
                            <Star className="h-4 w-4 text-primary" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">{activity.activity_type}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(activity.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                      <h3 className="font-medium mb-1">No recent activity</h3>
                      <p className="text-sm text-muted-foreground">Start exploring to see your activity here!</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Progress Section */}
            <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm min-w-0">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <TrendingUp className="h-5 w-5 text-primary flex-shrink-0" />
                  <span className="truncate">Your Progress</span>
                </CardTitle>
                <CardDescription className="text-sm">Track your learning journey</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                  <div className="text-center min-w-0">
                    <div className="relative w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-3">
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full opacity-20"></div>
                      <div className="absolute inset-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                        <MessageSquare className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                      </div>
                    </div>
                    <h3 className="font-semibold text-sm sm:text-base truncate">Chat Messages</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground">{stats.chat_messages} sent</p>
                  </div>

                  <div className="text-center min-w-0">
                    <div className="relative w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-3">
                      <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full opacity-20"></div>
                      <div className="absolute inset-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                        <BookOpen className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                      </div>
                    </div>
                    <h3 className="font-semibold text-sm sm:text-base truncate">Courses</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground">{stats.courses_completed} completed</p>
                  </div>

                  <div className="text-center min-w-0">
                    <div className="relative w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-3">
                      <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-red-500 rounded-full opacity-20"></div>
                      <div className="absolute inset-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center">
                        <Fire className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                      </div>
                    </div>
                    <h3 className="font-semibold text-sm sm:text-base truncate">Streak</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground">{stats.current_streak} days active</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </NewAppShell>
  )
}

export default DashboardClient
