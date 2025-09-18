"use client"

import ReactMarkdown from "react-markdown"
import { cn } from "@/lib/utils"

interface MarkdownRendererProps {
  content: string
  isInverted?: boolean
}

export function MarkdownRenderer({ content, isInverted = false }: MarkdownRendererProps) {
  // Check if the content has any markdown syntax
  const hasMarkdown =
    content.includes("```") ||
    content.includes("**") ||
    content.includes("*") ||
    content.includes("#") ||
    content.includes("[") ||
    content.includes(">")

  if (!hasMarkdown) {
    return <p className="text-sm whitespace-pre-wrap">{content}</p>
  }

  return (
    <div className={cn("prose prose-sm max-w-none", isInverted ? "prose-invert" : "dark:prose-invert")}>
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  )
}
