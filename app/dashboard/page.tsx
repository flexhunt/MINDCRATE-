import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { DashboardClient } from "./dashboard-client"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function DashboardPage() {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      redirect("/login?redirect=/dashboard")
    }

    // Get user profile
    const { data: profile } = await supabase.from("profiles").select("*").eq("id", session.user.id).single()

    return <DashboardClient user={session.user} profile={profile} />
  } catch (error) {
    console.error("Dashboard error:", error)
    redirect("/login")
  }
}
