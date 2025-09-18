"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Clock, Users, Brain, Heart, Lightbulb, BookOpen, Target, Star } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Topic {
  id: string
  title: string
  description: string
  category: string
  icon: string
  color: string
  difficulty_level: number
  estimated_time: number
  is_active: boolean
}

interface TopicSelectionProps {
  onTopicSelect?: (topicId: string) => void
}

const iconMap = {
  User: Users,
  Brain: Brain,
  Lightbulb: Lightbulb,
  Heart: Heart,
  BookOpen: BookOpen,
  Target: Target,
}

const categoryColors = {
  personality: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  mental_health: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  cognition: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  emotional: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  learning: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  decision: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
}

export function TopicSelection({ onTopicSelect }: TopicSelectionProps) {
  const [topics, setTopics] = useState<Topic[]>([])
  const [filteredTopics, setFilteredTopics] = useState<Topic[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    loadTopics()
  }, [])

  useEffect(() => {
    filterTopics()
  }, [topics, selectedCategory])

  const loadTopics = async () => {
    try {
      const response = await fetch("/api/questionnaire/topics")
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to load topics")
      }

      setTopics(data.topics)
    } catch (error: any) {
      console.error("Error loading topics:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to load questionnaire topics",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const filterTopics = () => {
    if (selectedCategory === "all") {
      setFilteredTopics(topics)
    } else {
      setFilteredTopics(topics.filter((topic) => topic.category === selectedCategory))
    }
  }

  const getDifficultyStars = (level: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star key={i} className={`h-4 w-4 ${i < level ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} />
    ))
  }

  const formatEstimatedTime = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} min`
    }
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`
  }

  const getCategoryDisplayName = (category: string) => {
    const categoryNames = {
      personality: "Personality",
      mental_health: "Mental Health",
      cognition: "Cognition",
      emotional: "Emotional Intelligence",
      learning: "Learning",
      decision: "Decision Making",
    }
    return categoryNames[category as keyof typeof categoryNames] || category
  }

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-muted rounded w-3/4"></div>
              <div className="h-4 bg-muted rounded w-full"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-4 bg-muted rounded w-full"></div>
                <div className="h-4 bg-muted rounded w-2/3"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header and Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Psychology Questionnaires</h2>
          <p className="text-muted-foreground">
            Select a topic to explore your psychological patterns and gain insights
          </p>
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="personality">Personality</SelectItem>
            <SelectItem value="mental_health">Mental Health</SelectItem>
            <SelectItem value="cognition">Cognition</SelectItem>
            <SelectItem value="emotional">Emotional Intelligence</SelectItem>
            <SelectItem value="learning">Learning</SelectItem>
            <SelectItem value="decision">Decision Making</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Topics Grid */}
      {filteredTopics.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredTopics.map((topic) => {
            const IconComponent = iconMap[topic.icon as keyof typeof iconMap] || Brain
            const categoryColorClass =
              categoryColors[topic.category as keyof typeof categoryColors] || categoryColors.personality

            return (
              <Card
                key={topic.id}
                className="hover:shadow-lg transition-all duration-200 cursor-pointer group"
                onClick={() => onTopicSelect?.(topic.id)}
              >
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="p-2 rounded-lg"
                        style={{ backgroundColor: topic.color + "20", color: topic.color }}
                      >
                        <IconComponent className="h-6 w-6" />
                      </div>
                      <div>
                        <CardTitle className="text-lg group-hover:text-primary transition-colors">
                          {topic.title}
                        </CardTitle>
                      </div>
                    </div>
                    <Badge className={categoryColorClass}>{getCategoryDisplayName(topic.category)}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <CardDescription className="text-sm leading-relaxed">{topic.description}</CardDescription>

                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{formatEstimatedTime(topic.estimated_time)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-xs">Difficulty:</span>
                      <div className="flex">{getDifficultyStars(topic.difficulty_level)}</div>
                    </div>
                  </div>

                  <Button className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    Start Assessment
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6 text-center">
            <Brain className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No topics found</h3>
            <p className="text-muted-foreground">
              {selectedCategory === "all"
                ? "No questionnaire topics are currently available."
                : `No topics found in the ${getCategoryDisplayName(selectedCategory)} category.`}
            </p>
            {selectedCategory !== "all" && (
              <Button variant="outline" onClick={() => setSelectedCategory("all")} className="mt-4">
                View All Topics
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Category Overview */}
      {selectedCategory === "all" && topics.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Available Categories</CardTitle>
            <CardDescription>Explore different areas of psychological assessment</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Object.entries(
                topics.reduce(
                  (acc, topic) => {
                    acc[topic.category] = (acc[topic.category] || 0) + 1
                    return acc
                  },
                  {} as Record<string, number>,
                ),
              ).map(([category, count]) => (
                <div
                  key={category}
                  className="flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => setSelectedCategory(category)}
                >
                  <span className="font-medium">{getCategoryDisplayName(category)}</span>
                  <Badge variant="secondary">{count} topics</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
