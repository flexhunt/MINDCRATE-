import { createClient } from "@/lib/supabase/server"
import QuizForm from "@/components/quiz/quiz-form"
import { redirect } from "next/navigation"
import { notFound } from "next/navigation"

interface LevelPageProps {
  params: {
    id: string
  }
}

export default async function LevelPage({ params }: LevelPageProps) {
  const levelId = Number.parseInt(params.id)

  if (isNaN(levelId)) {
    notFound()
  }

  const supabase = createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/login?redirect=/quiz/level/" + levelId)
  }

  try {
    // Get questions for level
    const { data: questions, error } = await supabase
      .from("questions")
      .select("*")
      .eq("level_id", levelId)
      .order("id", { ascending: true })

    if (error) throw error

    // Get level info
    const { data: level, error: levelError } = await supabase
      .from("levels")
      .select("title, level_number")
      .eq("id", levelId)
      .single()

    if (levelError || !level) {
      notFound()
    }

    return (
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold">
            Level {level.level_number}: {level.title}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Answer at least 3 out of 5 questions correctly to pass this level.
          </p>
        </div>

        <QuizForm levelId={levelId} questions={questions || []} />
      </div>
    )
  } catch (error: any) {
    if (error.message === "Level is locked") {
      redirect("/quiz")
    }

    throw error
  }
}
