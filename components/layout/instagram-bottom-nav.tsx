"use client"

import { useUser } from "@supabase/auth-helpers-react"
import { useEffect, useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Home, MessageCircle, User, BookOpen, FileText, Brain } from "lucide-react"
import { usePathname } from "next/navigation"
import Link from "next/link"

const InstagramBottomNav = () => {
  const supabase = createClientComponentClient()
  const user = useUser()
  const [username, setUsername] = useState<string>("")

  useEffect(() => {
    const getUsername = async () => {
      if (user) {
        const { data: profile } = await supabase.from("profiles").select("username").eq("id", user.id).single()

        if (profile?.username) {
          setUsername(profile.username)
        }
      }
    }
    getUsername()
  }, [user, supabase])

  const navigationItems = [
    {
      name: "Home",
      href: "/dashboard",
      icon: Home,
      activeColor: "text-emerald-500",
      bgColor: "bg-emerald-50 dark:bg-emerald-950",
    },
    {
      name: "Articles",
      href: "/articles",
      icon: BookOpen,
      activeColor: "text-blue-500",
      bgColor: "bg-blue-50 dark:bg-blue-950",
    },
    {
      name: "Papers",
      href: "/research-papers",
      icon: FileText,
      activeColor: "text-indigo-500",
      bgColor: "bg-indigo-50 dark:bg-indigo-950",
    },
    {
      name: "Quiz",
      href: "/questionnaire",
      icon: Brain,
      activeColor: "text-purple-500",
      bgColor: "bg-purple-50 dark:bg-purple-950",
    },
    {
      name: "Chat",
      href: "/chat",
      icon: MessageCircle,
      activeColor: "text-pink-500",
      bgColor: "bg-pink-50 dark:bg-pink-950",
    },
    {
      name: "Profile",
      href: username ? `/u/${username}` : "/profile",
      icon: User,
      activeColor: "text-orange-500",
      bgColor: "bg-orange-50 dark:bg-orange-950",
    },
  ]

  const pathname = usePathname()

  return (
    <div className="mobile-bottom-nav fixed bottom-0 left-0 z-50 w-full border-t border-border bg-background/95 backdrop-blur-sm safe-area-inset-bottom">
      <div className="flex items-center justify-between px-2 py-1">
        {navigationItems.map((item) => {
          const isActive = pathname === item.href

          return (
            <Link href={item.href} key={item.name} className="flex-1">
              <div
                className={`nav-item flex flex-col items-center gap-0.5 rounded-lg p-1.5 transition-colors ${isActive ? item.bgColor : "hover:bg-muted/50"}`}
              >
                <item.icon className={`nav-icon h-5 w-5 ${isActive ? item.activeColor : "text-muted-foreground"}`} />
                <span
                  className={`nav-text text-xs leading-tight ${isActive ? "text-foreground font-medium" : "text-muted-foreground"}`}
                >
                  {item.name}
                </span>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

export default InstagramBottomNav
