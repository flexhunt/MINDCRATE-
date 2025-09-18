import { createClient } from "@/lib/supabase/client"

export async function GetSession() {
  try {
    const supabase = createClient()
    const { data, error } = await supabase.auth.getSession()

    if (error) {
      console.error("Error getting session:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Error in GetSession:", error)
    return null
  }
}
