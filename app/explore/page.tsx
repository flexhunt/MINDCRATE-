// This is a Server Component
import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import ExploreClient from "./explore-client"

export default async function ExplorePage() {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return <div>Redirecting to login...</div>
    }

    // Fetch profile data
    const { data: profile } = await supabase.from("profiles").select("*").eq("id", session.user.id).single()

    // Get users for explore page
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, username, name, avatar_url, bio")
      .order("created_at", { ascending: false })
      .limit(20)

    // Pass data to client component
    return <ExploreClient user={session.user} profile={profile} profiles={profiles || []} />
  } catch (error) {
    console.error("Explore page error:", error)
    return <div>Error loading explore page. Please try again.</div>
  }
}
