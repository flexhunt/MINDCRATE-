"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clock, Target, Star, Flame, Crown, Zap } from "lucide-react"
import type { ChallengeTemplate } from "@/lib/challenges/challenge-types"

interface TemplateCardProps {
  template: ChallengeTemplate
  onUse: () => void
}

export function TemplateCard({ template, onUse }: TemplateCardProps) {
  const getCategoryColor = (category: string) => {
    switch (category) {
      case "self_improvement":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300"
      case "digital_detox":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300"
      case "productivity":
        return "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300"
      case "fitness":
        return "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300"
      case "health":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-300"
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "self_improvement":
        return <Crown className="w-4 h-4" />
      case "digital_detox":
        return <Zap className="w-4 h-4" />
      case "productivity":
        return <Target className="w-4 h-4" />
      case "fitness":
        return <Flame className="w-4 h-4" />
      case "health":
        return <Star className="w-4 h-4" />
      default:
        return <Target className="w-4 h-4" />
    }
  }

  return (
    <Card className="hover:shadow-lg transition-all duration-200 hover:scale-105 bg-card/50 backdrop-blur-sm border-l-4 border-l-gradient-to-b border-l-purple-500 dark:border-l-purple-400">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <CardTitle className="text-lg font-semibold text-foreground">{template.name}</CardTitle>
              {template.is_popular && (
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-500 fill-current" />
                  <span className="text-xs text-yellow-600 dark:text-yellow-400 font-medium">Popular</span>
                </div>
              )}
            </div>
            <CardDescription className="line-clamp-2 text-muted-foreground">{template.description}</CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Category and Duration */}
        <div className="flex justify-between items-center">
          <Badge className={`${getCategoryColor(template.category)} border-0 flex items-center gap-1`}>
            {getCategoryIcon(template.category)}
            {template.category.replace("_", " ")}
          </Badge>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>{template.duration_days} days</span>
          </div>
        </div>

        {/* Rules Preview */}
        {template.rules && (
          <div className="text-sm text-muted-foreground line-clamp-3 bg-muted/50 dark:bg-muted/20 rounded-md p-2">
            {template.rules}
          </div>
        )}

        {/* Challenge Type */}
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-purple-500 dark:text-purple-400" />
          <span className="text-sm capitalize text-muted-foreground">{template.type.replace("_", " ")} Challenge</span>
        </div>

        {/* Use Button */}
        <Button
          onClick={onUse}
          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white border-0"
        >
          <Star className="w-4 h-4 mr-2" />
          Use This Template
        </Button>
      </CardContent>
    </Card>
  )
}
