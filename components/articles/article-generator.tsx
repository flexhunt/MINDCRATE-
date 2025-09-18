"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { generateArticleAction } from "@/app/actions/ai-generator"
import { useToast } from "@/components/ui/toast"
import { Loader2 } from "lucide-react"

export function ArticleGenerator() {
  const [topic, setTopic] = useState("")
  const [tags, setTags] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!topic.trim()) {
      toast({
        title: "Topic required",
        description: "Please enter a topic for the article",
        variant: "destructive",
      })
      return
    }

    setIsGenerating(true)

    try {
      const formData = new FormData()
      formData.append("topic", topic)
      formData.append("tags", tags)

      const result = await generateArticleAction(formData)

      if (result.success) {
        toast({
          title: "Article generated successfully",
          description: `"${result.article.title}" has been created and published.`,
        })
        setTopic("")
        setTags("")
      } else {
        toast({
          title: "Failed to generate article",
          description: result.error || "An unknown error occurred",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An unknown error occurred",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>AI Article Generator</CardTitle>
        <CardDescription>Enter a topic and the AI will generate a complete article for you</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="topic" className="text-sm font-medium">
                Topic
              </label>
              <Input
                id="topic"
                placeholder="Enter a topic (e.g., 'Blockchain Technology', 'Meditation Benefits')"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                disabled={isGenerating}
              />
              <p className="text-xs text-muted-foreground">
                Be specific for better results. You can include multiple related topics separated by commas.
              </p>
            </div>
            <div className="space-y-2">
              <label htmlFor="tags" className="text-sm font-medium">
                Tags (optional)
              </label>
              <Input
                id="tags"
                placeholder="Enter tags separated by commas (e.g., focus, productivity, mindset)"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                disabled={isGenerating}
              />
              <p className="text-xs text-muted-foreground">
                Add 2-3 relevant tags to help categorize your article. Separate with commas.
              </p>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={isGenerating} className="w-full">
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Article...
              </>
            ) : (
              "Generate Article"
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}

// Add default export
export default ArticleGenerator
