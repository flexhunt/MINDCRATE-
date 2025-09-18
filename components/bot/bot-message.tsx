"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Bot, Crown } from "lucide-react"

interface BotMessageProps {
  content: string
  timestamp: string
}

export function BotMessage({ content, timestamp }: BotMessageProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  // Parse content for special formatting
  const formatContent = (text: string) => {
    return text.split("\n").map((line, index) => {
      // Handle headers
      if (line.startsWith("🤖 **") && line.includes("**")) {
        return (
          <div key={index} className="flex items-center gap-2 mb-3">
            <Bot className="h-5 w-5 text-primary" />
            <h3 className="font-bold text-lg text-primary">{line.replace(/🤖 \*\*(.*?)\*\*/, "$1")}</h3>
          </div>
        )
      }

      // Handle section headers
      if (line.match(/^[👤📊🏆💰🎯🔧].+\*\*$/u)) {
        const icon = line.charAt(0)
        const title = line.replace(/^. \*\*(.*?)\*\*$/, "$1")
        return (
          <div key={index} className="flex items-center gap-2 mt-4 mb-2">
            <span className="text-lg">{icon}</span>
            <h4 className="font-semibold text-foreground">{title}</h4>
          </div>
        )
      }

      // Handle bullet points with stats
      if (line.startsWith("• ")) {
        const content = line.substring(2)

        // Special formatting for stats
        if (content.includes("Level:") || content.includes("Balance:") || content.includes("XP")) {
          return (
            <div key={index} className="flex items-center gap-2 py-1">
              <div className="w-2 h-2 bg-primary rounded-full" />
              <span className="text-sm">{content}</span>
            </div>
          )
        }

        return (
          <div key={index} className="flex items-start gap-2 py-1">
            <div className="w-1 h-1 bg-muted-foreground rounded-full mt-2" />
            <span className="text-sm text-muted-foreground">{content}</span>
          </div>
        )
      }

      // Handle commands
      if (line.includes("`!") || line.includes("`@")) {
        return (
          <div key={index} className="py-1">
            <code className="bg-muted px-2 py-1 rounded text-sm font-mono">{line.replace(/`([^`]+)`/g, "$1")}</code>
          </div>
        )
      }

      // Handle regular text
      if (line.trim()) {
        return (
          <p key={index} className="text-sm text-muted-foreground py-1">
            {line}
          </p>
        )
      }

      return <div key={index} className="h-2" />
    })
  }

  return (
    <div
      className={`transition-all duration-500 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
    >
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <Bot className="h-4 w-4 text-primary-foreground" />
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary" className="text-xs">
                  <Crown className="h-3 w-3 mr-1" />
                  MindCrate Bot
                </Badge>
                <span className="text-xs text-muted-foreground">{new Date(timestamp).toLocaleTimeString()}</span>
              </div>

              <div className="space-y-1">{formatContent(content)}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
