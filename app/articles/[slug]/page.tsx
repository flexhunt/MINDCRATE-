import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Edit, LogIn, UserPlus, Home } from "lucide-react"
import ArticleContent from "@/components/articles/article-content"
import type { Metadata } from "next"
import { Suspense } from "react"

interface Props {
  params: { slug: string }
}

// Loading component for better UX
function ArticleLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 max-w-4xl py-8">
        <div className="animate-pulse space-y-8">
          {/* Header skeleton */}
          <div className="space-y-4">
            <div className="h-8 bg-muted rounded-lg w-3/4" />
            <div className="h-4 bg-muted rounded w-1/2" />
            <div className="flex gap-2">
              <div className="h-6 bg-muted rounded-full w-16" />
              <div className="h-6 bg-muted rounded-full w-20" />
            </div>
          </div>

          {/* Content skeleton */}
          <div className="space-y-4">
            <div className="h-4 bg-muted rounded w-full" />
            <div className="h-4 bg-muted rounded w-5/6" />
            <div className="h-4 bg-muted rounded w-4/5" />
            <div className="h-32 bg-muted rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  )
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = params
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)

  const { data: article } = await supabase.from("articles").select("*").eq("slug", slug).single()

  if (!article) {
    return {
      title: "Article Not Found | MindCrate",
    }
  }

  const description = article.content.substring(0, 160).replace(/[#*`]/g, "") + "..."
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://mindcrate.vercel.app"

  // Generate OG image URL
  const ogImageUrl = `${baseUrl}/api/og?title=${encodeURIComponent(article.title)}`

  return {
    title: `${article.title} | MindCrate`,
    description,
    keywords: article.tags?.join(", ") || "",
    authors: [{ name: "MindCrate Team" }],
    openGraph: {
      title: article.title,
      description,
      url: `${baseUrl}/articles/${slug}`,
      siteName: "MindCrate",
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: article.title,
        },
      ],
      locale: "en_US",
      type: "article",
      publishedTime: article.created_at,
      modifiedTime: article.updated_at,
      tags: article.tags || [],
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description,
      images: [ogImageUrl],
    },
    alternates: {
      canonical: `${baseUrl}/articles/${slug}`,
    },
  }
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = params
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    let isAdmin = false
    let isLoggedIn = false

    if (session) {
      isLoggedIn = true
      const { data: adminCheck } = await supabase.rpc("is_admin", {
        input_user_id: session.user.id,
      })
      isAdmin = !!adminCheck
    }

    const { data: article, error } = await supabase.from("articles").select("*").eq("slug", slug).single()

    if (error) {
      if (error.code === "PGRST116") notFound()
      console.error("Error fetching article:", error)
      throw error
    }

    if (!article.is_published && !isAdmin) {
      notFound()
    }

    let author = null
    if (article.user_id) {
      try {
        const { data: authorData, error: authorError } = await supabase
          .from("profiles")
          .select("name, username, avatar_url, verified")
          .eq("id", article.user_id)
          .single()

        if (!authorError) {
          author = authorData
        } else {
          console.error("Error fetching author:", authorError)
        }
      } catch (authorFetchError) {
        console.error("Exception fetching author:", authorFetchError)
      }
    }

    const articleWithAuthor = {
      ...article,
      author: author,
    }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://mindcrate.vercel.app"

    return (
      <>
        {/* JSON-LD Structured Data for SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Article",
              headline: article.title,
              description: article.content.substring(0, 160).replace(/[#*`]/g, ""),
              image: article.cover_image_url || `${baseUrl}/logo.png`,
              author: {
                "@type": "Person",
                name: author?.name || author?.username || "MindCrate Team",
              },
              publisher: {
                "@type": "Organization",
                name: "MindCrate",
                logo: {
                  "@type": "ImageObject",
                  url: `${baseUrl}/logo.png`,
                },
              },
              datePublished: article.created_at,
              dateModified: article.updated_at,
              mainEntityOfPage: {
                "@type": "WebPage",
                "@id": `${baseUrl}/articles/${slug}`,
              },
            }),
          }}
        />

        {/* Floating Navigation */}
        <div className="fixed top-4 left-4 right-4 z-40 flex justify-between items-center">
          <Button
            variant="secondary"
            size="sm"
            asChild
            className="backdrop-blur-xl bg-background/80 border border-border/50 shadow-lg rounded-full"
          >
            <Link href="/articles">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Articles
            </Link>
          </Button>

          <div className="flex items-center gap-2">
            {isAdmin && (
              <Button
                variant="secondary"
                size="sm"
                asChild
                className="backdrop-blur-xl bg-background/80 border border-border/50 shadow-lg rounded-full"
              >
                <Link href={`/admin/articles/edit/${article.id}`}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Link>
              </Button>
            )}

            {!isLoggedIn && (
              <>
                <Button
                  variant="secondary"
                  size="sm"
                  asChild
                  className="backdrop-blur-xl bg-background/80 border border-border/50 shadow-lg rounded-full"
                >
                  <Link href="/login">
                    <LogIn className="mr-2 h-4 w-4" />
                    Login
                  </Link>
                </Button>
                <Button size="sm" asChild className="shadow-lg rounded-full">
                  <Link href="/signup">
                    <UserPlus className="mr-2 h-4 w-4" />
                    Sign Up
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Main Content */}
        <Suspense fallback={<ArticleLoading />}>
          <ArticleContent article={articleWithAuthor} />
        </Suspense>

        {/* Call to Action for Non-Logged Users */}
        {!isLoggedIn && (
          <div className="container mx-auto px-4 max-w-4xl py-12">
            <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 border border-primary/20 rounded-2xl p-8 text-center backdrop-blur-sm">
              <div className="max-w-2xl mx-auto space-y-6">
                <h3 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                  Ready to dive deeper?
                </h3>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  Join our community to access exclusive content, engage in discussions, and track your learning
                  journey.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                  <Button
                    asChild
                    size="lg"
                    className="rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <Link href="/signup">
                      <UserPlus className="mr-2 h-5 w-5" />
                      Get Started Free
                    </Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="rounded-full bg-transparent">
                    <Link href="/login">
                      <LogIn className="mr-2 h-5 w-5" />
                      Sign In
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Navigation */}
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-40">
          <Button
            variant="secondary"
            size="sm"
            asChild
            className="backdrop-blur-xl bg-background/80 border border-border/50 shadow-lg rounded-full"
          >
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Home
            </Link>
          </Button>
        </div>
      </>
    )
  } catch (error) {
    console.error("Article page error:", error)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-destructive">Something went wrong</h1>
          <p className="text-muted-foreground">Unable to load the article. Please try again.</p>
          <Button asChild>
            <Link href="/articles">Back to Articles</Link>
          </Button>
        </div>
      </div>
    )
  }
}
