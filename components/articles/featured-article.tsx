import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, ArrowRight, Sparkles } from "lucide-react"
import { format } from "date-fns"
import type { Article } from "@/lib/articles/article-types"

interface FeaturedArticleProps {
  article: Article
}

export default function FeaturedArticle({ article }: FeaturedArticleProps) {
  const { title, slug, cover_image_url, content, tags, created_at } = article

  // Create a plain text excerpt from the HTML content
  const excerpt =
    content
      .replace(/<[^>]*>/g, "") // Remove HTML tags
      .slice(0, 200) // Take first 200 chars
      .trim() + (content.length > 200 ? "..." : "")

  // Estimate read time (average reading speed: 200 words per minute)
  const wordCount = content.replace(/<[^>]*>/g, "").split(/\s+/).length
  const readTimeMinutes = Math.max(1, Math.round(wordCount / 200))

  return (
    <div className="relative rounded-xl overflow-hidden bg-gradient-to-r from-purple-50/50 to-blue-50/50 dark:from-purple-950/20 dark:to-blue-950/20 border border-border/50 shadow-sm">
      <div className="grid md:grid-cols-2 gap-6 p-6 md:p-8">
        <div className="order-2 md:order-1 flex flex-col justify-center">
          <div className="mb-4">
            <div className="inline-flex items-center px-3 py-1 text-xs font-medium rounded-full bg-primary/10 text-primary mb-4 pulse-soft">
              <Sparkles className="w-3 h-3 mr-1.5" />
              Featured Article
            </div>

            <div className="flex items-center text-sm text-muted-foreground mb-3">
              <Calendar className="h-4 w-4 mr-1" />
              <time dateTime={created_at}>{format(new Date(created_at), "MMMM d, yyyy")}</time>

              <span className="mx-2">•</span>

              <Clock className="h-4 w-4 mr-1" />
              <span>{readTimeMinutes} min read</span>
            </div>

            <h2 className="text-2xl md:text-3xl font-bold mb-4 leading-tight">{title}</h2>

            <p className="text-muted-foreground mb-6">{excerpt}</p>

            <div className="flex flex-wrap gap-2 mb-6">
              {tags &&
                tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="rounded-full px-3">
                    {tag}
                  </Badge>
                ))}
            </div>

            <Button asChild className="group">
              <Link href={`/articles/${slug}`}>
                Read Article
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>
        </div>

        <div className="order-1 md:order-2">
          {cover_image_url ? (
            <div className="rounded-lg overflow-hidden shadow-lg h-64 md:h-full transform transition-transform duration-500 hover:scale-[1.02]">
              <img src={cover_image_url || "/placeholder.svg"} alt={title} className="h-full w-full object-cover" />
            </div>
          ) : (
            <div className="rounded-lg bg-muted h-64 md:h-full flex items-center justify-center">
              <span className="text-muted-foreground">No cover image</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
