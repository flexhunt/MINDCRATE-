import { createClient } from "@/lib/supabase/client"
import type { CoursePart } from "./course-types"

/**
 * Fetches all parts for a topic
 */
export async function getPartsForTopic(topicId: string): Promise<CoursePart[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("course_parts")
    .select("*")
    .eq("topic_id", topicId)
    .order("position", { ascending: true })

  if (error) {
    console.error("Error fetching parts:", error)
    throw new Error(`Failed to fetch parts: ${error.message}`)
  }

  return data || []
}

/**
 * Adds a part to a topic directly using Supabase client
 */
export async function addPartToTopic(topicId: string, title: string, description?: string): Promise<CoursePart> {
  const supabase = createClient()

  // Get highest position
  const { data: existingParts, error: posError } = await supabase
    .from("course_parts")
    .select("position")
    .eq("topic_id", topicId)
    .order("position", { ascending: false })
    .limit(1)

  if (posError) {
    console.error("Error getting position:", posError)
    throw new Error(`Failed to determine position: ${posError.message}`)
  }

  const position = existingParts && existingParts.length > 0 ? existingParts[0].position + 1 : 0

  // Insert the part
  const { data, error } = await supabase
    .from("course_parts")
    .insert({
      topic_id: topicId,
      title,
      description: description || null,
      position,
    })
    .select()
    .single()

  if (error) {
    console.error("Error adding part:", error)
    throw new Error(`Failed to add part: ${error.message}`)
  }

  return data
}
