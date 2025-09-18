import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import SidebarLayout from "@/components/layout/sidebar-layout"
import ArticlesClient from "@/components/articles/articles-client"

export default async function ArticlesPage({
  searchParams,
}: {
  searchParams: { tag?: string; q?: string; view?: string }
}) {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)
  const selectedTag = searchParams.tag
  const searchQuery = searchParams.q
  const viewMode = searchParams.view || "grid"

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    const user = session?.user || null
    let profile = null
    let isAdmin = false

    if (user) {
      // Get user profile and admin status in parallel
      const [profileResult, adminResult] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).single(),
        supabase.rpc("is_admin", { input_user_id: user.id }),
      ])

      profile = profileResult.data
      isAdmin = !!adminResult.data
    }

    let query = supabase
      .from("articles")
      .select("*, views_count, likes_count, saves_count")
      .order("created_at", { ascending: false })

    if (!isAdmin) {
      query = query.eq("is_published", true)
    }

    if (selectedTag) {
      query = query.contains("tags", [selectedTag])
    }

    if (searchQuery) {
      query = query.or(`title.ilike.%${searchQuery}%, content.ilike.%${searchQuery}%`)
    }

    const { data: articles, error } = await query

    if (error) {
      console.error("Error fetching articles:", error)
      throw error
    }

    const uniqueTags = Array.from(
      new Set(articles?.flatMap((article) => (Array.isArray(article.tags) ? article.tags : [])) || []),
    ).sort()

    return (
      <SidebarLayout user={user} profile={profile} currentPath="/articles">
        <ArticlesClient
          articles={articles || []}
          uniqueTags={uniqueTags}
          selectedTag={selectedTag}
          searchQuery={searchQuery}
          viewMode={viewMode}
          isAdmin={isAdmin}
          user={user}
        />
      </SidebarLayout>
    )
  } catch (error) {
    console.error("Articles page error:", error)
    return (
      <div className="container mx-auto p-4 md:p-6">
        <h1 className="text-2xl md:text-3xl font-bold mb-4 md:mb-6">Articles</h1>
        <div className="bg-destructive/10 text-destructive p-4 rounded-md text-sm md:text-base">
          Error loading articles. Please try again.
        </div>
      </div>
    )
  }
}
