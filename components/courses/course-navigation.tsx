"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { ChevronDown, ChevronRight, BookOpen, CheckCircle, FileText } from "lucide-react"
import { cn } from "@/lib/utils"
import { getTopicWithParts } from "@/lib/courses/course-utils"
import type { Course, TopicWithParts } from "@/lib/courses/course-types"

interface CourseNavigationProps {
  course: Course
  currentTopicId?: string
  currentPartId?: string
  onSelectPart?: (partId: string) => void
  completedPageIds?: string[]
}

export function CourseNavigation({
  course,
  currentTopicId,
  currentPartId,
  onSelectPart,
  completedPageIds = [],
}: CourseNavigationProps) {
  const [expandedTopics, setExpandedTopics] = useState<Record<string, boolean>>({})
  const [expandedParts, setExpandedParts] = useState<Record<string, boolean>>({})
  const [topics, setTopics] = useState<TopicWithParts[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Load all topics with their parts and pages
  useEffect(() => {
    const loadTopics = async () => {
      try {
        if (!course || !course.topics || course.topics.length === 0) {
          setTopics([])
          setIsLoading(false)
          return
        }

        const topicsWithParts = await Promise.all(
          course.topics.map(async (topic) => {
            try {
              const topicWithParts = await getTopicWithParts(topic.id)
              return topicWithParts || { ...topic, parts: [] }
            } catch (error) {
              console.error(`Error loading topic ${topic.id} for navigation:`, error)
              return { ...topic, parts: [] }
            }
          }),
        )

        setTopics(topicsWithParts.filter(Boolean) as TopicWithParts[])

        // Expand the current topic
        if (currentTopicId) {
          setExpandedTopics((prev) => ({ ...prev, [currentTopicId]: true }))
        }

        // Expand the current part
        if (currentPartId) {
          setExpandedParts((prev) => ({ ...prev, [currentPartId]: true }))
        }
      } catch (error) {
        console.error("Error loading topics for navigation:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadTopics()
  }, [course, currentTopicId, currentPartId])

  const toggleTopic = (topicId: string) => {
    setExpandedTopics((prev) => ({
      ...prev,
      [topicId]: !prev[topicId],
    }))
  }

  const togglePart = (partId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setExpandedParts((prev) => ({
      ...prev,
      [partId]: !prev[partId],
    }))
  }

  const isPageCompleted = (pageId: string) => {
    return completedPageIds.includes(pageId)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {topics.length === 0 ? (
        <p className="text-muted-foreground">No content available yet.</p>
      ) : (
        topics.map((topic, topicIndex) => (
          <div key={topic.id} className="rounded-md overflow-hidden border border-muted bg-card">
            <button
              onClick={() => toggleTopic(topic.id)}
              className={cn(
                "flex items-center w-full text-left p-3 hover:bg-muted/50",
                currentTopicId === topic.id && "bg-muted/50",
              )}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-sm">
                  {topicIndex + 1}
                </div>
                <div className="truncate">
                  <span className="font-medium">{topic.title}</span>
                </div>
              </div>
              {expandedTopics[topic.id] ? (
                <ChevronDown className="h-4 w-4 ml-2 flex-shrink-0 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 ml-2 flex-shrink-0 text-muted-foreground" />
              )}
            </button>

            {expandedTopics[topic.id] && (
              <div className="p-2 pt-0 space-y-2">
                {!topic.parts || topic.parts.length === 0 ? (
                  <p className="text-sm text-muted-foreground p-2 pl-10">No parts available</p>
                ) : (
                  topic.parts.map((part, partIndex) => (
                    <div key={part.id} className="pl-10">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <button
                            onClick={() => onSelectPart?.(part.id)}
                            className={cn(
                              "flex items-center flex-grow text-left py-2 px-3 rounded-md text-sm",
                              currentPartId === part.id
                                ? "bg-primary/10 text-primary font-medium"
                                : "hover:bg-muted/50 text-foreground",
                            )}
                          >
                            <div className="flex items-center gap-2 truncate">
                              <BookOpen className="h-4 w-4 flex-shrink-0" />
                              <span className="truncate">{part.title}</span>
                            </div>
                          </button>

                          {part.pages && part.pages.length > 0 && (
                            <button
                              onClick={(e) => togglePart(part.id, e)}
                              className="p-2 hover:bg-muted/50 rounded-md"
                            >
                              {expandedParts[part.id] ? (
                                <ChevronDown className="h-3 w-3 text-muted-foreground" />
                              ) : (
                                <ChevronRight className="h-3 w-3 text-muted-foreground" />
                              )}
                            </button>
                          )}
                        </div>

                        {expandedParts[part.id] && part.pages && part.pages.length > 0 && (
                          <div className="pl-5 space-y-1 pt-1">
                            {part.pages.map((page, pageIndex) => (
                              <div
                                key={page.id}
                                className={cn(
                                  "flex items-center gap-2 py-1.5 px-3 text-sm rounded-md",
                                  isPageCompleted(page.id) ? "text-muted-foreground" : "text-foreground/80",
                                )}
                              >
                                {isPageCompleted(page.id) ? (
                                  <CheckCircle className="h-3 w-3 flex-shrink-0 text-green-500" />
                                ) : (
                                  <FileText className="h-3 w-3 flex-shrink-0" />
                                )}
                                <span className="truncate">{page.title}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  )
}
