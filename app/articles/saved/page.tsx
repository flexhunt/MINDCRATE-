import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft, BookOpen } from "lucide-react"
import ArticleCard from "@/components/articles/article-card"
import SidebarLayout from "@/components/layout/sidebar-layout"

export default async function SavedArticlesPage() {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/login?redirect=/articles/saved")
  }

  // Get user profile
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", session.user.id).single()

  // Get saved articles
  const { data: savedArticles, error } = await supabase.rpc("get_user_saved_articles", {
    user_uuid: session.user.id,
  })

  if (error) {
    console.error("Error fetching saved articles:", error)
  }

  const content = (
    <>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/articles">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Articles
            </Link>
          </Button>
        </div>

        <div className="text-center space-y-4">
          <div className="inline-block p-3 bg-primary/10 rounded-full">
            <BookOpen className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold">Saved Articles</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">Your personal collection of articles to read later</p>
        </div>
      </div>

      {/* Articles Grid */}
      {savedArticles && savedArticles.length > 0 ? (
        <>
          <div className="mb-6">
            <p className="text-sm text-muted-foreground">
              {savedArticles.length} saved article{savedArticles.length !== 1 ? "s" : ""}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedArticles.map((article) => (
              <ArticleCard key={article.id} article={article} showSavedDate={true} savedAt={article.saved_at} />
            ))}
          </div>
        </>
      ) : (
        <div className="text-center py-20 bg-muted/20 rounded-xl border border-border/50">
          <div className="max-w-md mx-auto">
            <div className="bg-primary/10 rounded-full p-3 w-12 h-12 flex items-center justify-center mx-auto mb-4">
              <BookOpen className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-xl font-semibold mb-2">No saved articles yet</h2>
            <p className="text-muted-foreground mb-6">
              Start saving articles you want to read later by clicking the bookmark icon
            </p>
            <Button asChild className="hover-lift">
              <Link href="/articles">Browse Articles</Link>
            </Button>
          </div>
        </div>
      )}
    </>
  )

  return (
    <SidebarLayout user={session.user} profile={profile} currentPath="/articles/saved">
      <div className="container mx-auto p-6">{content}</div>
    </SidebarLayout>
  )
}
