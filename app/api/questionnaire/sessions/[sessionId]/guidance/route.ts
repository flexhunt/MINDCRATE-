import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { generateText } from "ai"
import { xai } from "@ai-sdk/xai"

export async function POST(request: NextRequest, { params }: { params: { sessionId: string } }) {
  try {
    console.log("[v0] Guidance POST - sessionId:", params.sessionId)

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

    // Get request body
    const body = await request.json()
    const { question, analysis, insights } = body

    console.log("[v0] Guidance request for question:", question)

    // Generate AI guidance
    let guidance = ""

    try {
      console.log("[v0] Generating AI guidance...")

      const { text } = await generateText({
        model: xai("grok-4"),
        prompt: `Based on this psychological analysis and the user's specific question, provide helpful, actionable guidance.

Analysis: ${analysis}
Key Insights: ${insights.join(", ")}
User's Question: ${question}

Provide a thoughtful, practical response that:
1. Directly addresses their question
2. References specific insights from their analysis
3. Offers 2-3 concrete, actionable steps they can take
4. Is encouraging and supportive
5. Is 150-200 words

Format as plain text, no markdown.`,
      })

      guidance = text.trim()
      console.log("[v0] AI guidance generated successfully")
    } catch (error: any) {
      console.log("[v0] Error generating AI guidance:", error)

      // Provide fallback guidance
      guidance = `Thank you for your question about "${question}". Based on your analysis results, here are some thoughts:

Your responses show valuable self-awareness and insight into your psychological patterns. This is a strong foundation for personal growth and development.

Here are some actionable steps you can consider:
1. Reflect on the key insights from your analysis and identify which ones resonate most strongly with you
2. Choose one specific area for improvement and create a small, manageable daily practice around it
3. Consider keeping a brief journal to track your progress and observations over time

Remember that psychological growth is a gradual process. Be patient with yourself and celebrate small improvements along the way. Your willingness to engage with this analysis shows you're already on a positive path forward.`
    }

    return NextResponse.json({ guidance })
  } catch (error: any) {
    console.error("[v0] Error in guidance endpoint:", error)
    return NextResponse.json({ error: "Failed to generate guidance" }, { status: 500 })
  }
}
