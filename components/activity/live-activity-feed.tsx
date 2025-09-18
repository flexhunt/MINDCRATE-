"use client"

import { useState, useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Send, Award, FileText, User, Clock, ShoppingBag } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { useToast } from "@/components/ui/toast/use-toast"

type Activity = {
  id: string
  user_id: string
  activity_type: string
  content: string
  created_at: string
  username?: string
  priority?: boolean
}

export function LiveActivityFeed({ isAdmin = false }: { isAdmin?: boolean }) {
  const [activities, setActivities] = useState<Activity[]>([])
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const supabase = createClient()
  const feedRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()
  const [isAdminUser, setIsAdminUser] = useState(false)

  const checkIfAdmin = async () => {
    const { data: adminData } = await supabase
      .from("admin_users")
      .select("id")
      .eq("id", (await supabase.auth.getUser()).data.user?.id)
      .single()
    setIsAdminUser(!!adminData)
  }

  const loadActivities = async () => {
    const { data, error } = await supabase
      .from("user_activities")
      .select("*, profiles(username)")
      .order("created_at", { ascending: false })
      .limit(50)

    if (error) {
      console.error("Error loading activities:", error)
    } else if (data) {
      // Format the data to include username
      const formattedData = data.map((item) => ({
        ...item,
        username: item.profiles?.username || "Unknown user",
      }))
      setActivities(formattedData)

      // Scroll to bottom of feed
      setTimeout(() => {
        if (feedRef.current) {
          feedRef.current.scrollTop = feedRef.current.scrollHeight
        }
      }, 100)
    }
  }

  useEffect(() => {
    loadActivities()
    if (isAdmin) {
      checkIfAdmin()
    }

    // Subscribe to activity changes
    const channel = supabase
      .channel("public-activities")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "user_activities" }, (payload) => {
        // Fetch the username for the new activity
        const fetchUsername = async () => {
          const newActivity = payload.new as Activity
          const { data } = await supabase.from("profiles").select("username").eq("id", newActivity.user_id).single()

          const activityWithUsername = {
            ...newActivity,
            username: data?.username || "Unknown user",
          }

          setActivities((prev) => [activityWithUsername, ...prev].slice(0, 50))

          // Play sound for new activities
          const audio = new Audio("/sounds/notification.mp3")
          audio.volume = 0.5
          audio.play().catch((e) => console.log("Audio play prevented:", e))
        }

        fetchUsername()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const sendAdminMessage = async () => {
    if (!message.trim() || !isAdminUser) return

    setLoading(true)

    // Get current user (admin)
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setLoading(false)
      return
    }

    // Insert admin message as activity
    const { error } = await supabase.from("user_activities").insert({
      user_id: user.id,
      activity_type: "admin_message",
      content: message,
      priority: true,
    })

    if (error) {
      console.error("Error sending admin message:", error)
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      })
    } else {
      setMessage("")
      toast({
        title: "Message sent",
        description: "Your message has been broadcast to all users",
      })
    }

    setLoading(false)
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "level_completed":
        return <Award className="h-4 w-4 text-yellow-500" />
      case "article_published":
        return <FileText className="h-4 w-4 text-blue-500" />
      case "user_joined":
        return <User className="h-4 w-4 text-green-500" />
      case "admin_message":
        return <Send className="h-4 w-4 text-purple-500" />
      case "item_purchased":
        return <ShoppingBag className="h-4 w-4 text-emerald-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
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

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center justify-between">
          <span>Live Activity</span>
          <Badge variant="outline" className="text-xs font-normal">
            {activities.length} activities
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col pt-0">
        <div ref={feedRef} className="flex-1 overflow-y-auto mb-4 space-y-2 max-h-[400px]">
          {activities.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">No activities yet</p>
          ) : (
            activities.map((activity) => (
              <div
                key={activity.id}
                className={`p-2 rounded-lg border flex items-start gap-2 ${
                  activity.priority ? "bg-muted/50 border-primary/20" : ""
                }`}
              >
                <div className="mt-0.5">{getActivityIcon(activity.activity_type)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {activity.activity_type === "admin_message" && (
                      <Badge variant="outline" className="text-xs">
                        Admin
                      </Badge>
                    )}
                    <p className="text-sm">{getActivityText(activity)}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {isAdmin && isAdminUser && (
          <div className="flex gap-2">
            <Input
              placeholder="Send admin message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendAdminMessage()}
            />
            <Button onClick={sendAdminMessage} disabled={loading || !message.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
