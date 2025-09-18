"use client"

import { useState } from "react"
import { TopicSelection } from "@/components/questionnaire/topic-selection"
import { QuestionnaireForm } from "@/components/questionnaire/questionnaire-form"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export default function QuestionnairePage() {
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null)
  const [completedSessionId, setCompletedSessionId] = useState<string | null>(null)

  const handleTopicSelect = (topicId: string) => {
    setSelectedTopicId(topicId)
    setCompletedSessionId(null)
  }

  const handleQuestionnaireComplete = (sessionId: string) => {
    setCompletedSessionId(sessionId)
  }

  const handleBackToTopics = () => {
    setSelectedTopicId(null)
    setCompletedSessionId(null)
  }

  if (completedSessionId) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <div className="space-y-4">
            <h1 className="text-3xl font-bold text-green-600">Assessment Complete!</h1>
            <p className="text-lg text-muted-foreground">
              Thank you for completing the questionnaire. Your responses have been saved and analyzed.
            </p>
          </div>

          <div className="space-y-4">
            <p className="text-muted-foreground">
              You can now view your personalized psychological insights and explanations.
            </p>
            <div className="flex gap-4 justify-center">
              <Button onClick={handleBackToTopics} variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Take Another Assessment
              </Button>
              <Button>View My Results</Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (selectedTopicId) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button variant="ghost" onClick={handleBackToTopics}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Topics
          </Button>
        </div>
        <QuestionnaireForm topicId={selectedTopicId} onComplete={handleQuestionnaireComplete} />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <TopicSelection onTopicSelect={handleTopicSelect} />
    </div>
  )
}
