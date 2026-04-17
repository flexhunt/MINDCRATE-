"use client"

import ReactMarkdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'

export default function MarkdownRenderer({ content }: { content: string }) {
    return (
        <ReactMarkdown rehypePlugins={[rehypeRaw]}>
            {content}
        </ReactMarkdown>
    )
}
