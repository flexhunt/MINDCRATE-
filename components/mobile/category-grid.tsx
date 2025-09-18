"use client"

import Link from "next/link"
import { GraduationCap, ShoppingBag, MessageCircle, FileText, Coins, Brain, Target, Download } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const categories = [
  {
    title: "Courses",
    description: "Learn new skills",
    href: "/courses",
    icon: GraduationCap,
    color: "from-blue-500 to-blue-600",
    bgColor: "bg-blue-50 dark:bg-blue-950/50",
    textColor: "text-blue-600 dark:text-blue-400",
    badge: "Popular",
  },
  {
    title: "Quiz",
    description: "Test your knowledge",
    href: "/quiz",
    icon: Brain,
    color: "from-purple-500 to-purple-600",
    bgColor: "bg-purple-50 dark:bg-purple-950/50",
    textColor: "text-purple-600 dark:text-purple-400",
    badge: "Fun",
  },
  {
    title: "Shop",
    description: "Buy with coins",
    href: "/shop",
    icon: ShoppingBag,
    color: "from-green-500 to-green-600",
    bgColor: "bg-green-50 dark:bg-green-950/50",
    textColor: "text-green-600 dark:text-green-400",
    badge: "New",
  },
  {
    title: "Chat",
    description: "Connect with others",
    href: "/chat",
    icon: MessageCircle,
    color: "from-pink-500 to-pink-600",
    bgColor: "bg-pink-50 dark:bg-pink-950/50",
    textColor: "text-pink-600 dark:text-pink-400",
    badge: "Live",
  },
  {
    title: "Articles",
    description: "Read latest posts",
    href: "/articles",
    icon: FileText,
    color: "from-indigo-500 to-indigo-600",
    bgColor: "bg-indigo-50 dark:bg-indigo-950/50",
    textColor: "text-indigo-600 dark:text-indigo-400",
  },
  {
    title: "Challenges",
    description: "Join daily challenges",
    href: "/challenges",
    icon: Target,
    color: "from-red-500 to-red-600",
    bgColor: "bg-red-50 dark:bg-red-950/50",
    textColor: "text-red-600 dark:text-red-400",
    badge: "Hot",
  },
  {
    title: "Earn Coins",
    description: "Complete tasks",
    href: "/earn-coins",
    icon: Coins,
    color: "from-yellow-500 to-yellow-600",
    bgColor: "bg-yellow-50 dark:bg-yellow-950/50",
    textColor: "text-yellow-600 dark:text-yellow-400",
    badge: "Reward",
  },
  {
    title: "Downloads",
    description: "Your purchases",
    href: "/downloads",
    icon: Download,
    color: "from-cyan-500 to-cyan-600",
    bgColor: "bg-cyan-50 dark:bg-cyan-950/50",
    textColor: "text-cyan-600 dark:text-cyan-400",
  },
]

export default function CategoryGrid() {
  return (
    <div className="grid grid-cols-2 gap-4 p-4">
      {categories.map((category, index) => (
        <Link key={category.title} href={category.href}>
          <Card
            className={`
            relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 
            hover:scale-105 active:scale-95 ${category.bgColor}
            h-32 flex flex-col justify-between p-4
          `}
          >
            {/* Badge */}
            {category.badge && (
              <Badge
                variant="secondary"
                className="absolute top-2 right-2 text-xs px-2 py-0.5 bg-white/80 dark:bg-black/80"
              >
                {category.badge}
              </Badge>
            )}

            {/* Icon */}
            <div
              className={`
              w-12 h-12 rounded-xl flex items-center justify-center
              bg-gradient-to-br ${category.color} shadow-lg
            `}
            >
              <category.icon className="w-6 h-6 text-white" />
            </div>

            {/* Content */}
            <div className="space-y-1">
              <h3 className={`font-semibold text-sm ${category.textColor}`}>{category.title}</h3>
              <p className="text-xs text-muted-foreground">{category.description}</p>
            </div>

            {/* Gradient overlay */}
            <div
              className={`
              absolute inset-0 bg-gradient-to-br ${category.color} opacity-0 
              hover:opacity-5 transition-opacity duration-300 pointer-events-none
            `}
            />
          </Card>
        </Link>
      ))}
    </div>
  )
}
