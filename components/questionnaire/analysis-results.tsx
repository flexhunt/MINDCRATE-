"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Brain, Lightbulb, Target, BookOpen, Loader2, RefreshCw, MessageCircle, ChevronRight } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface AnalysisResultsProps {
  sessionId: string
}

interface AnalysisData {
  analysis: string
  insights: string[]
  topic: {
    title: string
    description: string
    category: string
  }
  baseExplanation: {
    explanation_title: string
    explanation_content: string
    psychological_concepts: string[]
    related_theories: string[]
    practical_applications: string[]
  }
}

export function AnalysisResults({ sessionId }: AnalysisResultsProps) {
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null)
  const [guidance, setGuidance] = useState<string>("")
  const [isLoadingGuidance, setIsLoadingGuidance] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadAnalysis()
  }, [sessionId])

  const loadAnalysis = async () => {
    try {
      console.log("[v0] Loading analysis for sessionId:", sessionId)
      const response = await fetch(`/api/questionnaire/sessions/${sessionId}/analysis`)
      console.log("[v0] GET response status:", response.status)
      const data = await response.json()
      console.log("[v0] GET response data:", data)

      if (!response.ok) {
        throw new Error(data.error || "Failed to load analysis")
      }

      setAnalysisData(data)
    } catch (error: any) {
      console.error("Error loading analysis:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to load analysis",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const generateAnalysis = async () => {
    setIsGenerating(true)

    try {
      console.log("[v0] Generating analysis for sessionId:", sessionId)
      const response = await fetch(`/api/questionnaire/sessions/${sessionId}/analysis`, {
        method: "POST",
      })
      console.log("[v0] POST response status:", response.status)
      const data = await response.json()
      console.log("[v0] POST response data:", data)

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate analysis")
      }

      setAnalysisData(data)
      toast({
        title: "Analysis generated",
        description: "Your personalized psychological analysis is ready",
      })
    } catch (error: any) {
      console.error("Error generating analysis:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to generate analysis",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const formatAnalysisText = (text: string) => {
    // Split by headers and format
    const sections = text.split(/(?=\*\*[^*]+\*\*|#{1,3}\s)/g).filter(Boolean)

    return sections.map((section, index) => {
      // Check if it's a header
      if (section.startsWith("**") && section.includes("**:")) {
        const [header, ...content] = section.split(":")
        const cleanHeader = header.replace(/\*\*/g, "")
        const cleanContent = content.join(":").trim()

        return (
          <div key={index} className="mb-6">
            <h3 className="text-lg font-semibold mb-3 text-primary">{cleanHeader}</h3>
            <div className="text-muted-foreground leading-relaxed whitespace-pre-line">{cleanContent}</div>
          </div>
        )
      }

      // Regular content
      return (
        <div key={index} className="mb-4 text-muted-foreground leading-relaxed whitespace-pre-line">
          {section.trim()}
        </div>
      )
    })
  }

  const generateContextualQuestions = (analysis: string, insights: string[]): string[] => {
    // Extract key themes from analysis and insights to generate relevant questions
    const questions = [
      "How can I apply these insights to improve my daily relationships?",
      "What specific steps can I take to work on my areas for growth?",
      "How do these results compare to my own self-perception?",
    ]

    // Customize questions based on analysis content
    if (analysis.toLowerCase().includes("stress") || analysis.toLowerCase().includes("anxiety")) {
      questions[1] = "What are the most effective ways to manage stress based on my personality type?"
    }

    if (analysis.toLowerCase().includes("communication") || analysis.toLowerCase().includes("social")) {
      questions[0] = "How can I improve my communication style based on these insights?"
    }

    if (analysis.toLowerCase().includes("goal") || analysis.toLowerCase().includes("motivation")) {
      questions[2] = "How can I use these insights to set and achieve better personal goals?"
    }

    return questions
  }

  const getGuidance = async (question: string) => {
    if (!analysisData) return

    setSelectedQuestion(question)
    setIsLoadingGuidance(true)
    setGuidance("")

    try {
      const response = await fetch(`/api/questionnaire/sessions/${sessionId}/guidance`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question,
          analysis: analysisData.analysis,
          insights: analysisData.insights,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to get guidance")
      }

      setGuidance(data.guidance)
    } catch (error: any) {
      console.error("Error getting guidance:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to get guidance",
        variant: "destructive",
      })
    } finally {
      setIsLoadingGuidance(false)
    }
  }

  if (isLoading) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin mr-2" />
            <span>Loading your analysis...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!analysisData?.analysis) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <Brain className="h-6 w-6" />
            Generate Your Psychological Analysis
          </CardTitle>
          <CardDescription>
            Get personalized insights and explanations based on your questionnaire responses
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            Your responses have been saved. Click below to generate a comprehensive psychological analysis using AI.
          </p>
          <Button onClick={generateAnalysis} disabled={isGenerating} size="lg">
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Analysis...
              </>
            ) : (
              <>
                <Brain className="mr-2 h-4 w-4" />
                Generate Analysis
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-6 w-6" />
                {analysisData.topic.title} - Analysis Results
              </CardTitle>
              <CardDescription>{analysisData.topic.description}</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{analysisData.topic.category}</Badge>
              <Button variant="outline" size="sm" onClick={generateAnalysis} disabled={isGenerating}>
                <RefreshCw className="h-4 w-4 mr-1" />
                Regenerate
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Key Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            Key Insights
          </CardTitle>
          <CardDescription>Personalized insights based on your responses</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {analysisData.insights.map((insight, index) => (
              <div key={index} className="p-4 rounded-lg bg-muted/50 border-l-4 border-l-primary">
                <p className="text-sm leading-relaxed">{insight}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Analysis */}
      <Tabs defaultValue="personal" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="personal">Personal Analysis</TabsTrigger>
          <TabsTrigger value="concepts">Psychological Concepts</TabsTrigger>
          <TabsTrigger value="applications">Practical Applications</TabsTrigger>
          <TabsTrigger value="guidance">AI Guidance</TabsTrigger>
        </TabsList>

        <TabsContent value="personal">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Your Personalized Analysis
              </CardTitle>
              <CardDescription>AI-generated insights based on your specific responses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none dark:prose-invert">
                {formatAnalysisText(analysisData.analysis)}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="concepts">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Psychological Concepts
              </CardTitle>
              <CardDescription>Understanding the science behind your results</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {analysisData.baseExplanation && (
                <>
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Overview</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {analysisData.baseExplanation.explanation_content}
                    </p>
                  </div>

                  {analysisData.baseExplanation.psychological_concepts && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Key Concepts</h3>
                      <div className="flex flex-wrap gap-2">
                        {analysisData.baseExplanation.psychological_concepts.map((concept, index) => (
                          <Badge key={index} variant="outline">
                            {concept}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {analysisData.baseExplanation.related_theories && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Related Theories</h3>
                      <div className="flex flex-wrap gap-2">
                        {analysisData.baseExplanation.related_theories.map((theory, index) => (
                          <Badge key={index} variant="secondary">
                            {theory}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="applications">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Practical Applications
              </CardTitle>
              <CardDescription>How to apply these insights in your daily life</CardDescription>
            </CardHeader>
            <CardContent>
              {analysisData.baseExplanation?.practical_applications && (
                <div className="grid gap-4 md:grid-cols-2">
                  {analysisData.baseExplanation.practical_applications.map((application, index) => (
                    <div key={index} className="p-4 rounded-lg bg-muted/50">
                      <p className="text-sm leading-relaxed">{application}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="guidance">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                AI Guidance & Discussion
              </CardTitle>
              <CardDescription>
                Get personalized advice and explore your results further with AI-powered guidance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {!selectedQuestion ? (
                <div>
                  <h3 className="text-lg font-semibold mb-4">What would you like to explore?</h3>
                  <p className="text-muted-foreground mb-4">
                    Choose a question below to get personalized AI guidance based on your analysis results:
                  </p>
                  <div className="grid gap-3">
                    {generateContextualQuestions(analysisData.analysis, analysisData.insights).map(
                      (question, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          className="justify-between h-auto p-4 text-left bg-transparent"
                          onClick={() => getGuidance(question)}
                        >
                          <span className="text-sm leading-relaxed">{question}</span>
                          <ChevronRight className="h-4 w-4 ml-2 flex-shrink-0" />
                        </Button>
                      ),
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
                    <MessageCircle className="h-5 w-5 mt-0.5 text-primary" />
                    <div>
                      <h4 className="font-medium mb-1">Your Question:</h4>
                      <p className="text-sm text-muted-foreground">{selectedQuestion}</p>
                    </div>
                  </div>

                  {isLoadingGuidance ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mr-2" />
                      <span>Generating personalized guidance...</span>
                    </div>
                  ) : guidance ? (
                    <div className="p-4 bg-primary/5 rounded-lg border-l-4 border-l-primary">
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <Brain className="h-4 w-4" />
                        AI Guidance
                      </h4>
                      <p className="text-sm leading-relaxed whitespace-pre-line">{guidance}</p>
                    </div>
                  ) : null}

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedQuestion(null)
                        setGuidance("")
                      }}
                    >
                      Ask Another Question
                    </Button>
                    {guidance && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => getGuidance(selectedQuestion!)}
                        disabled={isLoadingGuidance}
                      >
                        <RefreshCw className="h-3 w-3 mr-1" />
                        Get New Response
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
