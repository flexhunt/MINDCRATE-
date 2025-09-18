"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  User,
  Users,
  TrendingUp,
  Bell,
  Calendar,
  BookOpen,
  GraduationCap,
  ShoppingBag,
  MessageSquare,
  FileText,
  Activity,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CalendarClock } from "lucide-react"

import BottomNavigation from "@/components/mobile/bottom-navigation"
import CategoryGrid from "@/components/mobile/category-grid"
import MobileHeader from "@/components/mobile/mobile-header"
import { useViewMode } from "@/hooks/use-view-mode"

interface DashboardContentProps {
  profile: any
  recentUsers: any[]
}

export default function DashboardContent({ profile, recentUsers }: DashboardContentProps) {
  const viewMode = useViewMode()
  const daysSinceRegistration = 1

  // If navigation mode is selected, show navigation view for all devices
  if (viewMode === "navigation") {
    return (
      <>
        {/* Mobile Header - now visible on all devices in navigation mode */}
        <MobileHeader profile={profile} />

        {/* Category Grid - now visible on all devices in navigation mode */}
        <CategoryGrid />

        {/* Bottom Navigation - now visible on all devices in navigation mode */}
        <BottomNavigation />

        {/* Add bottom padding to account for bottom navigation */}
        <div className="h-20" />
      </>
    )
  }

  // Dashboard mode - original dashboard layout
  return (
    <>
      {/* Mobile Header - only visible on mobile */}
      <MobileHeader profile={profile} />

      {/* Mobile Category Grid - only visible on mobile */}
      <div className="md:hidden">
        <CategoryGrid />
      </div>

      {/* Desktop Dashboard - hidden on mobile */}
      <div className="hidden md:block container mx-auto p-4 md:p-6 lg:p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold gradient-heading">Welcome back, {profile?.name || "User"}</h1>
          <p className="mt-2 text-muted-foreground">Here's an overview of your activity and available features.</p>
        </div>

        {/* Stats cards - Fixed visibility issues */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/20 dark:to-amber-900/20 border-amber-200/50 dark:border-amber-800/30">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-amber-800 dark:text-amber-200">Total Posts</CardTitle>
              <TrendingUp className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-900 dark:text-amber-100">0</div>
              <p className="text-xs text-amber-700 dark:text-amber-300">+0% from last month</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/20 dark:to-emerald-900/20 border-emerald-200/50 dark:border-emerald-800/30">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-emerald-800 dark:text-emerald-200">Followers</CardTitle>
              <Users className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">0</div>
              <p className="text-xs text-emerald-700 dark:text-emerald-300">+0% from last month</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20 border-green-200/50 dark:border-green-800/30">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-green-800 dark:text-green-200">Messages</CardTitle>
              <Bell className="h-4 w-4 text-green-600 dark:text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-900 dark:text-green-100">0</div>
              <p className="text-xs text-green-700 dark:text-green-300">+0 new today</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/20 border-purple-200/50 dark:border-purple-800/30">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-purple-800 dark:text-purple-200">Days Active</CardTitle>
              <Calendar className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">{daysSinceRegistration}</div>
              <p className="text-xs text-purple-700 dark:text-purple-300">Since you joined</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Profile card */}
          <Card className="md:col-span-2 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900/20 dark:to-gray-800/20 border-gray-200/50 dark:border-gray-700/30">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-gray-100">Your Profile</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Update your profile information and manage your account settings.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6">
              <div className="flex items-center gap-4">
                <div className="relative h-20 w-20 overflow-hidden rounded-full bg-muted">
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url || "/placeholder.svg"}
                      alt={profile.name || "User"}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-primary/10 text-2xl font-semibold text-primary">
                      {(profile?.name || "U").charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="space-y-1">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">{profile?.name || "Your Name"}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">@{profile?.username || "username"}</p>
                  {profile?.bio && <p className="text-sm text-gray-700 dark:text-gray-300">{profile.bio}</p>}
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Badge
                      variant="outline"
                      className="bg-emerald-100 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800/50 text-emerald-800 dark:text-emerald-200"
                    >
                      <Calendar className="mr-1 h-3 w-3" /> {daysSinceRegistration} days
                    </Badge>
                    <Badge
                      variant="outline"
                      className="bg-green-100 dark:bg-green-900/30 border-green-200 dark:border-green-800/50 text-green-800 dark:text-green-200"
                    >
                      <Users className="mr-1 h-3 w-3" /> Community Member
                    </Badge>
                  </div>
                  {profile && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <CalendarClock className="h-4 w-4" />
                      <span>
                        Member since{" "}
                        {new Date(profile.created_at).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                        {" ("}
                        {(() => {
                          const createdAt = new Date(profile.created_at)
                          const now = new Date()
                          const diffTime = Math.abs(now.getTime() - createdAt.getTime())
                          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

                          if (diffDays < 30) {
                            return `${diffDays} day${diffDays === 1 ? "" : "s"}`
                          } else if (diffDays < 365) {
                            const months = Math.floor(diffDays / 30)
                            return `${months} month${months === 1 ? "" : "s"}`
                          } else {
                            const years = Math.floor(diffDays / 365)
                            const remainingMonths = Math.floor((diffDays % 365) / 30)
                            return `${years} year${years === 1 ? "" : "s"}${remainingMonths > 0 ? ` and ${remainingMonths} month${remainingMonths === 1 ? "" : "s"}` : ""}`
                          }
                        })()}
                        {")"}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button asChild>
                <Link href="/profile">
                  <User className="mr-2 h-4 w-4" />
                  Edit Profile
                </Link>
              </Button>
            </CardFooter>
          </Card>

          {/* Recent users card */}
          <Card className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900/20 dark:to-gray-800/20 border-gray-200/50 dark:border-gray-700/30">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-gray-100">Recent Users</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Discover new people on the platform.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentUsers && recentUsers.length > 0 ? (
                  recentUsers.map((user) => (
                    <Link
                      key={user.id}
                      href={`/u/${user.username}`}
                      className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-muted/50"
                    >
                      <div className="relative h-10 w-10 overflow-hidden rounded-full bg-muted">
                        {user.avatar_url ? (
                          <img
                            src={user.avatar_url || "/placeholder.svg"}
                            alt={user.name || user.username}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-primary/10 text-sm font-semibold text-primary">
                            {(user.name || user.username || "U").charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {user.name || user.username}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">@{user.username}</p>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Users className="mb-2 h-10 w-10 text-muted-foreground" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">No users found</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Be the first to invite others!</p>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button asChild variant="outline" className="w-full">
                <Link href="/explore">
                  <Users className="mr-2 h-4 w-4" />
                  Explore All Users
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Quick Access Tabs */}
        <div className="mt-6">
          <Tabs defaultValue="features" className="mt-6">
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="features">Features</TabsTrigger>
              <TabsTrigger value="getting-started">Getting Started</TabsTrigger>
              <TabsTrigger value="community">Community</TabsTrigger>
            </TabsList>

            <TabsContent value="features" className="mt-0">
              <div className="grid gap-4 md:grid-cols-3">
                <Link href="/courses" className="block">
                  <Card className="h-full hover:bg-muted/50 transition-colors">
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <GraduationCap className="mr-2 h-5 w-5 text-purple-500" />
                        Courses
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">Browse and learn from our educational courses.</p>
                    </CardContent>
                  </Card>
                </Link>

                <Link href="/shop" className="block">
                  <Card className="h-full hover:bg-muted/50 transition-colors">
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <ShoppingBag className="mr-2 h-5 w-5 text-green-500" />
                        Shop
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">Purchase digital items with your earned coins.</p>
                    </CardContent>
                  </Card>
                </Link>

                <Link href="/articles" className="block">
                  <Card className="h-full hover:bg-muted/50 transition-colors">
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <FileText className="mr-2 h-5 w-5 text-indigo-500" />
                        Articles
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">Read the latest articles and updates.</p>
                    </CardContent>
                  </Card>
                </Link>

                <Link href="/chat" className="block">
                  <Card className="h-full hover:bg-muted/50 transition-colors">
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <MessageSquare className="mr-2 h-5 w-5 text-pink-500" />
                        Chat
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">Connect with the community in our chat rooms.</p>
                    </CardContent>
                  </Card>
                </Link>

                <Link href="/ai-chat" className="block">
                  <Card className="h-full hover:bg-muted/50 transition-colors">
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Activity className="mr-2 h-5 w-5 text-orange-500" />
                        AI Chat
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">Chat with our AI assistant for help and guidance.</p>
                    </CardContent>
                  </Card>
                </Link>

                <Link href="/downloads" className="block">
                  <Card className="h-full hover:bg-muted/50 transition-colors">
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <TrendingUp className="mr-2 h-5 w-5 text-cyan-500" />
                        Downloads
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">Access your purchased digital downloads.</p>
                    </CardContent>
                  </Card>
                </Link>
              </div>
            </TabsContent>

            <TabsContent value="getting-started" className="mt-0">
              <Card className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900/20 dark:to-gray-800/20">
                <CardHeader>
                  <CardTitle className="text-gray-900 dark:text-gray-100">Getting Started Guide</CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-400">
                    Complete these steps to set up your profile.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="rounded-lg border bg-card p-4">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                          1
                        </div>
                        <h3 className="font-semibold">Complete your profile</h3>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Add a profile picture, bio, and other details.
                      </p>
                    </div>
                    <div className="rounded-lg border bg-card p-4">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                          2
                        </div>
                        <h3 className="font-semibold">Explore courses</h3>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Browse our educational courses and start learning.
                      </p>
                    </div>
                    <div className="rounded-lg border bg-card p-4">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                          3
                        </div>
                        <h3 className="font-semibold">Join the community</h3>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Connect with others in our chat rooms and forums.
                      </p>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button asChild variant="outline">
                    <Link href="/profile">
                      <BookOpen className="mr-2 h-4 w-4" />
                      View Full Guide
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="community" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Community Features</CardTitle>
                  <CardDescription>Connect with others and participate in community activities</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-lg border bg-card p-4">
                      <h3 className="font-semibold flex items-center">
                        <MessageSquare className="mr-2 h-4 w-4 text-pink-500" />
                        Chat Rooms
                      </h3>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Join our chat rooms to discuss various topics with other members.
                      </p>
                      <Button asChild variant="link" className="px-0 mt-2">
                        <Link href="/chat">Join Chat</Link>
                      </Button>
                    </div>
                    <div className="rounded-lg border bg-card p-4">
                      <h3 className="font-semibold flex items-center">
                        <Users className="mr-2 h-4 w-4 text-emerald-500" />
                        User Directory
                      </h3>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Browse the user directory to find and connect with other members.
                      </p>
                      <Button asChild variant="link" className="px-0 mt-2">
                        <Link href="/explore">Explore Users</Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Bottom Navigation - only visible on mobile */}
      <BottomNavigation />

      {/* Add bottom padding on mobile to account for bottom navigation */}
      <div className="h-20 md:hidden" />
    </>
  )
}
