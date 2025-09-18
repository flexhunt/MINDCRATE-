import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import ShopClient from "./shop-client"

export default async function ShopPage() {
  const supabase = createClient()

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Get user profile and check if admin
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  const { data: adminCheck } = await supabase.from("admin_users").select("user_id").eq("user_id", user.id).single()

  const isAdmin = !!adminCheck

  // Get shop items from the correct table: items
  const { data: items } = await supabase
    .from("items")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false })

  // Get user's coin balance
  const { data: coinData } = await supabase.from("user_coins").select("balance").eq("user_id", user.id).single()

  return (
    <ShopClient
      user={user}
      profile={profile}
      items={items || []}
      isAdmin={isAdmin}
      coinBalance={coinData?.balance || 0}
    />
  )
}
