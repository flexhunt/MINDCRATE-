import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import DownloadsClient from "./downloads-client"

export default async function DownloadsPage() {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)

  try {
    // Get the current session
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return redirect("/")
    }

    // Fetch profile data
    const { data: profile } = await supabase.from("profiles").select("*").eq("id", session.user.id).single()

    // Fetch user's purchased digital items
    const { data: downloads, error: downloadsError } = await supabase
      .from("purchased_items")
      .select(`
        id,
        download_url,
        purchased_at,
        items (
          id,
          name,
          description,
          image_url
        )
      `)
      .eq("user_id", session.user.id)
      .order("purchased_at", { ascending: false })

    if (downloadsError) {
      console.error("Error fetching downloads:", downloadsError)
    }

    // Pass data to client component
    return <DownloadsClient user={session.user} profile={profile} downloads={downloads || []} />
  } catch (error) {
    console.error("Downloads page error:", error)
    return redirect("/dashboard")
  }
}
