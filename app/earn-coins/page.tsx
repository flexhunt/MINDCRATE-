import { createClient } from "@/lib/supabase/server"
import EarnCoinsClient from "./earn-coins-client"
import { redirect } from "next/navigation"

export default async function EarnCoinsPage() {
  const supabase = createClient()

  // Check if user is authenticated
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/login?redirect=/earn-coins")
  }

  return (
    <div className="container max-w-6xl py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4">Earn Coins</h1>
        <p className="text-xl text-muted-foreground">
          Support Mindcrate by watching ads and completing tasks to earn coins!
        </p>
      </div>
      <EarnCoinsClient />
    </div>
  )
}
