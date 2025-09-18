"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export type Level = {
  id: number
  level_number: number
  title: string
  description: string | null
  passing_score: number
  total_questions: number
  unlocked: boolean
  completed: boolean
  score: number | null
}

export type Question = {
  id: number
  level_id: number
  question_text: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  correct_option: string
}

export type QuizSubmission = {
  levelId: number
  answers: Record<number, string> // questionId -> selected option
}

// Get all levels with unlock status for the current user
export async function getLevelsWithStatus(): Promise<Level[]> {
  const supabase = createClient()

  // Get the current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("User not authenticated")
  }

  // Get all levels
  const { data: levels, error } = await supabase.from("levels").select("*").order("level_number")

  if (error) {
    console.error("Error fetching levels:", error)
    throw new Error("Failed to fetch levels")
  }

  // Get user progress for all levels
  const { data: userProgress, error: progressError } = await supabase
    .from("user_progress")
    .select("*")
    .eq("user_id", user.id)

  if (progressError) {
    console.error("Error fetching user progress:", progressError)
    throw new Error("Failed to fetch user progress")
  }

  // Map user progress to levels
  const progressMap = new Map(userProgress?.map((progress) => [progress.level_id, progress]) || [])

  // Check unlock status for each level
  const levelsWithStatus: Level[] = await Promise.all(
    levels.map(async (level) => {
      const { data: isUnlocked, error: unlockError } = await supabase.rpc("is_level_unlocked", {
        p_user_id: user.id,
        p_level_number: level.level_number,
      })

      if (unlockError) {
        console.error("Error checking level unlock status:", unlockError)
        throw new Error("Failed to check level unlock status")
      }

      const progress = progressMap.get(level.id)

      return {
        ...level,
        unlocked: isUnlocked,
        completed: !!progress,
        score: progress?.score || null,
      }
    }),
  )

  return levelsWithStatus
}

// Get questions for a specific level
export async function getQuestionsForLevel(levelId: number): Promise<Question[]> {
  const supabase = createClient()

  // Get the current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("User not authenticated")
  }

  // Get level info to check if it's unlocked
  const { data: level, error: levelError } = await supabase
    .from("levels")
    .select("level_number")
    .eq("id", levelId)
    .single()

  if (levelError || !level) {
    console.error("Error fetching level:", levelError)
    throw new Error("Level not found")
  }

  // Check if level is unlocked
  const { data: isUnlocked, error: unlockError } = await supabase.rpc("is_level_unlocked", {
    p_user_id: user.id,
    p_level_number: level.level_number,
  })

  if (unlockError) {
    console.error("Error checking level unlock status:", unlockError)
    throw new Error("Failed to check level unlock status")
  }

  if (!isUnlocked) {
    throw new Error("Level is locked")
  }

  // Get questions for the level
  const { data: questions, error } = await supabase.from("questions").select("*").eq("level_id", levelId).order("id")

  if (error) {
    console.error("Error fetching questions:", error)
    throw new Error("Failed to fetch questions")
  }

  return questions
}

// Submit quiz answers and evaluate
export async function submitQuiz(submission: QuizSubmission): Promise<{
  score: number
  passed: boolean
  nextLevelUnlocked: boolean
}> {
  const supabase = createClient()

  // Get the current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("User not authenticated")
  }

  // Get level info
  const { data: level, error: levelError } = await supabase
    .from("levels")
    .select("*")
    .eq("id", submission.levelId)
    .single()

  if (levelError || !level) {
    console.error("Error fetching level:", levelError)
    throw new Error("Level not found")
  }

  // Get questions with correct answers
  const { data: questions, error: questionsError } = await supabase
    .from("questions")
    .select("id, correct_option")
    .eq("level_id", submission.levelId)

  if (questionsError || !questions) {
    console.error("Error fetching questions:", questionsError)
    throw new Error("Failed to fetch questions")
  }

  // Calculate score
  let score = 0
  for (const question of questions) {
    if (submission.answers[question.id] === question.correct_option) {
      score++
    }
  }

  // Check if passed
  const passed = score >= level.passing_score

  // Update user progress
  const { data: existingProgress, error: progressCheckError } = await supabase
    .from("user_progress")
    .select("id, score")
    .eq("user_id", user.id)
    .eq("level_id", submission.levelId)
    .maybeSingle()

  if (progressCheckError) {
    console.error("Error checking existing progress:", progressCheckError)
    throw new Error("Failed to check existing progress")
  }

  // Only update if new score is better or no previous attempt
  if (!existingProgress || existingProgress.score < score) {
    if (existingProgress) {
      // Update existing record
      const { error: updateError } = await supabase
        .from("user_progress")
        .update({
          score,
          passed,
          completed_at: new Date().toISOString(),
        })
        .eq("id", existingProgress.id)

      if (updateError) {
        console.error("Error updating progress:", updateError)
        throw new Error("Failed to update progress")
      }
    } else {
      // Insert new record
      const { error: insertError } = await supabase.from("user_progress").insert({
        user_id: user.id,
        level_id: submission.levelId,
        score,
        passed,
        completed_at: new Date().toISOString(),
      })

      if (insertError) {
        console.error("Error inserting progress:", insertError)
        throw new Error("Failed to save progress")
      }
    }
  }

  // Check if next level is unlocked
  let nextLevelUnlocked = false
  if (passed) {
    const { data: nextLevel, error: nextLevelError } = await supabase
      .from("levels")
      .select("id")
      .eq("level_number", level.level_number + 1)
      .maybeSingle()

    if (!nextLevelError && nextLevel) {
      nextLevelUnlocked = true
    }
  }

  // Revalidate the levels page to reflect new unlock status
  revalidatePath("/quiz")

  return {
    score,
    passed,
    nextLevelUnlocked,
  }
}
