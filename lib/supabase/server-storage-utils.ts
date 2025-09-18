import { createClient } from "@/lib/supabase/server"

/**
 * Server-side function to get a public URL for a file in the avatars bucket
 */
export async function getAvatarPublicUrl(filePath: string): Promise<string | null> {
  const supabase = createClient()

  try {
    const { data } = supabase.storage.from("avatars").getPublicUrl(filePath)
    return data.publicUrl
  } catch (error) {
    console.error("Error getting public URL:", error)
    return null
  }
}

/**
 * Server-side function to check if a file exists in the avatars bucket
 */
export async function checkAvatarExists(filePath: string): Promise<boolean> {
  const supabase = createClient()

  try {
    // List files with the given path as prefix
    const { data, error } = await supabase.storage.from("avatars").list(filePath.split("/").slice(0, -1).join("/"), {
      limit: 1,
      offset: 0,
      search: filePath.split("/").pop() || "",
    })

    if (error) {
      console.error("Error checking if avatar exists:", error)
      return false
    }

    return data && data.length > 0
  } catch (error) {
    console.error("Error checking if avatar exists:", error)
    return false
  }
}
