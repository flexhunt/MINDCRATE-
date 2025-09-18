import { createClient } from "@/lib/supabase/client"

// Add the missing exports
export async function createQuizLevel(level: {
  title: string
  description: string
  order: number
  required_score: number
  is_published?: boolean
}) {
  try {
    const supabase = createClient()

    const { data, error } = await supabase
      .from("quiz_levels")
      .insert({
        title: level.title,
        description: level.description,
        order: level.order,
        required_score: level.required_score,
        is_published: level.is_published ?? false,
      })
      .select()
      .single()

    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error("Error creating quiz level:", error)
    return { success: false, error }
  }
}

export function parseMarkdownQuiz(markdown: string) {
  const lines = markdown.split("\n")
  const questions = []

  let currentQuestion: any = null
  let currentAnswers: string[] = []
  let correctAnswers: number[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()

    // New question starts with ##
    if (line.startsWith("## ")) {
      // Save previous question if exists
      if (currentQuestion) {
        questions.push({
          question: currentQuestion,
          answers: currentAnswers,
          correctAnswers: correctAnswers,
        })
      }

      // Start new question
      currentQuestion = line.substring(3).trim()
      currentAnswers = []
      correctAnswers = []
    }
    // Answer line starts with - or *
    else if ((line.startsWith("- ") || line.startsWith("* ")) && currentQuestion) {
      const answerText = line.substring(2).trim()

      // Check if this is marked as correct (has [x] or [X])
      if (answerText.startsWith("[x] ") || answerText.startsWith("[X] ")) {
        correctAnswers.push(currentAnswers.length)
        currentAnswers.push(answerText.substring(4).trim())
      } else if (answerText.startsWith("[ ] ")) {
        currentAnswers.push(answerText.substring(4).trim())
      } else {
        currentAnswers.push(answerText)
      }
    }
  }

  // Add the last question
  if (currentQuestion) {
    questions.push({
      question: currentQuestion,
      answers: currentAnswers,
      correctAnswers: correctAnswers,
    })
  }

  return questions
}
