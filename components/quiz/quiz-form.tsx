"use client"

import type React from "react"

import { useState } from "react"
import { type Question, submitQuiz } from "@/lib/quiz/quiz-service"
import { useRouter } from "next/navigation"

interface QuizFormProps {
  levelId: number
  questions: Question[]
}

export default function QuizForm({ levelId, questions }: QuizFormProps) {
  const router = useRouter()
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<{
    score: number
    passed: boolean
    nextLevelUnlocked: boolean
  } | null>(null)

  const handleOptionSelect = (questionId: number, option: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: option,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const result = await submitQuiz({
        levelId,
        answers,
      })

      setResult(result)
    } catch (error) {
      console.error("Error submitting quiz:", error)
      alert("Failed to submit quiz. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  const isFormComplete = questions.every((q) => answers[q.id])

  if (result) {
    return (
      <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
        <h2 className="text-2xl font-bold mb-4 text-center">Quiz Results</h2>

        <div className="text-center mb-6">
          <div className="text-5xl font-bold mb-2">
            {result.score} / {questions.length}
          </div>
          <p className="text-lg">
            {result.passed ? (
              <span className="text-green-600 dark:text-green-400">You passed this level!</span>
            ) : (
              <span className="text-red-600 dark:text-red-400">
                You didn't pass. You need at least 3 correct answers.
              </span>
            )}
          </p>
        </div>

        <div className="w-full bg-gray-200 rounded-full h-4 mb-6 dark:bg-gray-700">
          <div
            className={`h-4 rounded-full ${
              result.passed ? "bg-green-600 dark:bg-green-500" : "bg-red-600 dark:bg-red-500"
            }`}
            style={{ width: `${(result.score / questions.length) * 100}%` }}
          ></div>
        </div>

        <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4 justify-center">
          <button
            onClick={() => router.push("/quiz")}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-blue-700 dark:hover:bg-blue-600"
          >
            Back to Levels
          </button>

          <button
            onClick={() => {
              setAnswers({})
              setResult(null)
            }}
            className="px-6 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
          >
            Try Again
          </button>

          {result.passed && result.nextLevelUnlocked && (
            <button
              onClick={() => router.push("/quiz")}
              className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 dark:bg-green-700 dark:hover:bg-green-600"
            >
              Next Level Unlocked!
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
      <div className="space-y-8">
        {questions.map((question, index) => (
          <div key={question.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h3 className="text-lg font-medium mb-4">
              <span className="font-bold mr-2">Question {index + 1}:</span> {question.question_text}
            </h3>

            <div className="space-y-3">
              {["a", "b", "c", "d"].map((option) => {
                const optionText = question[`option_${option}` as keyof Question] as string

                return (
                  <label
                    key={option}
                    className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                      answers[question.id] === option
                        ? "bg-blue-50 border-blue-500 dark:bg-blue-900 dark:border-blue-400"
                        : "hover:bg-gray-50 dark:hover:bg-gray-700"
                    }`}
                  >
                    <input
                      type="radio"
                      name={`question-${question.id}`}
                      value={option}
                      checked={answers[question.id] === option}
                      onChange={() => handleOptionSelect(question.id, option)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <span className="ml-3 text-sm font-medium">
                      <span className="uppercase font-bold mr-2">{option})</span> {optionText}
                    </span>
                  </label>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 flex justify-center">
        <button
          type="submit"
          disabled={!isFormComplete || submitting}
          className={`px-6 py-3 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${
            isFormComplete && !submitting
              ? "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500"
              : "bg-gray-400 cursor-not-allowed"
          }`}
        >
          {submitting ? "Submitting..." : "Submit Answers"}
        </button>
      </div>
    </form>
  )
}
