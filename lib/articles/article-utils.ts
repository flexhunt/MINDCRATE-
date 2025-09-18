import { createClient } from "@/lib/supabase/client"
import type { Article, ArticleFormData, ArticleWithAuthor } from "./article-types"

/**
 * Generates a slug from a title
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, "-")
}

/**
 * Fetches all published articles
 */
export async function getPublishedArticles(): Promise<Article[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("articles")
    .select("*")
    .eq("is_published", true)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching articles:", error)
    throw error
  }

  return data || []
}

/**
 * Fetches all articles (including unpublished) - admin only
 */
export async function getAllArticles(): Promise<Article[]> {
  const supabase = createClient()

  const { data, error } = await supabase.from("articles").select("*").order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching articles:", error)
    throw error
  }

  return data || []
}

/**
 * Fetches a single article by slug
 */
export async function getArticleBySlug(slug: string): Promise<ArticleWithAuthor | null> {
  const supabase = createClient()

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
}

/**
 * Creates a new article
 */
export async function createArticle(articleData: ArticleFormData): Promise<Article> {
  const supabase = createClient()

  // Generate slug if not provided
  if (!articleData.slug) {
    articleData.slug = generateSlug(articleData.title)
  }

  const { data, error } = await supabase.from("articles").insert(articleData).select().single()

  if (error) {
    console.error("Error creating article:", error)
    throw error
  }

  return data
}

/**
 * Updates an existing article
 */
export async function updateArticle(id: string, articleData: Partial<ArticleFormData>): Promise<Article> {
  const supabase = createClient()

  const { data, error } = await supabase.from("articles").update(articleData).eq("id", id).select().single()

  if (error) {
    console.error("Error updating article:", error)
    throw error
  }

  return data
}

/**
 * Deletes an article
 */
export async function deleteArticle(id: string): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase.from("articles").delete().eq("id", id)

  if (error) {
    console.error("Error deleting article:", error)
    throw error
  }
}

/**
 * Client-side function to check if the current user is an admin
 */
export async function isUserAdmin(): Promise<boolean> {
  try {
    const supabase = createClient()

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
 * Server-side function to check if the current user is an admin
 */
export async function isUserAdminServer(userId: string): Promise<boolean> {
  try {
    // Create a client-side Supabase client for server-side admin check
    // This avoids using next/headers in a client component
    const supabase = createClient()

    // Check if user is in admin_users table
    const { data, error } = await supabase.from("admin_users").select("user_id").eq("user_id", userId)

    if (error) {
      console.error("Server-side admin check error:", error)
      return false
    }

    return data && data.length > 0
  } catch (error) {
    console.error("Server-side admin check exception:", error)
    return false
  }
}
