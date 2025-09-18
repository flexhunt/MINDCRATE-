"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"

interface ArticleStats {
  likes: number
  saves: number
  shares: number
}

interface UserInteractions {
  liked: boolean
  saved: boolean
}

export function useArticleInteractions(articleId: string) {
  const [stats, setStats] = useState<ArticleStats>({ likes: 0, saves: 0, shares: 0 })
  const [userInteractions, setUserInteractions] = useState<UserInteractions>({ liked: false, saved: false })
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const supabase = createClient()

  // Load initial data
  useEffect(() => {
    loadInteractions()
  }, [articleId])

  const loadInteractions = async () => {
    try {
      const response = await fetch(`/api/articles/${articleId}/interact`)
      if (response.ok) {
        const data = await response.json()
        setStats(data.stats)
        setUserInteractions(data.userInteractions)
      }
    } catch (error) {
      console.error("Error loading interactions:", error)
    }
  }

  const toggleInteraction = async (type: "like" | "save" | "share") => {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      toast({
        title: "Login Required",
        description: "Please login to interact with articles",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`/api/articles/${articleId}/interact`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ type }),
      })

      if (response.ok) {
        const data = await response.json()
        setStats(data.stats)

        // Update user interactions based on the action
        if (type === "like") {
          setUserInteractions((prev) => ({ ...prev, liked: data.result.action === "added" }))
        } else if (type === "save") {
          setUserInteractions((prev) => ({ ...prev, saved: data.result.action === "added" }))
        }

        // Show success message
        const action = data.result.action === "added" ? "added" : "removed"
        const message =
          type === "like"
            ? `Article ${action === "added" ? "liked" : "unliked"}!`
            : type === "save"
              ? `Article ${action === "added" ? "saved" : "unsaved"}!`
              : "Article shared!"

        toast({
          title: "Success",
          description: message,
        })

        // Handle share action
        if (type === "share") {
          handleShare()
        }
      } else {
        throw new Error("Failed to update interaction")
      }
    } catch (error) {
      console.error("Error toggling interaction:", error)
      toast({
        title: "Error",
        description: "Failed to update interaction. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleShare = async () => {
    const url = window.location.href
    const title = document.title

    if (navigator.share) {
      try {
        await navigator.share({
          title,
          url,
        })
      } catch (error) {
        // User cancelled sharing or error occurred
        fallbackShare(url)
      }
    } else {
      fallbackShare(url)
    }
  }

  const fallbackShare = (url: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => {
        toast({
          title: "Link Copied!",
          description: "Article link has been copied to your clipboard",
        })
      })
    } else {
      // Fallback for older browsers
      const textArea = document.createElement("textarea")
      textArea.value = url
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand("copy")
      document.body.removeChild(textArea)

      toast({
        title: "Link Copied!",
        description: "Article link has been copied to your clipboard",
      })
    }
  }

  return {
    stats,
    userInteractions,
    loading,
    toggleLike: () => toggleInteraction("like"),
    toggleSave: () => toggleInteraction("save"),
    handleShare: () => toggleInteraction("share"),
  }
}
