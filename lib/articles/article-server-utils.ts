import { cookies } from "next/headers"
import { createServerComponentClient } from "@/lib/supabase/server"
import type { ArticleWithAuthor } from "./article-types"

/**
 * Server-side function to check if the current user is an admin
 * This should ONLY be used in Server Components
 */
export async function isUserAdminServer(): Promise<boolean> {
  try {
    const cookieStore = cookies()
    const supabase = createServerComponentClient(cookieStore)

    // Get the current session
    const { data: sessionData } = await supabase.auth.getSession()

    if (!sessionData.session) {
      return false
    }

    // Check if user is in admin_users table
    const { data, error } = await supabase
      .from("admin_users")
      .select("user_id")
      .eq("user_id", sessionData.session.user.id)
      .single()

    if (error && error.code !== "PGRST116") {
      console.error("Error checking admin status:", error)
      return false
    }

    return !!data
  } catch (error) {
    console.error("Error checking admin status:", error)
    return false
  }
}

/**
 * Server-side function to check if a specific user is an admin
 * This should ONLY be used in Server Components
 */
export async function isSpecificUserAdminServer(userId: string): Promise<boolean> {
  try {
    const cookieStore = cookies()
    const supabase = createServerComponentClient(cookieStore)

    // Check if user is in admin_users table
    const { data, error } = await supabase.from("admin_users").select("user_id").eq("user_id", userId).single()

    if (error && error.code !== "PGRST116") {
      console.error("Error checking admin status:", error)
      return false
    }

    return !!data
  } catch (error) {
    console.error("Error checking admin status:", error)
    return false
  }
}

/**
 * Server-side function to fetch a single article by slug
 * This should ONLY be used in Server Components
 */
export async function getArticleBySlugServer(slug: string): Promise<ArticleWithAuthor | null> {
  try {
    const cookieStore = cookies()
    const supabase = createServerComponentClient(cookieStore)

    // First, fetch the article
    const { data: article, error } = await supabase.from("articles").select("*").eq("slug", slug).single()

    if (error) {
      if (error.code === "PGRST116") {
        // No rows returned
        return null
      }
      console.error("Error fetching article:", error)
      throw error
    }

    if (!article) return null

    // Initialize author as null
    let author = null

    // Only fetch author if user_id is not null
    if (article.user_id) {
      try {
        const { data: authorData, error: authorError } = await supabase
          .from("profiles")
          .select("name, username, avatar_url")
          .eq("id", article.user_id)
          .single()

        if (!authorError) {
          author = authorData
        }
      } catch (error) {
        console.error("Error fetching author:", error)
        // Continue without author info
      }
    }

    // Combine article with author
    const articleWithAuthor: ArticleWithAuthor = {
      ...article,
      author: author,
    }

    return articleWithAuthor
  } catch (error) {
    console.error("Error in getArticleBySlugServer:", error)
    return null
  }
}
