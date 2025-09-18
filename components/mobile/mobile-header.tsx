"use client"

import { Bell, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

interface MobileHeaderProps {
  profile: any
}

export default function MobileHeader({ profile }: MobileHeaderProps) {
  return (
    <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border md:hidden">
      <div className="flex items-center justify-between p-4">
        {/* Left side - Profile */}
        <div className="flex items-center gap-3">
          <Avatar className="w-10 h-10 ring-2 ring-primary/20">
            <AvatarImage src={profile?.avatar_url || ""} alt={profile?.name || "User"} />
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
              {(profile?.name || "U").charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="font-semibold text-sm">Welcome back!</h2>
            <p className="text-xs text-muted-foreground">{profile?.name || "User"}</p>
          </div>
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="relative">
            <Search className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="w-5 h-5" />
            <Badge className="absolute -top-1 -right-1 w-2 h-2 p-0 bg-red-500 border-2 border-background" />
          </Button>
        </div>
      </div>
    </div>
  )
}
