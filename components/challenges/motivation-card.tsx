"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Heart, Zap, Star, RefreshCw } from "lucide-react"
import { useState, useEffect } from "react"

interface MotivationCardProps {
  currentStreak: number
  longestStreak: number
  challengeTitle: string
  challengeType: string
  onWatchAd?: () => void
}

export function MotivationCard({
  currentStreak,
  longestStreak,
  challengeTitle,
  challengeType,
  onWatchAd,
}: MotivationCardProps) {
  const [motivationMessage, setMotivationMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const getStreakEmoji = (streak: number) => {
    if (streak >= 30) return "🔥🔥🔥"
    if (streak >= 21) return "🔥🔥"
    if (streak >= 7) return "🔥"
    if (streak >= 3) return "💪"
    return "🌱"
  }

  const getMotivationLevel = (streak: number) => {
    if (streak >= 30) return { level: "LEGENDARY", color: "from-purple-500 to-pink-500" }
    if (streak >= 21) return { level: "CHAMPION", color: "from-yellow-400 to-orange-500" }
    if (streak >= 14) return { level: "WARRIOR", color: "from-red-400 to-red-600" }
    if (streak >= 7) return { level: "FIGHTER", color: "from-blue-400 to-blue-600" }
    if (streak >= 3) return { level: "STARTER", color: "from-green-400 to-green-600" }
    return { level: "BEGINNER", color: "from-gray-400 to-gray-600" }
  }

  const getRandomMotivation = () => {
    const motivations = [
      "You're stronger than your excuses! 💪",
      "Every day you resist, you grow stronger! 🌱",
      "Your future self will thank you! 🙏",
      "Discipline is choosing between what you want now and what you want most! 🎯",
      "You've got this! One day at a time! 🔥",
      "Your willpower is your superpower! ⚡",
      "Progress, not perfection! 📈",
      "You're building mental muscle! 🧠💪",
      "Stay strong, warrior! 🛡️",
      "Your streak is proof of your strength! 🏆",
    ]

    const streakMotivations = {
      0: ["Fresh start! You can do this! 🌟", "Every expert was once a beginner! 🌱"],
      3: ["3 days strong! You're building momentum! 🚀", "The habit is forming! Keep going! 💪"],
      7: ["One week! You're officially on fire! 🔥", "7 days of pure willpower! Legendary! 👑"],
      14: ["Two weeks! You're unstoppable! ⚡", "14 days of discipline! You're a warrior! ⚔️"],
      21: ["21 days! Habit officially formed! 🎉", "Three weeks! You're in the elite club! 👑"],
      30: ["30 DAYS! You're absolutely LEGENDARY! 🔥🔥🔥", "One month! You've mastered yourself! 🏆"],
    }

    if (streakMotivations[currentStreak as keyof typeof streakMotivations]) {
      const messages = streakMotivations[currentStreak as keyof typeof streakMotivations]
      return messages[Math.floor(Math.random() * messages.length)]
    }

    return motivations[Math.floor(Math.random() * motivations.length)]
  }

  const fetchAIMotivation = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/challenges/ai-motivation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentStreak,
          longestStreak,
          challengeType,
          challengeTitle,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setMotivationMessage(data.message)
      } else {
        setMotivationMessage(getRandomMotivation())
      }
    } catch (error) {
      setMotivationMessage(getRandomMotivation())
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    setMotivationMessage(getRandomMotivation())
  }, [currentStreak])

  const motivation = getMotivationLevel(currentStreak)

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-red-500" />
            Daily Motivation
          </div>
          <Badge className={`bg-gradient-to-r ${motivation.color} text-white`}>{motivation.level}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Streak Display */}
        <div className="text-center p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-3xl font-bold text-purple-600">{currentStreak}</span>
            <span className="text-lg text-gray-600">days</span>
            <span className="text-2xl">{getStreakEmoji(currentStreak)}</span>
          </div>
          <p className="text-sm text-gray-600">Personal best: {longestStreak} days</p>
        </div>

        {/* Motivation Message */}
        <div className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border-l-4 border-yellow-400">
          <div className="flex items-start gap-2">
            <Star className="h-5 w-5 text-yellow-500 mt-0.5 flex-shrink-0" />
            <p className="text-gray-700 font-medium">{motivationMessage || "Loading motivation..."}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button onClick={fetchAIMotivation} disabled={isLoading} variant="outline" className="flex-1">
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            {isLoading ? "Getting..." : "AI Motivation"}
          </Button>

          {onWatchAd && (
            <Button
              onClick={onWatchAd}
              className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
            >
              <Zap className="h-4 w-4 mr-2" />
              +5 XP (Ad)
            </Button>
          )}
        </div>

        {/* Progress Milestones */}
        <div className="space-y-2">
          <p className="text-sm font-semibold text-gray-700">Next Milestones:</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {currentStreak < 3 && (
              <div className="p-2 bg-gray-50 rounded text-center">
                <div className="font-bold">3 Days</div>
                <div className="text-gray-600">+5 XP Bonus</div>
              </div>
            )}
            {currentStreak < 7 && (
              <div className="p-2 bg-blue-50 rounded text-center">
                <div className="font-bold">7 Days</div>
                <div className="text-gray-600">+20 XP Bonus</div>
              </div>
            )}
            {currentStreak < 21 && (
              <div className="p-2 bg-purple-50 rounded text-center">
                <div className="font-bold">21 Days</div>
                <div className="text-gray-600">+50 XP Bonus</div>
              </div>
            )}
            {currentStreak < 30 && (
              <div className="p-2 bg-yellow-50 rounded text-center">
                <div className="font-bold">30 Days</div>
                <div className="text-gray-600">+100 XP Bonus</div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
