"use client"

import type { Session } from "next-auth"
import type { Profile } from "@/lib/db/schema"
import ProfileForm from "@/components/profile/profile-form"
import ReferralCodeInput from "@/components/profile/referral-code-input"

interface Props {
  user: Session["user"]
  profile: Profile | null
}

const ProfileClient = ({ user, profile }: Props) => {
  return (
    <div className="space-y-8">
      <ProfileForm profile={profile} user={user} />

      {/* Add Referral Code Input */}
      <ReferralCodeInput
        hasUsedReferralCode={profile?.referral_code_used || false}
        usedReferralCode={profile?.used_referral_code}
      />

      {/* Other existing components */}
    </div>
  )
}

export default ProfileClient
