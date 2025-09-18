"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { createArticle, updateArticle } from "@/lib/articles/article-utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Switch } from "@/components/ui/switch"
import { toast } from "@/components/ui/use-toast"
import TipTapEditor from "./tiptap-editor"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Save } from "lucide-react"
import type { Article } from "@/lib/articles/article-types"

const formSchema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters" }),
  slug: z.string().optional(),
  cover_image_url: z.string().url({ message: "Please enter a valid URL" }).optional().or(z.literal("")),
  content: z.string().min(10, { message: "Content must be at least 10 characters" }),
  is_published: z.boolean().default(false),
  tags: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

interface ArticleFormProps {
  article?: Article
}

export default function ArticleForm({ article }: ArticleFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  // Convert tags array to comma-separated string for the form
  const defaultTags = article?.tags ? article.tags.join(", ") : ""

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: article?.title || "",
      slug: article?.slug || "",
      cover_image_url: article?.cover_image_url || "",
      content: article?.content || "",
      is_published: article?.is_published || false,
      tags: defaultTags,
    },
  })

  async function onSubmit(values: FormValues) {
    try {
      setIsLoading(true)

      // Convert tags string to array
      const tagsArray = values.tags
        ? values.tags
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean)
        : undefined

      const formData = {
        ...values,
        tags: tagsArray,
      }

      if (article) {
        // Update existing article
        await updateArticle(article.id, formData)
        toast({
          title: "Article updated",
          description: "Your article has been updated successfully.",
        })
      } else {
        // Create new article
        await createArticle({
          ...formData,
          user_id: undefined, // This will be set by the server
        })
        toast({
          title: "Article created",
          description: "Your article has been created successfully.",
        })
      }

      // Redirect to articles admin page
      router.push("/admin/articles")
      router.refresh()
    } catch (error: any) {
      console.error("Error saving article:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to save article. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{article ? "Edit Article" : "Create New Article"}</CardTitle>
        <CardDescription>
          {article ? "Update your article details below" : "Fill in the details to create a new article"}
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Article title" {...field} />
                  </FormControl>
                  <FormDescription>The title of your article</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Slug (optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="article-slug" {...field} />
                  </FormControl>
                  <FormDescription>URL-friendly version of the title. Leave blank to auto-generate.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="cover_image_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cover Image URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://example.com/image.jpg" {...field} value={field.value || ""} />
                  </FormControl>
                  <FormDescription>URL to the cover image for your article</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tags</FormLabel>
                  <FormControl>
                    <Input placeholder="tag1, tag2, tag3" {...field} />
                  </FormControl>
                  <FormDescription>Comma-separated list of tags</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Content</FormLabel>
                  <FormControl>
                    <TipTapEditor
                      content={field.value}
                      onChange={field.onChange}
                      placeholder="Write your article content here..."
                    />
                  </FormControl>
                  <FormDescription>
                    Use the rich text editor to format your content. The content will be displayed with proper
                    formatting.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_published"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Publish</FormLabel>
                    <FormDescription>
                      {field.value ? "Article is published and visible to everyone" : "Article is saved as a draft"}
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {article ? "Update Article" : "Create Article"}
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  )
}
