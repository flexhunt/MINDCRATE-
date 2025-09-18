"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, Share2, Bookmark, Heart } from "lucide-react"
import { formatDate } from "@/lib/utils/date-utils"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import type { ArticleWithAuthor } from "@/lib/articles/article-types"
import VerifiedBadge from "@/components/ui/verified-badge"
import { Button } from "@/components/ui/button"
import { useArticleInteractions } from "@/hooks/use-article-interactions"
import { cn } from "@/lib/utils"
import { useEffect, useState } from "react"
import ViewTracker from "@/components/articles/view-tracker"

interface ArticleContentProps {
  article: ArticleWithAuthor
}

export default function ArticleContent({ article }: ArticleContentProps) {
  const { stats, userInteractions, loading, toggleLike, toggleSave, handleShare } = useArticleInteractions(article.id)
  const [scrollProgress, setScrollProgress] = useState(0)

  const htmlToMarkdown = (html: string) => {
    return html
      .replace(/<h1>(.*?)<\/h1>/g, "# $1\n\n")
      .replace(/<h2>(.*?)<\/h2>/g, "## $1\n\n")
      .replace(/<h3>(.*?)<\/h3>/g, "### $1\n\n")
      .replace(/<h4>(.*?)<\/h4>/g, "#### $1\n\n")
      .replace(/<h5>(.*?)<\/h5>/g, "##### $1\n\n")
      .replace(/<h6>(.*?)<\/h6>/g, "###### $1\n\n")
      .replace(/<p>(.*?)<\/p>/g, "$1\n\n")
      .replace(/<strong>(.*?)<\/strong>/g, "**$1**")
      .replace(/<b>(.*?)<\/b>/g, "**$1**")
      .replace(/<em>(.*?)<\/em>/g, "*$1*")
      .replace(/<i>(.*?)<\/i>/g, "*$1*")
      .replace(/<a href="(.*?)">(.*?)<\/a>/g, "[$2]($1)")
      .replace(/<ul>([\s\S]*?)<\/ul>/g, "$1\n")
      .replace(/<li>(.*?)<\/li>/g, "- $1\n")
      .replace(/<code>(.*?)<\/code>/g, "`$1`")
      .replace(/<pre><code>([\s\S]*?)<\/code><\/pre>/g, "```\n$1\n```")
      .replace(/<img src="(.*?)" alt="(.*?)">/g, "![$2]($1)")
      .replace(/<br>/g, "\n")
      .replace(/&nbsp;/g, " ")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&amp;/g, "&")
  }

  const contentToRender =
    article.content.includes("<") && article.content.includes(">") ? htmlToMarkdown(article.content) : article.content

  const wordCount = contentToRender.replace(/[^\w\s]/g, "").split(/\s+/).length
  const readTimeMinutes = Math.max(1, Math.round(wordCount / 200))

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      const progress = (scrollTop / docHeight) * 100
      setScrollProgress(Math.min(100, Math.max(0, progress)))
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <ViewTracker articleId={article.id} />

      <div className="relative">
        {article.cover_image_url && (
          <div className="relative h-[40vh] md:h-[50vh] overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent z-10" />
            <img
              src={article.cover_image_url || "/placeholder.svg"}
              alt={article.title}
              className="w-full h-full object-cover"
              loading="eager"
            />
          </div>
        )}

        <div className={`relative ${article.cover_image_url ? "-mt-32 z-20" : "pt-8"}`}>
          <div className="container mx-auto px-4 max-w-4xl">
            <div
              className={`${article.cover_image_url ? "bg-background/95 backdrop-blur-xl border border-border/50 rounded-2xl p-6 md:p-8 shadow-2xl" : ""}`}
            >
              <header className="space-y-6">
                <h1 className="text-3xl md:text-5xl font-bold leading-tight bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
                  {article.title}
                </h1>

                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <time dateTime={article.created_at}>{formatDate(new Date(article.created_at), "MMM d, yyyy")}</time>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>{readTimeMinutes} min read</span>
                  </div>
                  {!article.is_published && (
                    <Badge variant="outline" className="text-amber-600 border-amber-600 bg-amber-50 dark:bg-amber-950">
                      Draft
                    </Badge>
                  )}
                </div>

                {article.tags && article.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {article.tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="rounded-full px-3 py-1 text-xs font-medium hover:bg-primary/10 transition-colors"
                      >
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-border/50">
                  {article.author && (
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12 ring-2 ring-primary/20">
                        <AvatarImage src={article.author.avatar_url || ""} alt={article.author.name || "Author"} />
                        <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-semibold">
                          {(article.author.name || article.author.username || "A").charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-foreground">
                            {article.author.name || article.author.username || "Anonymous"}
                          </p>
                          <VerifiedBadge verified={article.author.verified} size="sm" />
                        </div>
                        {article.author.username && (
                          <p className="text-sm text-muted-foreground">@{article.author.username}</p>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "rounded-full transition-all duration-200",
                        userInteractions.liked && "text-red-500 bg-red-50 dark:bg-red-950/20",
                      )}
                      onClick={toggleLike}
                      disabled={loading}
                    >
                      <Heart className={cn("h-4 w-4", userInteractions.liked && "fill-current")} />
                      {stats.likes > 0 && <span className="ml-1 text-xs">{stats.likes}</span>}
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "rounded-full transition-all duration-200",
                        userInteractions.saved && "text-blue-500 bg-blue-50 dark:bg-blue-950/20",
                      )}
                      onClick={toggleSave}
                      disabled={loading}
                    >
                      <Bookmark className={cn("h-4 w-4", userInteractions.saved && "fill-current")} />
                      {stats.saves > 0 && <span className="ml-1 text-xs">{stats.saves}</span>}
                    </Button>

                    <Button variant="ghost" size="sm" className="rounded-full" onClick={handleShare} disabled={loading}>
                      <Share2 className="h-4 w-4" />
                      {stats.shares > 0 && <span className="ml-1 text-xs">{stats.shares}</span>}
                    </Button>
                  </div>
                </div>
              </header>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-4xl py-8 md:py-12">
        <article className="prose prose-lg max-w-none dark:prose-invert">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{contentToRender}</ReactMarkdown>
        </article>
      </div>

      <div className="fixed top-0 left-0 right-0 h-1 bg-muted z-50">
        <div
          className="h-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-150 ease-out"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>
    </div>
  )
}
