"use client"

import { AnalysisResults } from "@/components/questionnaire/analysis-results"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, AlertCircle } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"

interface ResultsPageProps {
  params: {
    sessionId: string
  }
}

export default function ResultsPage({ params }: ResultsPageProps) {
  const [sessionExists, setSessionExists] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if session exists
    const checkSession = async () => {
      try {
        const response = await fetch(`/api/questionnaire/sessions/${params.sessionId}/analysis`)
        setSessionExists(response.ok)
      } catch (error) {
        setSessionExists(false)
      } finally {
        setIsLoading(false)
      }
    }

    checkSession()
  }, [params.sessionId])

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button variant="ghost" asChild>
            <Link href="/questionnaire">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Questionnaires
            </Link>
          </Button>
        </div>
        <Card className="w-full max-w-4xl mx-auto">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-2">Loading session...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (sessionExists === false) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button variant="ghost" asChild>
            <Link href="/questionnaire">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Questionnaires
            </Link>
          </Button>
        </div>
        <Card className="w-full max-w-4xl mx-auto">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2 text-destructive">
              <AlertCircle className="h-6 w-6" />
              Session Not Found
            </CardTitle>
            <CardDescription>
              The questionnaire session you're looking for doesn't exist or you don't have access to it.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">This could happen if:</p>
            <ul className="text-sm text-muted-foreground space-y-1 max-w-md mx-auto">
              <li>• The session ID is incorrect</li>
              <li>• The session was deleted</li>
              <li>• You don't have permission to view this session</li>
              <li>• The session hasn't been completed yet</li>
            </ul>
            <div className="pt-4">
              <Button asChild>
                <Link href="/questionnaire">Take a New Questionnaire</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Button variant="ghost" asChild>
          <Link href="/questionnaire">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Questionnaires
          </Link>
        </Button>
      </div>
      <AnalysisResults sessionId={params.sessionId} />
    </div>
  )
}
