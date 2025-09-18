"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, GraduationCap, MessageCircle, User, BookOpen } from "lucide-react"
import { cn } from "@/lib/utils"

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
    name: "Learn",
    href: "/courses",
    icon: GraduationCap,
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
    href: "/profile",
    icon: User,
    activeColor: "text-orange-500",
    bgColor: "bg-orange-50 dark:bg-orange-950",
  },
]

export default function BottomNavigation() {
  const pathname = usePathname()

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      {/* Background with blur effect - removed blue color */}
      <div className="absolute inset-0 bg-background/90 backdrop-blur-lg border-t border-border"></div>

      {/* Navigation items */}
      <nav className="relative flex items-center justify-around px-2 py-2 safe-area-pb">
        {navigationItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-200 min-w-[60px]",
                "hover:scale-105 active:scale-95",
                isActive ? item.bgColor : "hover:bg-muted/50",
              )}
            >
              <div
                className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-lg transition-colors",
                  isActive ? item.activeColor : "text-muted-foreground",
                )}
              >
                <item.icon className="w-5 h-5" />
              </div>
              <span
                className={cn(
                  "text-xs font-medium mt-1 transition-colors",
                  isActive ? item.activeColor : "text-muted-foreground",
                )}
              >
                {item.name}
              </span>

              {/* Active indicator dot */}
              {isActive && (
                <div
                  className={cn("w-1 h-1 rounded-full mt-1 transition-all", item.activeColor.replace("text-", "bg-"))}
                />
              )}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
