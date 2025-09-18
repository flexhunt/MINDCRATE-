import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import VerifiedBadge from "@/components/ui/verified-badge"
import Link from "next/link"
import { Edit, Calendar, LinkIcon } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import EnhancedCoinBalance from "@/components/coins/enhanced-coin-balance"

interface EnhancedProfileHeaderProps {
  profile: any
  user: any
}

export default function EnhancedProfileHeader({ profile, user }: EnhancedProfileHeaderProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
          <Avatar className="h-24 w-24">
            <AvatarImage src={profile?.avatar_url || ""} alt={profile?.name || "User"} />
            <AvatarFallback>{(profile?.name || user?.email || "U").charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>

          <div className="flex-1 space-y-2 text-center md:text-left">
            <div className="flex flex-col md:flex-row md:items-center gap-2">
              <div className="flex items-center justify-center md:justify-start">
                <h2 className="text-2xl font-bold">{profile?.name || user?.email}</h2>
                <VerifiedBadge verified={profile?.verified} size="lg" />
              </div>
              {profile?.username && <span className="text-muted-foreground">@{profile.username}</span>}
            </div>

            {profile?.bio && <p className="text-muted-foreground">{profile.bio}</p>}

            {profile?.website && (
              <p>
                <LinkIcon className="inline h-4 w-4 mr-1" />
                <a
                  href={profile.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  {profile.website.replace(/^https?:\/\//, "")}
                </a>
              </p>
            )}

            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground justify-center md:justify-start">
              {profile?.created_at && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>Joined {formatDistanceToNow(new Date(profile.created_at), { addSuffix: true })}</span>
                </div>
              )}
              {profile?.id && <EnhancedCoinBalance userId={profile.id} showRefresh={false} className="text-sm" />}
            </div>

            <div className="pt-2">
              <Button variant="outline" size="sm" asChild>
                <Link href="/profile">
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Profile
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
