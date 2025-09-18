"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface ProfilePreviewProps {
  name: string
  username: string
  bio?: string
  website?: string
  avatarUrl?: string
}

export default function ProfilePreview({ name, username, bio, website, avatarUrl }: ProfilePreviewProps) {
  // Check if bio and website are available in the schema
  const hasBio = bio !== undefined && bio !== null
  const hasWebsite = website !== undefined && website !== null

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Preview</CardTitle>
        <CardDescription>This is how your profile will appear to other users</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={avatarUrl || ""} alt={name || username} />
            <AvatarFallback>{(name || username || "").charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg">{username}</h3>
            {name && <p className="text-sm">{name}</p>}
          </div>
        </div>

        {hasBio && <p className="mt-4 text-sm">{bio}</p>}

        {hasWebsite && (
          <p className="mt-2 text-sm">
            <a href={website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              {website.replace(/^https?:\/\//, "")}
            </a>
          </p>
        )}
      </CardContent>
    </Card>
  )
}
