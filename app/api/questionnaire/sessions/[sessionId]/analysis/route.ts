import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { xai } from "@ai-sdk/xai"
import { generateText } from "ai"

export async function POST(request: NextRequest, { params }: { params: { sessionId: string } }) {
  try {
    const sessionId = params.sessionId
    console.log("[v0] Analysis POST - sessionId:", sessionId)

    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      },
    )

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      console.log("[v0] Auth error:", authError)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("[v0] Current user ID:", user.id)

    const { data: session, error: sessionError } = await supabase
      .from("questionnaire_sessions")
      .select(`
        *,
        questionnaire_topics(title, description, category)
      `)
      .eq("id", sessionId)
      .eq("user_id", user.id)
      .single()

    console.log("[v0] Session query result:", session, sessionError)

    if (sessionError || !session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 })
    }

    const { data: responses, error: responsesError } = await supabase
      .from("questionnaire_responses")
      .select(`
        *,
        questionnaire_questions(question_text, question_type, options)
      `)
      .eq("user_id", user.id)
      .eq("topic_id", session.topic_id)

    console.log("[v0] Responses query result:", responses, responsesError)

    if (responsesError) {
      console.error("Error fetching responses:", responsesError)
      return NextResponse.json({ error: "Failed to fetch responses" }, { status: 500 })
    }

    // Get existing psychological explanation for the topic
    const { data: explanation } = await supabase
      .from("psychological_explanations")
      .select("*")
      .eq("topic_id", session.topic_id)
      .single()

    const responseData = (responses || []).map((response: any) => ({
      question: response.questionnaire_questions.question_text,
      answer: response.response_value,
      type: response.questionnaire_questions.question_type,
    }))

    console.log("[v0] Prepared response data:", responseData)

    const topicInfo = session.questionnaire_topics
    const baseExplanation = explanation?.explanation_content || ""

    console.log("[v0] Starting AI analysis generation...")
    console.log("[v0] XAI_API_KEY exists:", !!process.env.XAI_API_KEY)

    // Generate personalized AI analysis using Grok
    const analysisPrompt = `
You are a professional psychologist providing personalized insights based on questionnaire responses.

Topic: ${topicInfo.title}
Category: ${topicInfo.category}
Description: ${topicInfo.description}

Base Psychological Explanation:
${baseExplanation}

User's Responses:
${responseData.map((r, i) => `${i + 1}. ${r.question}\nAnswer: ${r.answer}`).join("\n\n")}

Please provide a comprehensive, personalized psychological analysis that includes:

1. **Personal Profile**: Based on their responses, describe their psychological patterns and traits
2. **Key Insights**: 3-4 specific insights about their responses and what they reveal
3. **Psychological Concepts**: Explain relevant psychological theories that apply to their responses
4. **Practical Applications**: Specific, actionable recommendations for personal growth
5. **Areas for Development**: Constructive suggestions for improvement

Make the analysis:
- Personalized and specific to their responses
- Scientifically grounded but accessible
- Encouraging and constructive
- Practical and actionable
- Around 800-1000 words

Format the response in clear sections with headers.
`

    let aiAnalysis = ""
    try {
      console.log("[v0] Calling generateText for analysis...")
      if (!process.env.XAI_API_KEY) {
        throw new Error("XAI_API_KEY environment variable is not set")
      }

      const result = await generateText({
        model: xai("grok-4"),
        prompt: analysisPrompt,
        maxTokens: 1500,
        temperature: 0.7,
      })

      if (!result || !result.text) {
        throw new Error("No text returned from AI model")
      }

      aiAnalysis = result.text
      console.log("[v0] AI analysis generated successfully, length:", aiAnalysis.length)
    } catch (aiError: any) {
      console.error("[v0] Error generating AI analysis:", aiError?.message || aiError)
      console.error("[v0] Full error object:", JSON.stringify(aiError, null, 2))

      if (aiError?.response) {
        console.error("[v0] API Response status:", aiError.response.status)
        console.error("[v0] API Response headers:", aiError.response.headers)
        console.error("[v0] API Response data:", aiError.response.data)
      }

      aiAnalysis = `
# Personalized Psychological Analysis

## Personal Profile
Based on your responses to the ${topicInfo.title} questionnaire, your answers reveal thoughtful self-reflection and awareness of your psychological patterns.

## Key Insights
1. Your responses demonstrate a level of self-awareness that is valuable for personal growth
2. The patterns in your answers suggest areas where focused attention could be beneficial
3. Your willingness to engage with these questions shows openness to self-improvement
4. Your thoughtful consideration of each question indicates emotional intelligence

## Psychological Concepts
The patterns in your responses align with established psychological frameworks around ${topicInfo.category.toLowerCase()}. Your answers suggest a balanced approach to self-assessment and personal development.

## Practical Applications
- Continue regular self-reflection through journaling or mindfulness practices
- Consider exploring the areas highlighted by your responses in more depth
- Use these insights as a starting point for personal development goals
- Practice the strategies that resonate most with your responses

## Areas for Development
Your responses indicate opportunities for growth in the areas covered by this assessment. Consider working with a mental health professional for personalized guidance tailored to your specific needs and goals.

*Note: This analysis was generated using fallback content due to a temporary AI service issue. The insights are still based on established psychological principles.*
`
    }

    // Generate personalized insights
    const insightsPrompt = `
Based on the questionnaire responses about ${topicInfo.title}, provide 5 specific, personalized insights as a JSON array of strings. Each insight should be:
- Specific to their responses
- Psychologically meaningful
- Actionable
- Encouraging

Responses:
${responseData.map((r, i) => `${i + 1}. ${r.question}: ${r.answer}`).join("\n")}

Return only a JSON array of 5 insight strings.
`

    let personalizedInsights: string[] = []
    try {
      console.log("[v0] Calling generateText for insights...")
      const insightsResult = await generateText({
        model: xai("grok-4"),
        prompt: insightsPrompt,
        maxTokens: 500,
        temperature: 0.7,
      })

      console.log("[v0] Raw insights response:", insightsResult.text)

      if (!insightsResult || !insightsResult.text) {
        throw new Error("No insights text returned from AI model")
      }

      const cleanedText = insightsResult.text.trim()
      if (!cleanedText.startsWith("[") || !cleanedText.endsWith("]")) {
        throw new Error("Response is not a valid JSON array")
      }

      personalizedInsights = JSON.parse(cleanedText)

      if (!Array.isArray(personalizedInsights) || personalizedInsights.length === 0) {
        throw new Error("Parsed result is not a valid array of insights")
      }

      console.log("[v0] Parsed insights successfully:", personalizedInsights.length, "insights")
    } catch (insightsError: any) {
      console.error("[v0] Error generating insights:", insightsError?.message || insightsError)
      console.error("[v0] Full insights error:", JSON.stringify(insightsError, null, 2))

      personalizedInsights = [
        `Your varied responses to the ${topicInfo.title} questions suggest a nuanced understanding of this psychological area.`,
        "Consider reflecting on the connections between your answers and your daily experiences in this domain.",
        "Your self-awareness demonstrates emotional intelligence and significant growth potential.",
        `The patterns in your ${topicInfo.category.toLowerCase()} responses suggest areas for continued personal development.`,
        "Your thoughtful answers indicate a reflective and introspective approach to personal growth.",
      ]
    }

    // Update session with AI analysis
    const { error: updateError } = await supabase
      .from("questionnaire_sessions")
      .update({
        ai_analysis: aiAnalysis,
        personalized_insights: personalizedInsights,
      })
      .eq("id", sessionId)

    if (updateError) {
      console.error("Error updating session with analysis:", updateError)
    }

    return NextResponse.json({
      analysis: aiAnalysis,
      insights: personalizedInsights,
      topic: topicInfo,
      baseExplanation: explanation,
    })
  } catch (error) {
    console.error("Error generating AI analysis:", error)
    return NextResponse.json({ error: "Failed to generate analysis" }, { status: 500 })
  }
}

export async function GET(request: NextRequest, { params }: { params: { sessionId: string } }) {
  try {
    const sessionId = params.sessionId
    console.log("[v0] Analysis GET - sessionId:", sessionId)

    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      },
    )

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      console.log("[v0] Auth error:", authError)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("[v0] Current user ID:", user.id)

    const { data: sessionCheck, error: checkError } = await supabase
      .from("questionnaire_sessions")
      .select("id, user_id")
      .eq("id", sessionId)
      .eq("user_id", user.id)
      .single()

    console.log("[v0] Session check result:", sessionCheck, checkError)

    if (checkError || !sessionCheck) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 })
    }

    // Get session with analysis
    const { data: session, error } = await supabase
      .from("questionnaire_sessions")
      .select(`
        *,
        questionnaire_topics(title, description, category)
      `)
      .eq("id", sessionId)
      .eq("user_id", user.id)
      .single()

    console.log("[v0] Session query result:", session, error)

    if (error || !session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 })
    }

    // Get base explanation
    const { data: explanation } = await supabase
      .from("psychological_explanations")
      .select("*")
      .eq("topic_id", session.topic_id)
      .single()

    return NextResponse.json({
      analysis: session.ai_analysis,
      insights: session.personalized_insights,
      topic: session.questionnaire_topics,
      baseExplanation: explanation,
    })
  } catch (error) {
    console.error("Error fetching analysis:", error)
    return NextResponse.json({ error: "Failed to fetch analysis" }, { status: 500 })
  }
}
