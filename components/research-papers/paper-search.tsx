"use client"

import type React from "react"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, FileText, Users, Calendar, ExternalLink, Quote } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface SearchResult {
  id: string
  title: string
  authors: string[]
  abstract: string
  category: string
  journal: string
  publication_date: string
  pdf_url: string
  citation_count: number
  recent_citations: any[]
  paper_tags: { tag: string }[]
}

interface SearchResponse {
  papers: SearchResult[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  searchQuery: string
}

export function PaperSearch() {
  const [searchQuery, setSearchQuery] = useState("")
  const [category, setCategory] = useState("all")
  const [sortBy, setSortBy] = useState("relevance")
  const [results, setResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  })
  const { toast } = useToast()

  const handleSearch = async (page = 1) => {
    if (!searchQuery.trim()) {
      toast({
        title: "Enter search query",
        description: "Please enter a search term to find research papers",
        variant: "destructive",
      })
      return
    }

    setIsSearching(true)

    try {
      const params = new URLSearchParams({
        q: searchQuery,
        page: page.toString(),
        limit: pagination.limit.toString(),
        sortBy,
      })

      if (category !== "all") {
        params.append("category", category)
      }

      const response = await fetch(`/api/research-papers/search?${params}`)
      const data: SearchResponse = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Search failed")
      }

      setResults(data.papers)
      setPagination(data.pagination)
    } catch (error: any) {
      console.error("Search error:", error)
      toast({
        title: "Search failed",
        description: error.message || "Failed to search research papers",
        variant: "destructive",
      })
    } finally {
      setIsSearching(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch(1)
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return "Unknown"
    return new Date(dateString).toLocaleDateString()
  }

  const highlightText = (text: string, query: string) => {
    if (!query) return text
    const regex = new RegExp(`(${query})`, "gi")
    const parts = text.split(regex)
    return parts.map((part, index) =>
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 dark:bg-yellow-800">
          {part}
        </mark>
      ) : (
        part
      ),
    )
  }

  return (
    <div className="space-y-6">
      {/* Search Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search Research Papers
          </CardTitle>
          <CardDescription>
            Find research papers with deep search capabilities including citations and full-text search
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Search Input */}
            <div className="flex gap-2">
              <Input
                placeholder="Search by title, abstract, authors, or keywords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1"
              />
              <Button onClick={() => handleSearch(1)} disabled={isSearching}>
                {isSearching ? "Searching..." : "Search"}
              </Button>
            </div>

            {/* Filters */}
            <div className="flex gap-4">
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="psychology">Psychology</SelectItem>
                  <SelectItem value="neuroscience">Neuroscience</SelectItem>
                  <SelectItem value="cognitive-science">Cognitive Science</SelectItem>
                  <SelectItem value="behavioral-science">Behavioral Science</SelectItem>
                  <SelectItem value="mental-health">Mental Health</SelectItem>
                  <SelectItem value="education">Education</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="relevance">Relevance</SelectItem>
                  <SelectItem value="date">Publication Date</SelectItem>
                  <SelectItem value="citations">Most Cited</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search Results */}
      {results.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">
              {pagination.total} results for "{searchQuery}"
            </h3>
            <div className="text-sm text-muted-foreground">
              Page {pagination.page} of {pagination.totalPages}
            </div>
          </div>

          {results.map((paper) => (
            <Card key={paper.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {/* Title and Category */}
                  <div className="flex items-start justify-between gap-4">
                    <h4 className="text-lg font-semibold leading-tight">{highlightText(paper.title, searchQuery)}</h4>
                    {paper.category && (
                      <Badge variant="secondary" className="shrink-0">
                        {paper.category}
                      </Badge>
                    )}
                  </div>

                  {/* Authors and Date */}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>{paper.authors.join(", ")}</span>
                    </div>
                    {paper.publication_date && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(paper.publication_date)}</span>
                      </div>
                    )}
                    {paper.journal && <span>• {paper.journal}</span>}
                  </div>

                  {/* Abstract */}
                  {paper.abstract && (
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {highlightText(paper.abstract, searchQuery)}
                    </p>
                  )}

                  {/* Tags */}
                  {paper.paper_tags && paper.paper_tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {paper.paper_tags.slice(0, 5).map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tag.tag}
                        </Badge>
                      ))}
                      {paper.paper_tags.length > 5 && (
                        <Badge variant="outline" className="text-xs">
                          +{paper.paper_tags.length - 5} more
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Citations and Actions */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Quote className="h-4 w-4" />
                        <span>{paper.citation_count} citations</span>
                      </div>
                      {paper.recent_citations.length > 0 && (
                        <span>• Recently cited by {paper.recent_citations.length} papers</span>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <a href={paper.pdf_url} target="_blank" rel="noopener noreferrer">
                          <FileText className="h-4 w-4 mr-1" />
                          View PDF
                        </a>
                      </Button>
                      <Button variant="outline" size="sm">
                        <ExternalLink className="h-4 w-4 mr-1" />
                        Details
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-center gap-2">
              <Button
                variant="outline"
                onClick={() => handleSearch(pagination.page - 1)}
                disabled={pagination.page <= 1 || isSearching}
              >
                Previous
              </Button>
              <span className="flex items-center px-4 text-sm text-muted-foreground">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => handleSearch(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages || isSearching}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      )}

      {/* No Results */}
      {results.length === 0 && searchQuery && !isSearching && (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">No research papers found for "{searchQuery}"</p>
            <p className="text-sm text-muted-foreground mt-2">Try different keywords or check your spelling</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
