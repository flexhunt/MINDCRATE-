"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Search, Filter } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useState } from "react"

interface ExploreContentProps {
  profiles: any[]
}

export default function ExploreContent({ profiles }: ExploreContentProps) {
  const [searchQuery, setSearchQuery] = useState("")

  const filteredProfiles = searchQuery
    ? profiles.filter(
        (profile) =>
          profile.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          profile.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          profile.bio?.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : profiles

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold gradient-heading">Explore</h1>
        <p className="mt-2 text-muted-foreground">Discover and connect with other users on the platform</p>
      </div>

      <div className="mb-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="outline" size="icon" className="h-10 w-10 shrink-0">
            <Filter className="h-4 w-4" />
            <span className="sr-only">Filter</span>
          </Button>
        </div>
      </div>

      <Tabs defaultValue="all" className="mb-6">
        <TabsList>
          <TabsTrigger value="all">All Users</TabsTrigger>
          <TabsTrigger value="recent">Recently Joined</TabsTrigger>
          <TabsTrigger value="popular">Popular</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="mt-4">
          {filteredProfiles.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {filteredProfiles.map((profile) => (
                <Link key={profile.id} href={`/u/${profile.username}`}>
                  <Card className="h-full overflow-hidden card-hover">
                    <CardContent className="p-4">
                      <div className="flex flex-col items-center text-center">
                        <div className="relative h-20 w-20 overflow-hidden rounded-full bg-muted mb-3">
                          {profile.avatar_url ? (
                            <img
                              src={profile.avatar_url || "/placeholder.svg"}
                              alt={profile.name || profile.username}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-primary/10 text-xl font-semibold text-primary">
                              {(profile.name || profile.username || "").charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <h3 className="font-semibold">{profile.name || profile.username}</h3>
                        <p className="text-sm text-muted-foreground mb-2">@{profile.username}</p>
                        {profile.bio && <p className="text-sm line-clamp-2">{profile.bio}</p>}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border p-8 text-center">
              <p className="text-muted-foreground">
                {searchQuery ? "No users found matching your search." : "No users found."}
              </p>
            </div>
          )}
        </TabsContent>
        <TabsContent value="recent" className="mt-4">
          <div className="rounded-lg border p-8 text-center">
            <p className="text-muted-foreground">Coming soon</p>
          </div>
        </TabsContent>
        <TabsContent value="popular" className="mt-4">
          <div className="rounded-lg border p-8 text-center">
            <p className="text-muted-foreground">Coming soon</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
