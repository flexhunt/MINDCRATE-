"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Award, FileText, User, Send, ShoppingBag, Clock } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

type Activity = {
  id: string
  user_id: string
  activity_type: string
  content: string
  created_at: string
  username?: string
  priority?: boolean
}

export function ActivityBanner() {
  const [currentActivity, setCurrentActivity] = useState<Activity | null>(null)
  const [visible, setVisible] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    // Load the most recent activity
    const loadRecentActivity = async () => {
      const { data, error } = await supabase
        .from("user_activities")
        .select("*, profiles(username)")
        .order("created_at", { ascending: false })
        .limit(1)
        .single()

      if (data && !error) {
        setCurrentActivity({
          ...data,
          username: data.profiles?.username || "Unknown user",
        })
        setVisible(true)
      }
    }

    loadRecentActivity()

    // Subscribe to new activities
    const channel = supabase
      .channel("activity-banner")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "user_activities" }, async (payload) => {
        const newActivity = payload.new as Activity
        const { data } = await supabase.from("profiles").select("username").eq("id", newActivity.user_id).single()

        setCurrentActivity({
          ...newActivity,
          username: data?.username || "Unknown user",
        })

        // Show the banner
        setVisible(true)

        // Hide after 5 seconds
        setTimeout(() => {
          setVisible(false)
        }, 5000)
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "level_completed":
        return <Award className="h-4 w-4" />
      case "article_published":
        return <FileText className="h-4 w-4" />
      case "user_joined":
        return <User className="h-4 w-4" />
      case "admin_message":
        return <Send className="h-4 w-4" />
      case "item_purchased":
        return <ShoppingBag className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const getActivityText = (activity: Activity) => {
    switch (activity.activity_type) {
      case "level_completed":
        return `${activity.username} completed level ${activity.content} in Mental Ascension`
      case "article_published":
        return `New article published: ${activity.content}`
      case "user_joined":
        return `${activity.username} joined the platform`
      case "admin_message":
        return activity.content
      case "item_purchased":
        return `${activity.username} purchased ${activity.content}`
      default:
        return activity.content
    }
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case "level_completed":
        return "bg-yellow-500 dark:bg-yellow-700"
      case "article_published":
        return "bg-blue-500 dark:bg-blue-700"
      case "user_joined":
        return "bg-green-500 dark:bg-green-700"
      case "admin_message":
        return "bg-purple-500 dark:bg-purple-700"
      case "item_purchased":
        return "bg-emerald-500 dark:bg-emerald-700"
      default:
        return "bg-gray-500 dark:bg-gray-700"
    }
  }

  if (!currentActivity || !visible) return null

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className={`w-full ${getActivityColor(currentActivity.activity_type)} text-white`}
        >
          <div className="container mx-auto px-4 py-1.5 flex items-center gap-2">
            {getActivityIcon(currentActivity.activity_type)}
            <p className="text-sm font-medium">{getActivityText(currentActivity)}</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
