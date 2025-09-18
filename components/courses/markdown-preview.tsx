"use client"

import { useEffect, useState } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import rehypeRaw from "rehype-raw"
import rehypeSanitize from "rehype-sanitize"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism"
import { cn } from "@/lib/utils"

interface MarkdownPreviewProps {
  content: string
}

export function MarkdownPreview({ content }: MarkdownPreviewProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse bg-muted h-8 w-3/4 rounded-md" />
        <div className="animate-pulse bg-muted h-4 w-full rounded-md" />
        <div className="animate-pulse bg-muted h-4 w-5/6 rounded-md" />
        <div className="animate-pulse bg-muted h-4 w-full rounded-md" />
        <div className="animate-pulse bg-muted h-32 w-full rounded-md mt-6" />
        <div className="animate-pulse bg-muted h-4 w-full rounded-md mt-6" />
        <div className="animate-pulse bg-muted h-4 w-5/6 rounded-md" />
      </div>
    )
  }

  return (
    <div className="prose prose-sm md:prose-base lg:prose-lg max-w-none dark:prose-invert">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, rehypeSanitize]}
        components={{
          h1: ({ node, ...props }) => <h1 {...props} className="text-3xl font-bold mt-8 mb-4 pb-2 border-b" />,
          h2: ({ node, ...props }) => <h2 {...props} className="text-2xl font-bold mt-6 mb-4" />,
          h3: ({ node, ...props }) => <h3 {...props} className="text-xl font-bold mt-5 mb-3" />,
          p: ({ node, ...props }) => <p {...props} className="my-4 leading-relaxed" />,
          ul: ({ node, ...props }) => <ul {...props} className="my-4 ml-6 list-disc space-y-2" />,
          ol: ({ node, ...props }) => <ol {...props} className="my-4 ml-6 list-decimal space-y-2" />,
          li: ({ node, ...props }) => <li {...props} className="ml-2" />,
          blockquote: ({ node, ...props }) => (
            <blockquote {...props} className="border-l-4 border-primary/30 pl-4 italic my-6" />
          ),
          a: ({ node, ...props }) => (
            <a {...props} className="text-primary hover:underline" target="_blank" rel="noopener noreferrer" />
          ),
          code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || "")
            return !inline && match ? (
              <div className="my-6 rounded-lg overflow-hidden">
                <div className="bg-zinc-800 text-zinc-200 text-xs px-4 py-1.5 flex items-center">
                  <span>{match[1].toUpperCase()}</span>
                </div>
                <SyntaxHighlighter
                  style={vscDarkPlus}
                  language={match[1]}
                  PreTag="div"
                  {...props}
                  className="!m-0 !rounded-t-none"
                >
                  {String(children).replace(/\n$/, "")}
                </SyntaxHighlighter>
              </div>
            ) : (
              <code className={cn("bg-muted px-1.5 py-0.5 rounded text-sm font-mono", className)} {...props}>
                {children}
              </code>
            )
          },
          // Prevent images from being dragged or right-clicked
          img: ({ node, ...props }) => (
            <div className="my-6">
              <img
                {...props}
                draggable="false"
                onContextMenu={(e) => e.preventDefault()}
                style={{ pointerEvents: "none" }}
                className="rounded-lg mx-auto shadow-md max-h-[500px] object-contain"
              />
            </div>
          ),
          table: ({ node, ...props }) => (
            <div className="my-6 overflow-x-auto">
              <table {...props} className="border-collapse w-full" />
            </div>
          ),
          th: ({ node, ...props }) => (
            <th {...props} className="border border-muted bg-muted/50 px-4 py-2 text-left font-medium" />
          ),
          td: ({ node, ...props }) => <td {...props} className="border border-muted px-4 py-2" />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
