"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Plus, Search, BookOpen, Bookmark, Grid3X3, List, ChevronDown, ChevronUp, Filter } from "lucide-react"
import ArticleCard from "@/components/articles/article-card"
import { Input } from "@/components/ui/input"

interface ArticlesClientProps {
  articles: any[]
  uniqueTags: string[]
  selectedTag?: string
  searchQuery?: string
  viewMode: string
  isAdmin: boolean
  user: any
}

export default function ArticlesClient({
  articles,
  uniqueTags,
  selectedTag,
  searchQuery,
  viewMode,
  isAdmin,
  user,
}: ArticlesClientProps) {
  const [showTopics, setShowTopics] = useState(false)

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/10">
      {/* Modern Header */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-primary/10 rounded-xl">
                  <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-lg sm:text-2xl font-bold">Articles</h1>
                  <p className="text-xs sm:text-sm text-muted-foreground">{articles?.length || 0} articles available</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 sm:gap-2">
              {isAdmin && (
                <Button asChild size="sm" className="gap-2 hidden sm:flex">
                  <Link href="/admin/articles">
                    <Plus className="h-4 w-4" />
                    New Article
                  </Link>
                </Button>
              )}

              {user && (
                <Button asChild variant="outline" size="sm" className="gap-2 bg-transparent">
                  <Link href="/articles/saved">
                    <Bookmark className="h-4 w-4" />
                    <span className="hidden sm:inline">Saved</span>
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-6 space-y-2 sm:space-y-6">
        {/* Search & Filter Bar */}
        <div className="bg-card/50 backdrop-blur-sm rounded-2xl p-2 sm:p-6 border border-border/50 shadow-sm">
          <div className="flex flex-col lg:flex-row gap-2 sm:gap-4">
            {/* Search */}
            <div className="flex-1">
              <form action="/articles" method="get" className="relative">
                {selectedTag && <input type="hidden" name="tag" value={selectedTag} />}
                {viewMode && <input type="hidden" name="view" value={viewMode} />}
                <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  name="q"
                  placeholder="Search articles..."
                  className="pl-10 sm:pl-12 h-9 sm:h-12 bg-background/50 border-border/50 rounded-xl text-sm"
                  defaultValue={searchQuery || ""}
                />
              </form>
            </div>

            {/* View Toggle */}
            <div className="flex items-center gap-1 sm:gap-2 bg-muted/50 rounded-xl p-0.5 sm:p-1">
              <Link
                href={`/articles?${new URLSearchParams({
                  ...(selectedTag && { tag: selectedTag }),
                  ...(searchQuery && { q: searchQuery }),
                  view: "grid",
                }).toString()}`}
                className={`p-1.5 sm:p-2 rounded-lg transition-all ${
                  viewMode === "grid"
                    ? "bg-background shadow-sm text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Grid3X3 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Link>
              <Link
                href={`/articles?${new URLSearchParams({
                  ...(selectedTag && { tag: selectedTag }),
                  ...(searchQuery && { q: searchQuery }),
                  view: "list",
                }).toString()}`}
                className={`p-1.5 sm:p-2 rounded-lg transition-all ${
                  viewMode === "list"
                    ? "bg-background shadow-sm text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <List className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Link>
            </div>
          </div>

          <div className="mt-2 sm:mt-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowTopics(!showTopics)}
              className="flex items-center gap-2 mb-2 lg:hidden w-full justify-between h-8 px-2 text-sm"
            >
              <div className="flex items-center gap-2">
                <Filter className="h-3.5 w-3.5" />
                <span>Topics</span>
                {selectedTag && (
                  <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">{selectedTag}</span>
                )}
              </div>
              {showTopics ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </Button>

            <div className={`${showTopics ? "block" : "hidden"} lg:block`}>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                <Link
                  href={`/articles?${new URLSearchParams({
                    ...(searchQuery && { q: searchQuery }),
                    ...(viewMode && { view: viewMode }),
                  }).toString()}`}
                  className={`px-2.5 sm:px-4 py-1 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all ${
                    !selectedTag
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  All Topics
                </Link>

                {uniqueTags.slice(0, 8).map((tag) => (
                  <Link
                    key={tag}
                    href={`/articles?${new URLSearchParams({
                      tag,
                      ...(searchQuery && { q: searchQuery }),
                      ...(viewMode && { view: viewMode }),
                    }).toString()}`}
                    className={`px-2.5 sm:px-4 py-1 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all ${
                      selectedTag === tag
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    {tag}
                  </Link>
                ))}

                {uniqueTags.length > 8 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-full text-muted-foreground text-xs sm:text-sm px-2.5 py-1 h-auto"
                  >
                    +{uniqueTags.length - 8} more
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Articles Section */}
        <div className="space-y-3 sm:space-y-6">
          {articles && articles.length > 0 ? (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base sm:text-xl font-semibold">
                    {selectedTag ? `Tagged: ${selectedTag}` : searchQuery ? "Search Results" : "All Articles"}
                  </h2>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {articles.length} article{articles.length !== 1 ? "s" : ""} found
                  </p>
                </div>
              </div>

              <div
                className={
                  viewMode === "list"
                    ? "space-y-2 sm:space-y-4"
                    : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-6"
                }
              >
                {articles.map((article, index) => (
                  <div key={article.id} className={viewMode === "grid" ? "h-full" : ""}>
                    <ArticleCard article={article} variant={viewMode === "list" ? "list" : "grid"} />
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-8 sm:py-20 bg-card/30 rounded-2xl border border-border/50">
              <div className="max-w-md mx-auto space-y-3 sm:space-y-4 px-4">
                <div className="p-3 sm:p-4 bg-muted/50 rounded-full w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center mx-auto">
                  <Search className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-base sm:text-xl font-semibold mb-2">
                    {selectedTag
                      ? `No articles found with tag "${selectedTag}"`
                      : searchQuery
                        ? `No results found for "${searchQuery}"`
                        : "No articles found"}
                  </h3>
                  <p className="text-muted-foreground text-xs sm:text-sm">
                    {isAdmin ? "Create your first article to get started" : "Check back later for new content"}
                  </p>
                </div>
                {isAdmin ? (
                  <Button asChild className="gap-2" size="sm">
                    <Link href="/admin/articles/new">
                      <Plus className="h-4 w-4" />
                      Create Article
                    </Link>
                  </Button>
                ) : (
                  <Button asChild variant="outline" size="sm">
                    <Link href="/articles">Clear Filters</Link>
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
