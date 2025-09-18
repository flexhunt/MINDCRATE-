"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { ChevronDown, ChevronRight, Plus, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import type { CourseTopic, CoursePart } from "@/lib/courses/course-types"

interface SimpleTopicsListProps {
  courseId: string
  initialTopics: CourseTopic[]
}

export function SimpleTopicsList({ courseId, initialTopics }: SimpleTopicsListProps) {
  const [topics, setTopics] = useState<CourseTopic[]>(initialTopics)
  const [expandedTopics, setExpandedTopics] = useState<Record<string, boolean>>({})
  const [topicParts, setTopicParts] = useState<Record<string, CoursePart[]>>({})
  const [loadingTopics, setLoadingTopics] = useState<Record<string, boolean>>({})

  // Part creation state
  const [isAddingPart, setIsAddingPart] = useState(false)
  const [currentTopicId, setCurrentTopicId] = useState<string | null>(null)
  const [newPartTitle, setNewPartTitle] = useState("")
  const [newPartDescription, setNewPartDescription] = useState("")
  const [isSubmittingPart, setIsSubmittingPart] = useState(false)

  // Function to toggle topic expansion
  const toggleTopic = async (topicId: string) => {
    const newExpandedState = !expandedTopics[topicId]
    setExpandedTopics({ ...expandedTopics, [topicId]: newExpandedState })

    // Load parts if expanding and not already loaded
    if (newExpandedState && !topicParts[topicId]) {
      await loadPartsForTopic(topicId)
    }
  }

  // Function to load parts for a topic
  const loadPartsForTopic = async (topicId: string) => {
    setLoadingTopics({ ...loadingTopics, [topicId]: true })

    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("course_parts")
        .select("*")
        .eq("topic_id", topicId)
        .order("position", { ascending: true })

      if (error) throw error

      setTopicParts({ ...topicParts, [topicId]: data || [] })
    } catch (error) {
      console.error("Error loading parts for topic:", error)
      alert("Failed to load parts for this topic. Please try again.")
    } finally {
      setLoadingTopics({ ...loadingTopics, [topicId]: false })
    }
  }

  // Function to open the add part dialog
  const openAddPartDialog = (topicId: string) => {
    setCurrentTopicId(topicId)
    setNewPartTitle("")
    setNewPartDescription("")
    setIsAddingPart(true)
  }

  // Function to add a new part
  const handleAddPart = async () => {
    if (!currentTopicId || !newPartTitle.trim()) return

    setIsSubmittingPart(true)

    try {
      const supabase = createClient()

      // Get the highest position for this topic
      const { data: existingParts, error: positionError } = await supabase
        .from("course_parts")
        .select("position")
        .eq("topic_id", currentTopicId)
        .order("position", { ascending: false })
        .limit(1)

      if (positionError) throw positionError

      const position = existingParts && existingParts.length > 0 ? existingParts[0].position + 1 : 0

      // Insert the new part
      const { data, error } = await supabase
        .from("course_parts")
        .insert({
          topic_id: currentTopicId,
          title: newPartTitle,
          description: newPartDescription || null,
          position: position,
        })
        .select()
        .single()

      if (error) throw error

      // Update the state
      const updatedParts = [...(topicParts[currentTopicId] || []), data]
      setTopicParts({ ...topicParts, [currentTopicId]: updatedParts })

      // Close the dialog
      setIsAddingPart(false)
    } catch (error) {
      console.error("Error adding part:", error)
      alert("Failed to add part. Please try again.")
    } finally {
      setIsSubmittingPart(false)
    }
  }

  // Render parts for a topic
  const renderParts = (topicId: string) => {
    if (loadingTopics[topicId]) {
      return (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">Loading parts...</span>
        </div>
      )
    }

    const parts = topicParts[topicId] || []

    if (parts.length === 0) {
      return <div className="py-2 text-sm text-muted-foreground">No parts available. Add a part to get started.</div>
    }

    return (
      <div className="space-y-2 mt-2">
        {parts.map((part) => (
          <Card key={part.id} className="border border-muted">
            <CardHeader className="p-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">{part.title}</h4>
                <Button size="sm" variant="ghost">
                  <Plus className="h-4 w-4 mr-1" /> Add Page
                </Button>
              </div>
            </CardHeader>
            {part.description && (
              <CardContent className="p-3 pt-0">
                <p className="text-xs text-muted-foreground">{part.description}</p>
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {topics.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No topics yet. Add a topic to get started.</p>
        </div>
      ) : (
        topics.map((topic) => (
          <div key={topic.id} className="border rounded-md">
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center cursor-pointer" onClick={() => toggleTopic(topic.id)}>
                  {expandedTopics[topic.id] ? (
                    <ChevronDown className="h-5 w-5 mr-2 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-5 w-5 mr-2 text-muted-foreground" />
                  )}
                  <h3 className="font-medium">{topic.title}</h3>
                </div>
                <Button size="sm" variant="outline" onClick={() => openAddPartDialog(topic.id)}>
                  <Plus className="h-4 w-4 mr-1" /> Add Part
                </Button>
              </div>

              {topic.description && <p className="ml-7 text-sm text-muted-foreground mt-1">{topic.description}</p>}

              {expandedTopics[topic.id] && <div className="ml-7 mt-4">{renderParts(topic.id)}</div>}
            </div>
          </div>
        ))
      )}

      {/* Add Part Dialog */}
      <Dialog open={isAddingPart} onOpenChange={setIsAddingPart}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Part</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="partTitle">Part Title</Label>
              <Input
                id="partTitle"
                value={newPartTitle}
                onChange={(e) => setNewPartTitle(e.target.value)}
                placeholder="Getting Started"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="partDescription">Description (Optional)</Label>
              <Input
                id="partDescription"
                value={newPartDescription}
                onChange={(e) => setNewPartDescription(e.target.value)}
                placeholder="A brief overview of what this part covers"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddingPart(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddPart} disabled={isSubmittingPart || !newPartTitle.trim()}>
              {isSubmittingPart ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add Part"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
