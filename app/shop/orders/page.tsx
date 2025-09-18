import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import OrdersClient from "./orders-client"

export default async function OrdersPage() {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)

  try {
    // Get the current session
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return <div>Redirecting to login...</div>
    }

    // Fetch profile data
    const { data: profile } = await supabase.from("profiles").select("*").eq("id", session.user.id).single()

    // Get user's orders with item details
    const { data: orders } = await supabase
      .from("orders")
      .select(`
        id,
        price_paid,
        status,
        ordered_at,
        items (
          id,
          name,
          description,
          image_url
        )
      `)
      .eq("user_id", session.user.id)
      .order("ordered_at", { ascending: false })

    // Pass data to client component
    return <OrdersClient user={session.user} profile={profile} orders={orders || []} />
  } catch (error) {
    console.error("Orders page error:", error)
    return <div>Error loading orders. Please try again.</div>
  }
}
