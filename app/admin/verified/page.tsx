import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import VerifiedUsersClient from "./verified-users-client"

export default async function VerifiedUsersPage() {
  const supabase = createClient()

  // Check authentication
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) {
    redirect("/login")
  }

  // Check admin status
  const { data: adminCheck } = await supabase
    .from("admin_users")
    .select("user_id")
    .eq("user_id", session.user.id)
    .single()

  if (!adminCheck) {
    redirect("/")
  }

  // Get verified users
  const { data: verifiedUsers } = await supabase
    .from("verified_users")
    .select("*")
    .order("verified_at", { ascending: false })

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Verified Users</h1>
        <p className="text-muted-foreground">
          Manage verified badges from Supabase admin panel using verify_user() and unverify_user() functions.
        </p>
      </div>

      <VerifiedUsersClient initialUsers={verifiedUsers || []} />
    </div>
  )
}
