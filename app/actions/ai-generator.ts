"use server"

import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import { generateArticle, generateQuiz } from "@/lib/ai/ai-generator"
import { createQuizLevel } from "@/lib/quiz/quiz-utils"

/**
 * Server action to generate an article
 */
export async function generateArticleAction(formData: FormData) {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)

    // Get the current session
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      throw new Error("You must be logged in to generate articles")
    }

    // Check if user is admin - use direct query instead of RPC
    const { data: adminCheck, error: adminError } = await supabase
      .from("admin_users")
      .select("user_id")
      .eq("user_id", session.user.id)
      .single()

    if (adminError && adminError.code !== "PGRST116") {
      console.error("Admin check error:", adminError)
      throw new Error("Error checking admin status")
    }

    if (!adminCheck) {
      throw new Error("Only admins can generate articles")
    }

    const topic = formData.get("topic") as string
    const tagsInput = formData.get("tags") as string

    if (!topic) {
      throw new Error("Topic is required")
    }

    // Process tags - split by comma and clean up
    const processedTags = tagsInput
      ? tagsInput
          .split(",")
          .map((tag) => tag.trim())
          .filter((tag) => tag.length > 0)
      : []

    // Generate the article
    const article = await generateArticle(topic, session.user.id, processedTags)

    return { success: true, article }
  } catch (error: any) {
    console.error("Error in generateArticleAction:", error)
    return { success: false, error: error.message }
  }
}

/**
 * Server action to generate a quiz
 */
export async function generateQuizAction(formData: FormData) {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)

    // Get the current session
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      throw new Error("You must be logged in to generate quizzes")
    }

    // Check if user is admin - use direct query instead of RPC
    const { data: adminCheck, error: adminError } = await supabase
      .from("admin_users")
      .select("user_id")
      .eq("user_id", session.user.id)
      .single()

    if (adminError && adminError.code !== "PGRST116") {
      console.error("Admin check error:", adminError)
      throw new Error("Error checking admin status")
    }

    if (!adminCheck) {
      throw new Error("Only admins can generate quizzes")
    }

    const topic = formData.get("topic") as string
    const levelNumber = Number.parseInt(formData.get("levelNumber") as string, 10)

    if (!topic) {
      throw new Error("Topic is required")
    }

    if (isNaN(levelNumber) || levelNumber <= 0) {
      throw new Error("Valid level number is required")
    }

    try {
      // Generate the quiz
      const { level, questions } = await generateQuiz(topic, levelNumber)

      // Create the quiz level in the database
      const result = await createQuizLevel(level, questions)

      return { success: true, quiz: result }
    } catch (error: any) {
      console.error("Error generating quiz:", error)

      // If there's an error with the quiz format, provide a more helpful message
      if (error.message && error.message.includes("Invalid answer format")) {
        return {
          success: false,
          error: "The AI generated an invalid quiz format. Please try again with a more specific topic.",
        }
      }

      throw error
    }
  } catch (error: any) {
    console.error("Error in generateQuizAction:", error)
    return { success: false, error: error.message }
  }
}
