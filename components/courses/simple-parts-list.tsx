"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Plus } from "lucide-react"
import type { CoursePart } from "@/lib/courses/course-types"

interface SimplePartsListProps {
  topicId: string
  parts: CoursePart[]
  onAddPage?: (partId: string) => void
}

export function SimplePartsList({ topicId, parts, onAddPage }: SimplePartsListProps) {
  const router = useRouter()

  if (parts.length === 0) {
    return <div className="text-sm text-muted-foreground">No parts yet. Add parts to organize your course content.</div>
  }

  return (
    <div className="space-y-3">
      {parts.map((part) => (
        <Card key={part.id} className="overflow-hidden">
          <CardHeader className="p-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-medium">{part.title}</CardTitle>
              <Button size="sm" variant="outline" onClick={() => onAddPage?.(part.id)}>
                <Plus className="h-4 w-4 mr-2" /> Add Page
              </Button>
            </div>
          </CardHeader>

          {part.description && (
            <CardContent className="p-3 pt-0">
              <p className="text-sm text-muted-foreground">{part.description}</p>
            </CardContent>
          )}

          <CardContent className="p-3 pt-0">
            <div className="pl-4 border-l-2 border-muted space-y-2">
              {/* This would show pages, but we're keeping it simple for now */}
              <div className="flex items-center text-sm text-muted-foreground">
                <FileText className="h-4 w-4 mr-2" />
                <span>No pages yet</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
