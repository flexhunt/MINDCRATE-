import { cookies } from "next/headers"
import { createClient } from "@/utils/supabase/server"

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim()
    .substring(0, 60)
}

async function refreshGoogleToken() {
  try {
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        refresh_token: process.env.GOOGLE_REFRESH_TOKEN!,
        grant_type: "refresh_token",
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Google token refresh failed:", errorText)
      throw new Error(`Failed to refresh Google token: ${response.status} ${errorText}`)
    }

    const data = await response.json()

    if (!data.access_token) {
      throw new Error("No access token received from Google")
    }

    return data.access_token
  } catch (error) {
    console.error("Error refreshing Google token:", error)
    throw error
  }
}

async function postToBlogger(title: string, slug: string, summary: string, accessToken: string) {
  try {
    // Create a more comprehensive redirect page with SEO optimization
    const redirectHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - MindCrate</title>
    <meta name="description" content="${summary}">
    <meta name="robots" content="index, follow">
    <meta property="og:title" content="${title}">
    <meta property="og:description" content="${summary}">
    <meta property="og:url" content="https://mindcrate.vercel.app/articles/${slug}">
    <meta property="og:type" content="article">
    <meta property="og:site_name" content="MindCrate">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${title}">
    <meta name="twitter:description" content="${summary}">
    <link rel="canonical" href="https://mindcrate.vercel.app/articles/${slug}">
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background: #f8fafc;
            color: #334155;
        }
        .container {
            background: white;
            padding: 40px;
            border-radius: 12px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            text-align: center;
        }
        .logo {
            font-size: 2rem;
            font-weight: bold;
            color: #3b82f6;
            margin-bottom: 20px;
        }
        .title {
            font-size: 1.5rem;
            font-weight: 600;
            margin-bottom: 15px;
            color: #1e293b;
        }
        .description {
            color: #64748b;
            margin-bottom: 30px;
            line-height: 1.6;
        }
        .redirect-btn {
            display: inline-block;
            background: #3b82f6;
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            text-decoration: none;
            font-weight: 500;
            transition: background 0.2s;
        }
        .redirect-btn:hover {
            background: #2563eb;
        }
        .loading {
            margin-top: 20px;
            color: #64748b;
        }
    </style>
    <script>
        // Immediate redirect
        setTimeout(function() {
            window.location.href = "https://mindcrate.vercel.app/articles/${slug}";
        }, 100);
        
        // Fallback redirect after 3 seconds
        setTimeout(function() {
            if (window.location.href.indexOf('mindcrate.vercel.app') === -1) {
                window.location.href = "https://mindcrate.vercel.app/articles/${slug}";
            }
        }, 3000);
    </script>
    <noscript>
        <meta http-equiv="refresh" content="0; url=https://mindcrate.vercel.app/articles/${slug}" />
    </noscript>
</head>
<body>
    <div class="container">
        <div class="logo">🧠 MindCrate</div>
        <h1 class="title">${title}</h1>
        <p class="description">${summary}</p>
        <a href="https://mindcrate.vercel.app/articles/${slug}" class="redirect-btn">
            Read Full Article on MindCrate
        </a>
        <div class="loading">
            <p>Redirecting you to the full article...</p>
        </div>
    </div>
</body>
</html>
    `.trim()

    // Enhanced blog post with better SEO
    const blogPost = {
      title: `${title} - Read on MindCrate`,
      content: redirectHtml,
      labels: ["mindcrate", "personal-development", "mindset", "self-improvement", "productivity", "learning"],
    }

    console.log("Posting to Blogger with blog ID:", process.env.BLOG_ID)
    console.log("Post title:", blogPost.title)

    const response = await fetch(`https://www.googleapis.com/blogger/v3/blogs/${process.env.BLOG_ID}/posts`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(blogPost),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Blogger API error:", {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
      })
      throw new Error(`Failed to post to Blogger: ${response.status} ${errorText}`)
    }

    const data = await response.json()
    console.log("Successfully posted to Blogger:", data.url)

    return data.url
  } catch (error) {
    console.error("Error posting to Blogger:", error)
    throw error
  }
}

export async function generateArticle(topic: string, userId: string, customTags: string[] = []) {
  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "https://mindcrate.vercel.app",
        "X-Title": "MindCrate Article Generator",
      },
      body: JSON.stringify({
        model: "anthropic/claude-3-haiku:beta",
        messages: [
          {
            role: "system",
            content: `You are a professional content writer who creates engaging, easy-to-read articles for MindCrate. Write in clear, simple language that anyone can understand.

**WRITING STYLE:**
- Use simple, everyday words that everyone understands
- Write like you're explaining to a smart friend
- Be helpful and genuinely informative
- Keep sentences short and clear
- Use examples people can relate to
- Be encouraging but realistic
- NO casual phrases like "yeah me too" or overly informal language
- Professional but approachable tone

**ARTICLE FORMAT:**

# [Clear, Compelling Title That People Want to Click]

[Start with a relatable opening that hooks the reader immediately]

[Brief overview of what they'll learn and why it matters]

---

## The Real Challenge

[Explain the problem in simple, clear terms]

> 💡 [Add a helpful insight or surprising fact]

[Give concrete examples people can understand and relate to]

---

## Why This Happens

### 1. 📱 [Clear reason with relevant emoji]
[Explain the cause without jargon or complex terms]

### 2. 🧠 [Second clear reason]
[Use everyday examples that make sense]

### 3. ⚡ [Third reason]
[Keep it practical and relatable]

---

## The Solution

[Simple introduction to what actually works]

---

## 🔧 Practical Steps

| Action | How to Do It |
|---|---|
| **📝 [Clear action name]** | [Step-by-step explanation anyone can follow] |
| **🎯 [Clear action name]** | [Specific, actionable instructions] |
| **💪 [Clear action name]** | [Practical advice that actually works] |

---

## Start Today

- **🌅 [Immediate action]**: [Quick, clear explanation of what to do]
- **🚶 [Simple step]**: [Easy to understand and implement]
- **📚 [Learning action]**: [Practical next step for growth]

---

## Key Takeaway

[Summarize the main point in one clear sentence]

> **[One powerful insight they can remember and use]**

---

**🎯 Do this right now:**

[One specific, simple action they can take in the next 5 minutes]

**CONTENT REQUIREMENTS:**
- 800-1200 words of genuine value
- Use words a 15-year-old would understand
- No business jargon or academic language
- Write in active voice
- Be helpful and supportive
- Make complex ideas simple
- Focus on practical, actionable advice
- Give real solutions, not just theory
- Be honest about what works and what doesn't
- Make readers feel understood and capable

Write content that genuinely helps people improve their lives.`,
          },
          {
            role: "user",
            content: `Write a comprehensive, helpful article about: ${topic}`,
          },
        ],
        temperature: 0.3,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`OpenRouter API error: ${error.error?.message || "Unknown error"}`)
    }

    const data = await response.json()
    const articleContent = data.choices[0].message.content

    const lines = articleContent.split("\n")
    const title = lines[0].replace(/^#\s+/, "").trim().replace(/[#*_]/g, "").trim()
    const slug = generateSlug(title)
    const summary =
      articleContent
        .replace(/[#*`]/g, "")
        .split("\n")
        .find((line) => line.length > 50)
        ?.substring(0, 160) + "..." || ""
    const tags = customTags.length > 0 ? customTags : topic.split(",").map((tag) => tag.trim())
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://mindcrate.vercel.app"
    const coverImageUrl = `${baseUrl}/api/og?title=${encodeURIComponent(title)}`

    const cookieStore = cookies()
    const supabase = createClient(cookieStore)

    let article
    try {
      const { data, error } = await supabase
        .from("articles")
        .insert({
          title,
          slug,
          content: articleContent,
          summary,
          cover_image_url: coverImageUrl,
          is_published: true,
          user_id: userId,
          tags,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) throw error
      article = data
    } catch (e: any) {
      if (e?.message?.includes("summary")) {
        const { data, error } = await supabase
          .from("articles")
          .insert({
            title,
            slug,
            content: articleContent,
            cover_image_url: coverImageUrl,
            is_published: true,
            user_id: userId,
            tags,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select()
          .single()
        if (error) throw error
        article = data
      } else {
        throw e
      }
    }

    // Try to post to Blogger, but don't fail the entire operation if it fails
    let bloggerUrl = null
    try {
      console.log("Attempting to post to Blogger...")
      const accessToken = await refreshGoogleToken()
      bloggerUrl = await postToBlogger(title, slug, summary, accessToken)
      console.log("Successfully posted to Blogger:", bloggerUrl)
    } catch (bloggerError) {
      console.error("Failed to post to Blogger, but article was created successfully:", bloggerError)
      // Don't throw the error - just log it and continue
    }

    return { ...article, bloggerUrl }
  } catch (error) {
    console.error("Error generating article:", error)
    throw error
  }
}

/**
 * Generate a 10-question multiple-choice quiz about a topic using OpenRouter.
 */
async function generateQuiz(topic: string, levelNumber = 1): Promise<{ level: any; questions: any[] }> {
  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "https://mindcrate.vercel.app",
        "X-Title": "MindCrate Quiz Generator",
      },
      body: JSON.stringify({
        model: "anthropic/claude-3-haiku:beta",
        messages: [
          {
            role: "system",
            content: `You are an expert quiz creator for MindCrate learning platform.

Create **exactly 10** multiple-choice questions about the given topic for level ${levelNumber}.

**DIFFICULTY LEVELS:**
- Level 1-3: Basic/Beginner questions
- Level 4-6: Intermediate questions  
- Level 7-10: Advanced/Expert questions

**FORMAT MUST BE EXACTLY:**

### Quiz Level ${levelNumber} – ${topic}

**Q1:** [Clear, specific question text]
a) [Option A - make it realistic]
b) [Option B - make it realistic] 
c) [Option C - make it realistic]
d) [Option D - make it realistic]
**Answer:** a

**Q2:** [Next question]
a) [Option A]
b) [Option B]
c) [Option C] 
d) [Option D]
**Answer:** b

[Continue for Q3-Q10...]

**RULES:**
- Questions must be educational and valuable
- Four realistic options per question
- Only ONE correct answer per question
- Answer must be exactly: a, b, c, or d (lowercase)
- Make wrong answers plausible but clearly incorrect
- Adjust difficulty based on level number
- No extra commentary or explanations
- Questions should test real understanding, not just memorization`,
          },
          {
            role: "user",
            content: `Create a Level ${levelNumber} quiz about: ${topic}`,
          },
        ],
        temperature: 0.3,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`OpenRouter API error: ${error.error?.message || "Unknown error"}`)
    }

    const data = await response.json()
    const quizContent = data.choices[0].message.content

    // Parse the quiz content to extract level and questions
    const lines = quizContent.split("\n").filter((line) => line.trim())

    // Extract title for level
    const titleLine = lines.find((line) => line.startsWith("### Quiz Level"))
    const title = titleLine ? titleLine.replace("### Quiz Level ", "").replace(`${levelNumber} – `, "") : topic

    // Create level object
    const level = {
      level_number: levelNumber,
      title: title,
      description: `Level ${levelNumber} quiz about ${topic}`,
      difficulty: levelNumber <= 3 ? "beginner" : levelNumber <= 6 ? "intermediate" : "advanced",
    }

    // Parse questions
    const questions = []
    let currentQuestion = null

    for (const line of lines) {
      if (line.match(/^\*\*Q\d+:\*\*/)) {
        if (currentQuestion) {
          questions.push(currentQuestion)
        }
        currentQuestion = {
          question_text: line.replace(/^\*\*Q\d+:\*\*\s*/, ""),
          options: [],
          correct_answer: "",
        }
      } else if (line.match(/^[a-d]\)/)) {
        if (currentQuestion) {
          currentQuestion.options.push(line.substring(3).trim())
        }
      } else if (line.match(/^\*\*Answer:\*\*/)) {
        if (currentQuestion) {
          const answer = line.replace("**Answer:**", "").trim()
          if (["a", "b", "c", "d"].includes(answer)) {
            currentQuestion.correct_answer = answer
          } else {
            throw new Error(`Invalid answer format: ${answer}. Must be a, b, c, or d`)
          }
        }
      }
    }

    // Add the last question
    if (currentQuestion && currentQuestion.options.length === 4 && currentQuestion.correct_answer) {
      questions.push(currentQuestion)
    }

    // Validate we have exactly 10 questions
    if (questions.length !== 10) {
      throw new Error(`Expected 10 questions, got ${questions.length}`)
    }

    // Validate each question has 4 options and a valid answer
    for (const q of questions) {
      if (q.options.length !== 4) {
        throw new Error(`Question "${q.question_text}" has ${q.options.length} options, expected 4`)
      }
      if (!["a", "b", "c", "d"].includes(q.correct_answer)) {
        throw new Error(`Invalid answer format for question "${q.question_text}": ${q.correct_answer}`)
      }
    }

    return { level, questions }
  } catch (error) {
    console.error("Error generating quiz:", error)
    throw error
  }
}

export { generateQuiz }
