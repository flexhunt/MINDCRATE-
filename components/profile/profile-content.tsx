import type React from "react"
import VerifiedBadge from "@/components/ui/verified-badge"

interface ProfileContentProps {
  profile: {
    name?: string
    verified?: boolean
  } | null
}

const ProfileContent: React.FC<ProfileContentProps> = ({ profile }) => {
  return (
    <div>
      <div className="flex items-center gap-2">
        <h1 className="text-3xl font-bold">{profile?.name || "Anonymous User"}</h1>
        <VerifiedBadge verified={profile?.verified} size="lg" />
      </div>
    </div>
  )
}

export default ProfileContent
