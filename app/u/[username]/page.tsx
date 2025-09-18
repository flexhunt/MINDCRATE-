import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import NewAppShell from "@/components/layout/new-app-shell"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Calendar, LinkIcon, MapPin, Users } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { getUserBadges, getUserSelectedBadge } from "@/lib/badges/badge-utils"

interface PageProps {
  params: {
    username: string
  }
}

export default async function UserProfilePage({ params }: PageProps) {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)

  // Get current session for the shell
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Get user profile by username
  const { data: profile, error } = await supabase.from("profiles").select("*").eq("username", params.username).single()

  if (error || !profile) {
    notFound()
  }

  // Get user badges safely
  let userBadges: any[] = []
  let selectedBadge: any = null

  try {
    userBadges = await getUserBadges(profile.id)
    selectedBadge = await getUserSelectedBadge(profile.id)
  } catch (error) {
    console.error("Error loading user badges:", error)
    // Continue without badges
  }

  return (
    <NewAppShell user={session?.user} profile={session?.user ? profile : null} currentPath={`/u/${params.username}`}>
      <div className="container max-w-4xl mx-auto px-4 py-8">
        {/* Profile Header */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              <Avatar className="h-32 w-32">
                <AvatarImage src={profile.avatar_url || ""} alt={profile.name || profile.username || "User"} />
                <AvatarFallback className="text-2xl">
                  {(profile.name || profile.username || "U").charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 text-center md:text-left">
                <div className="flex flex-col md:flex-row md:items-center gap-2 mb-2">
                  <h1 className="text-3xl font-bold">{profile.name || profile.username}</h1>
                  {profile.username && profile.name && (
                    <span className="text-muted-foreground">@{profile.username}</span>
                  )}
                  {selectedBadge && (
                    <Badge variant="secondary" className="w-fit">
                      {selectedBadge.name}
                    </Badge>
                  )}
                </div>

                {profile.bio && <p className="text-muted-foreground mb-4 max-w-2xl">{profile.bio}</p>}

                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  {profile.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      <span>{profile.location}</span>
                    </div>
                  )}

                  {profile.website && (
                    <div className="flex items-center gap-1">
                      <LinkIcon className="h-4 w-4" />
                      <a
                        href={profile.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {profile.website.replace(/^https?:\/\//, "")}
                      </a>
                    </div>
                  )}

                  {profile.created_at && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>Joined {formatDistanceToNow(new Date(profile.created_at), { addSuffix: true })}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Badges Section */}
        {userBadges.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Badges
              </CardTitle>
              <CardDescription>Achievements earned by {profile.name || profile.username}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {userBadges.map((userBadge) => (
                  <div
                    key={userBadge.badge_id}
                    className="flex flex-col items-center p-4 rounded-lg border bg-card text-center"
                  >
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                      {userBadge.badge.image_url ? (
                        <img
                          src={userBadge.badge.image_url || "/placeholder.svg"}
                          alt={userBadge.badge.name}
                          className="w-8 h-8"
                        />
                      ) : (
                        <span className="text-lg">🏆</span>
                      )}
                    </div>
                    <h3 className="font-medium text-sm">{userBadge.badge.name}</h3>
                    {userBadge.badge.description && (
                      <p className="text-xs text-muted-foreground mt-1">{userBadge.badge.description}</p>
                    )}
                    <Badge variant="outline" className="mt-2 text-xs capitalize">
                      {userBadge.badge.rarity}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* No badges message */}
        {userBadges.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="font-medium mb-2">No badges yet</h3>
              <p className="text-muted-foreground text-sm">
                {profile.name || profile.username} hasn't earned any badges yet.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </NewAppShell>
  )
}
