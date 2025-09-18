"use client"

import Link from "next/link"
import type { Level } from "@/lib/quiz/quiz-service"
import { LockIcon, CheckIcon, ArrowRightIcon } from "lucide-react"

interface LevelSelectionProps {
  levels: Level[]
}

export default function LevelSelection({ levels }: LevelSelectionProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {levels.map((level) => (
        <div
          key={level.id}
          className={`border rounded-lg overflow-hidden shadow-sm ${
            level.unlocked ? "bg-white dark:bg-gray-800" : "bg-gray-100 dark:bg-gray-900 opacity-75"
          }`}
        >
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Level {level.level_number}</h2>
              {level.completed ? (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  <CheckIcon className="w-4 h-4 mr-1" />
                  Completed
                </span>
              ) : level.unlocked ? (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                  Unlocked
                </span>
              ) : (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200">
                  <LockIcon className="w-4 h-4 mr-1" />
                  Locked
                </span>
              )}
            </div>

            <h3 className="font-semibold mb-2">{level.title}</h3>
            {level.description && <p className="text-gray-600 dark:text-gray-400 mb-4">{level.description}</p>}

            {level.completed && (
              <div className="mb-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Your score: {level.score} / {level.total_questions}
                </p>
                <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2 dark:bg-gray-700">
                  <div
                    className="bg-green-600 h-2.5 rounded-full dark:bg-green-500"
                    style={{ width: `${(level.score! / level.total_questions) * 100}%` }}
                  ></div>
                </div>
              </div>
            )}

            {level.unlocked ? (
              <Link
                href={`/quiz/level/${level.id}`}
                className="inline-flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-blue-700 dark:hover:bg-blue-600"
              >
                {level.completed ? "Try Again" : "Start Level"}
                <ArrowRightIcon className="w-4 h-4 ml-2" />
              </Link>
            ) : (
              <button
                disabled
                className="inline-flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md cursor-not-allowed dark:bg-gray-700 dark:text-gray-300"
              >
                <LockIcon className="w-4 h-4 mr-2" />
                Locked
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
