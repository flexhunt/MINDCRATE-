import type React from "react"
import type { User } from "next-auth"
import type { Session } from "next-auth"
import Image from "next/image"
import VerifiedBadge from "@/components/ui/verified-badge"

interface ProfileHeaderProps {
  user: User | Session["user"] | null | undefined
  profile:
    | ({
        id: string
        userId: string
        name: string | null
        bio: string | null
        location: string | null
        website: string | null
        profileImageUrl: string | null
        createdAt: Date
        updatedAt: Date
        verified: boolean | null
      } & {})
    | null
    | undefined
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({ user, profile }) => {
  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div className="relative w-32 h-32 rounded-full overflow-hidden mb-4">
        <Image
          src={profile?.profileImageUrl || user?.image || "/default-profile.png"}
          alt="Profile Picture"
          layout="fill"
          objectFit="cover"
        />
      </div>
      <div className="flex items-center gap-2">
        <h2 className="text-2xl font-bold">{profile?.name || user?.email}</h2>
        <VerifiedBadge verified={profile?.verified} size="lg" />
      </div>
      <p className="text-gray-500">{profile?.bio || "No bio available."}</p>
      {profile?.location && <p>Location: {profile.location}</p>}
      {profile?.website && (
        <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-blue-500">
          Website
        </a>
      )}
    </div>
  )
}

export default ProfileHeader
