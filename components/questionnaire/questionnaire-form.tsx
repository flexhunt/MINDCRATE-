"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Slider } from "@/components/ui/slider"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, ArrowRight, CheckCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Question {
  id: string
  question_text: string
  question_type: "multiple_choice" | "scale" | "text" | "boolean"
  options?: string[]
  scale_min?: number
  scale_max?: number
  scale_labels?: { [key: string]: string }
  is_required: boolean
  order_index: number
}

interface Topic {
  id: string
  title: string
  description: string
  category: string
  estimated_time: number
}

interface QuestionnaireFormProps {
  topicId: string
  onComplete?: (sessionId: string) => void
}

export function QuestionnaireForm({ topicId, onComplete }: QuestionnaireFormProps) {
  const [topic, setTopic] = useState<Topic | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [responses, setResponses] = useState<{ [questionId: string]: any }>({})
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadQuestionnaire()
  }, [topicId])

  const loadQuestionnaire = async () => {
    try {
      // Load questions
      const questionsResponse = await fetch(`/api/questionnaire/${topicId}/questions`)
      const questionsData = await questionsResponse.json()

      if (!questionsResponse.ok) {
        throw new Error(questionsData.error || "Failed to load questionnaire")
      }

      setTopic(questionsData.topic)
      setQuestions(questionsData.questions)

      // Create session
      const sessionResponse = await fetch("/api/questionnaire/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ topicId }),
      })

      const sessionData = await sessionResponse.json()

      if (!sessionResponse.ok) {
        throw new Error(sessionData.error || "Failed to create session")
      }

      setSessionId(sessionData.session.id)
    } catch (error: any) {
      console.error("Error loading questionnaire:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to load questionnaire",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleResponse = (questionId: string, value: any) => {
    setResponses((prev) => ({
      ...prev,
      [questionId]: value,
    }))
  }

  const canProceed = () => {
    const currentQuestion = questions[currentQuestionIndex]
    if (!currentQuestion) return false

    const response = responses[currentQuestion.id]
    return !currentQuestion.is_required || (response !== undefined && response !== "")
  }

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    }
  }

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
    }
  }

  const handleSubmit = async () => {
    if (!sessionId) return

    setIsSubmitting(true)

    try {
      const responseArray = Object.entries(responses).map(([questionId, responseValue]) => ({
        questionId,
        responseValue: typeof responseValue === "object" ? JSON.stringify(responseValue) : String(responseValue),
        responseData: typeof responseValue === "object" ? responseValue : null,
      }))

      const response = await fetch(`/api/questionnaire/sessions/${sessionId}/responses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ responses: responseArray }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit responses")
      }

      toast({
        title: "Questionnaire completed",
        description: "Your responses have been saved successfully",
      })

      window.location.href = `/questionnaire/results/${sessionId}`
    } catch (error: any) {
      console.error("Error submitting responses:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to submit responses",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderQuestion = (question: Question) => {
    const currentResponse = responses[question.id]

    switch (question.question_type) {
      case "multiple_choice":
        return (
          <RadioGroup value={currentResponse || ""} onValueChange={(value) => handleResponse(question.id, value)}>
            {question.options?.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={`${question.id}-${index}`} />
                <Label htmlFor={`${question.id}-${index}`} className="cursor-pointer">
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>
        )

      case "scale":
        const scaleValue = currentResponse || [question.scale_min || 1]
        return (
          <div className="space-y-4">
            <Slider
              value={Array.isArray(scaleValue) ? scaleValue : [scaleValue]}
              onValueChange={(value) => handleResponse(question.id, value[0])}
              min={question.scale_min || 1}
              max={question.scale_max || 10}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{question.scale_labels?.[String(question.scale_min)] || question.scale_min}</span>
              <span className="font-medium">{Array.isArray(scaleValue) ? scaleValue[0] : scaleValue}</span>
              <span>{question.scale_labels?.[String(question.scale_max)] || question.scale_max}</span>
            </div>
          </div>
        )

      case "text":
        return (
          <Textarea
            value={currentResponse || ""}
            onChange={(e) => handleResponse(question.id, e.target.value)}
            placeholder="Enter your response..."
            rows={4}
          />
        )

      case "boolean":
        return (
          <RadioGroup
            value={currentResponse || ""}
            onValueChange={(value) => handleResponse(question.id, value === "true")}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="true" id={`${question.id}-yes`} />
              <Label htmlFor={`${question.id}-yes`} className="cursor-pointer">
                Yes
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="false" id={`${question.id}-no`} />
              <Label htmlFor={`${question.id}-no`} className="cursor-pointer">
                No
              </Label>
            </div>
          </RadioGroup>
        )

      default:
        return <div>Unsupported question type</div>
    }
  }

  if (isLoading) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="pt-6">
          <div className="text-center">Loading questionnaire...</div>
        </CardContent>
      </Card>
    )
  }

  if (!topic || questions.length === 0) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="pt-6">
          <div className="text-center">No questions found for this topic.</div>
        </CardContent>
      </Card>
    )
  }

  const currentQuestion = questions[currentQuestionIndex]
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100
  const isLastQuestion = currentQuestionIndex === questions.length - 1

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{topic.title}</CardTitle>
            <CardDescription>{topic.description}</CardDescription>
          </div>
          <div className="text-sm text-muted-foreground">
            {currentQuestionIndex + 1} of {questions.length}
          </div>
        </div>
        <Progress value={progress} className="w-full" />
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="text-lg font-medium mb-4">{currentQuestion.question_text}</h3>
          {currentQuestion.is_required && (
            <p className="text-sm text-muted-foreground mb-4">* This question is required</p>
          )}
          {renderQuestion(currentQuestion)}
        </div>

        <div className="flex justify-between">
          <Button variant="outline" onClick={handlePrevious} disabled={currentQuestionIndex === 0}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>

          {isLastQuestion ? (
            <Button onClick={handleSubmit} disabled={!canProceed() || isSubmitting}>
              {isSubmitting ? (
                "Submitting..."
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Complete
                </>
              )}
            </Button>
          ) : (
            <Button onClick={handleNext} disabled={!canProceed()}>
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
