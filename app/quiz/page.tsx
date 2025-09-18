import { getLevelsWithStatus } from "@/lib/quiz/quiz-service"
import LevelSelection from "@/components/quiz/level-selection"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function QuizPage() {
  const supabase = createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/login?redirect=/quiz")
  }

  const levels = await getLevelsWithStatus()

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8 text-center">DarkHunt Quiz Challenge</h1>
      <p className="text-center mb-8 text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
        Test your knowledge by completing all levels. Each level has 5 questions. You need to answer at least 3
        correctly to unlock the next level.
      </p>

      <LevelSelection levels={levels} />
    </div>
  )
}
