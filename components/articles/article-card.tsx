import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Article } from "@/lib/articles/article-types"

interface ArticleCardProps {
  article: Article & {
    views_count?: number
    likes_count?: number
    saves_count?: number
  }
  variant?: "grid" | "list" | "compact"
  showSavedDate?: boolean
  savedAt?: string
}

export default function ArticleCard({ article, variant = "grid", showSavedDate, savedAt }: ArticleCardProps) {
  const { title, slug, cover_image_url, is_published } = article

  if (variant === "compact") {
    return (
      <Link href={`/articles/${slug}`} className="block group">
        <Card className="overflow-hidden border-0 shadow-none hover:shadow-lg transition-all duration-300 h-full bg-transparent">
          <div className="relative aspect-video overflow-hidden bg-muted rounded-xl">
            <img
              src={
                cover_image_url ||
                "/placeholder.svg?height=180&width=320&query=modern article cover placeholder with gradient"
              }
              alt={title}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
            {!is_published && (
              <div className="absolute top-2 left-2">
                <Badge
                  variant="outline"
                  className="text-amber-600 border-amber-600 bg-amber-50/90 dark:bg-amber-950/90 text-xs"
                >
                  Draft
                </Badge>
              </div>
            )}
          </div>
          <CardContent className="p-3 bg-transparent">
            <h3 className="font-semibold line-clamp-2 text-sm group-hover:text-primary transition-colors leading-tight">
              {title}
            </h3>
          </CardContent>
        </Card>
      </Link>
    )
  }

  if (variant === "list") {
    return (
      <Link href={`/articles/${slug}`} className="block group">
        <Card className="overflow-hidden border-0 shadow-none hover:shadow-lg transition-all duration-300 h-full bg-card/50 backdrop-blur-sm">
          <CardContent className="p-0">
            <div className="flex gap-4 p-4 h-32">
              <div className="relative w-48 aspect-video flex-shrink-0 overflow-hidden rounded-xl bg-muted">
                <img
                  src={
                    cover_image_url ||
                    "/placeholder.svg?height=108&width=192&query=modern article cover placeholder with gradient"
                  }
                  alt={title}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />
                {!is_published && (
                  <div className="absolute top-1 left-1">
                    <Badge
                      variant="outline"
                      className="text-amber-600 border-amber-600 bg-amber-50/90 dark:bg-amber-950/90 text-xs"
                    >
                      Draft
                    </Badge>
                  </div>
                )}
              </div>
              <div className="flex-1 flex items-center min-w-0">
                <h3 className="text-lg font-bold line-clamp-3 group-hover:text-primary transition-colors leading-tight">
                  {title}
                </h3>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    )
  }

  return (
    <Link href={`/articles/${slug}`} className="block h-full group">
      <Card className="h-full overflow-hidden border-0 shadow-none hover:shadow-lg transition-all duration-300 flex flex-col bg-card/50 backdrop-blur-sm rounded-xl">
        <div className="relative aspect-video w-full overflow-hidden bg-muted rounded-t-xl">
          <img
            src={
              cover_image_url ||
              "/placeholder.svg?height=180&width=320&query=modern article cover placeholder with gradient"
            }
            alt={title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
          {!is_published && (
            <div className="absolute top-2 left-2">
              <Badge
                variant="outline"
                className="text-amber-600 border-amber-600 bg-amber-50/90 dark:bg-amber-950/90 text-xs"
              >
                Draft
              </Badge>
            </div>
          )}
        </div>
        <CardContent className="p-4 flex-1 flex items-start">
          <h3 className="text-base font-semibold line-clamp-2 group-hover:text-primary transition-colors leading-tight">
            {title}
          </h3>
        </CardContent>
      </Card>
    </Link>
  )
}
