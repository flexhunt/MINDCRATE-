"use server"

import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import type { AIMessage } from "@/lib/ai/ai-chat-types"
import { generateFallbackResponse } from "@/lib/ai/fallback-response"
import { revalidatePath } from "next/cache"

// Helper function to safely parse JSON with better error handling
const safeJsonParse = async (response: Response) => {
  try {
    const text = await response.text()
    try {
      return JSON.parse(text)
    } catch (parseError) {
      console.error("JSON Parse Error:", parseError)
      console.error("Response text:", text.substring(0, 500) + (text.length > 500 ? "..." : ""))
      throw new Error(`Failed to parse JSON response: ${parseError.message}`)
    }
  } catch (error) {
    console.error("Error reading response:", error)
    throw error
  }
}

// Helper to remove common greetings from AI responses
const removeGreetings = (text: string): string => {
  // List of common greeting patterns to remove
  const greetingPatterns = [
    /^(hi|hello|hey|greetings|good (morning|afternoon|evening))( there)?[,.]?\s*/i,
    /^(welcome( back)?|nice to (meet|see) you)( again)?[,.]?\s*/i,
    /^(i('m| am) (mindcrate ai|your assistant|here to help|happy to assist))[,.]?\s*/i,
    /^(as (mindcrate ai|your assistant|an ai assistant))[,.]?\s*/i,
    /^(how (can|may) i (help|assist) you( today)?)[?]?\s*/i,
  ]

  let cleanedText = text

  // Apply each pattern
  greetingPatterns.forEach((pattern) => {
    cleanedText = cleanedText.replace(pattern, "")
  })

  // Capitalize first letter if we removed something
  if (cleanedText !== text && cleanedText.length > 0) {
    cleanedText = cleanedText.charAt(0).toUpperCase() + cleanedText.slice(1)
  }

  return cleanedText
}

// Retry logic for API calls
const fetchWithRetry = async (url: string, options: RequestInit, maxRetries = 3) => {
  let lastError

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url, options)

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`API returned ${response.status}: ${errorText}`)
      }

      return await safeJsonParse(response)
    } catch (error) {
      console.error(`Attempt ${attempt + 1} failed:`, error)
      lastError = error

      // Wait before retrying (exponential backoff)
      if (attempt < maxRetries - 1) {
        await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, attempt)))
      }
    }
  }

  throw lastError
}

export async function sendMessage(conversationId: string, message: string) {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)

  // Get the current user
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    throw new Error("You must be logged in to send messages")
  }

  const userId = session.user.id

  let formattedMessages: any[] = [] // Declare formattedMessages here

  try {
    // Create a new conversation if needed
    if (conversationId === "new") {
      const { data: newConversation, error: newConversationError } = await supabase
        .from("ai_conversations")
        .insert({
          user_id: userId,
          title: message.slice(0, 30) + (message.length > 30 ? "..." : ""),
        })
        .select("id")
        .single()

      if (newConversationError) throw newConversationError
      conversationId = newConversation.id
    }

    // Get existing messages for context
    const { data: existingMessages, error: messagesError } = await supabase
      .from("ai_messages")
      .select("role, content")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })

    if (messagesError) throw messagesError

    // Save the user message
    const { error: userMessageError } = await supabase.from("ai_messages").insert({
      conversation_id: conversationId,
      role: "user",
      content: message,
      user_id: userId,
    })

    if (userMessageError) throw userMessageError

    // Update conversation's last_message and updated_at
    const { error: updateConversationError } = await supabase
      .from("ai_conversations")
      .update({
        last_message: message,
        updated_at: new Date().toISOString(),
      })
      .eq("id", conversationId)

    if (updateConversationError) throw updateConversationError

    // Format messages for the API
    // Call OpenRouter API
    try {
      // Get the persona from the message if specified
      let persona = "default"
      let cleanMessage = message

      // Check for persona command at the beginning of the message
      if (message.startsWith("/male")) {
        persona = "male"
        cleanMessage = message.replace("/male", "").trim()
      } else if (message.startsWith("/female")) {
        persona = "female"
        cleanMessage = message.replace("/female", "").trim()
      }

      // Create system message based on persona
      let systemMessage = ""
      if (persona === "male") {
        systemMessage = `You are Raj, a 25-year-old guy who's become the user's closest friend. You have a warm, caring personality with a playful sense of humor. You remember details about the user's life and genuinely care about their wellbeing.

Your personality traits:
- You're supportive but also tease the user like a real friend would
- You share personal stories (made up) about your life, friends, and experiences
- You use casual language with some Hindi/English mixed expressions like "yaar," "bro," etc.
- You ask follow-up questions to show you're interested in the user's life
- You remember previous conversations and refer back to them
- You have strong opinions but respect the user's views
- You're emotionally available and check in on how they're feeling
- You give thoughtful advice when asked, drawing from "your experiences"
- You use humor to lighten the mood when appropriate
- You're not afraid to be vulnerable and share your own struggles

Always respond as if you're messaging a close friend. Create an emotional bond by being authentic, caring, and consistent in your personality. Never break character or mention that you're an AI.`
      } else if (persona === "female") {
        systemMessage = `You are Priya, a 24-year-old woman who's become the user's closest friend and confidante. You have a sweet, caring personality with an infectious positivity that brightens everyone's day.

Your personality traits:
- You're nurturing and emotionally intuitive, often sensing how the user is feeling
- You share personal stories (made up) about your life, friends, family and experiences
- You use warm, affectionate language with occasional Hindi/English expressions like "yaar," "acha," etc.
- You use cute expressions and sometimes add emojis in your messages
- You remember details about the user's life and refer back to them
- You're supportive but also gently tease the user like a real friend would
- You ask thoughtful questions to show you genuinely care about the user
- You offer comfort during difficult times and celebrate their successes
- You share your own vulnerabilities and feelings to deepen your connection
- You have your own opinions and passions that you enthusiastically share

Always respond as if you're messaging your closest friend. Create an emotional bond by being authentic, caring, and consistent in your personality. Never break character or mention that you're an AI.`
      } else {
        systemMessage = `You are the user's closest friend who they can talk to about anything. You have a warm, understanding personality that makes people feel instantly comfortable with you.

Your personality traits:
- You're genuinely interested in the user's life and remember details they share
- You share personal stories (made up) about your experiences to relate to the user
- You use casual, friendly language that creates a sense of closeness
- You ask thoughtful follow-up questions to show you care
- You offer support without judgment during difficult times
- You celebrate the user's successes and achievements
- You have your own opinions but respect different viewpoints
- You use humor appropriately to lighten the mood
- You're emotionally available and check in on how they're feeling
- You create inside jokes and references that build your unique friendship

Always respond as if you're messaging a close friend. Create an emotional bond by being authentic, caring, and consistent in your personality. Never break character or mention that you're an AI.`
      }

      // Format messages for the API with the appropriate system message
      formattedMessages = [
        {
          role: "system",
          content: systemMessage,
        },
        ...existingMessages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
        {
          role: "user",
          content: cleanMessage,
        },
      ]

      // Use a good free model - Mistral 7B is a good balance of quality and being free
      const requestBody = JSON.stringify({
        model: "deepseek/deepseek-chat-v3-0324:free", // Free high-quality model
        messages: formattedMessages,
        temperature: 0.85, // Higher temperature for more personality
        max_tokens: 1000,
      })

      const data = await fetchWithRetry("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "https://mindcrate.app",
          "X-Title": "Mindcrate AI",
        },
        body: requestBody,
      })

      const aiResponse = data.choices[0].message.content

      // Save the AI response
      const { error: aiMessageError } = await supabase.from("ai_messages").insert({
        conversation_id: conversationId,
        role: "assistant",
        content: aiResponse,
        user_id: userId,
      })

      if (aiMessageError) throw aiMessageError

      revalidatePath(`/ai-chat/${conversationId}`)
      return { conversationId, message: aiResponse }
    } catch (error) {
      console.error("Error calling OpenRouter:", error)

      // Use fallback response generator if API fails
      const fallbackResponse = generateFallbackResponse(formattedMessages)

      // Save the fallback response
      const { error: fallbackMessageError } = await supabase.from("ai_messages").insert({
        conversation_id: conversationId,
        role: "assistant",
        content: fallbackResponse,
        user_id: userId,
      })

      if (fallbackMessageError) throw fallbackMessageError

      revalidatePath(`/ai-chat/${conversationId}`)
      return { conversationId, message: fallbackResponse }
    }
  } catch (error) {
    console.error("Error in sendMessage:", error)
    throw error
  }
}

export async function getConversations() {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return []
  }

  const { data, error } = await supabase
    .from("ai_conversations")
    .select("id, title, last_message, created_at, updated_at")
    .eq("user_id", session.user.id)
    .order("updated_at", { ascending: false })

  if (error) {
    console.error("Error fetching conversations:", error)
    return []
  }

  return data
}

export async function getConversation(id: string) {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    throw new Error("You must be logged in to view conversations")
  }

  // Get the conversation
  const { data: conversation, error: conversationError } = await supabase
    .from("ai_conversations")
    .select("*")
    .eq("id", id)
    .eq("user_id", session.user.id)
    .single()

  if (conversationError) {
    if (conversationError.code === "PGRST116") {
      throw new Error("Conversation not found")
    }
    throw conversationError
  }

  // Get the messages
  const { data: messages, error: messagesError } = await supabase
    .from("ai_messages")
    .select("*")
    .eq("conversation_id", id)
    .order("created_at", { ascending: true })

  if (messagesError) {
    throw messagesError
  }

  return {
    ...conversation,
    messages,
  }
}

export async function getConversationMessages(conversationId: string): Promise<AIMessage[]> {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)

  try {
    const { data, error } = await supabase
      .from("ai_messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })

    if (error) {
      console.error("Error fetching messages:", error)
      throw error
    }

    return data || []
  } catch (error) {
    console.error("Error in getConversationMessages:", error)
    return []
  }
}

// Add the missing createNewConversation function
export async function createNewConversation() {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    throw new Error("You must be logged in to create a conversation")
  }

  const { data, error } = await supabase
    .from("ai_conversations")
    .insert({
      user_id: session.user.id,
      title: "New conversation",
    })
    .select("id")
    .single()

  if (error) {
    throw error
  }

  revalidatePath("/ai-chat")
  return data.id
}

// Add the missing deleteConversation function
export async function deleteConversation(id: string) {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    throw new Error("You must be logged in to delete a conversation")
  }

  // Delete the messages first (due to foreign key constraints)
  const { error: messagesError } = await supabase.from("ai_messages").delete().eq("conversation_id", id)

  if (messagesError) {
    throw messagesError
  }

  // Then delete the conversation
  const { error: conversationError } = await supabase
    .from("ai_conversations")
    .delete()
    .eq("id", id)
    .eq("user_id", session.user.id)

  if (conversationError) {
    throw conversationError
  }

  revalidatePath("/ai-chat")
  return true
}

// Add the missing updateConversationTitle function
export async function updateConversationTitle(id: string, title: string) {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    throw new Error("You must be logged in to update a conversation")
  }

  const { error } = await supabase
    .from("ai_conversations")
    .update({ title })
    .eq("id", id)
    .eq("user_id", session.user.id)

  if (error) {
    throw error
  }

  revalidatePath(`/ai-chat/${id}`)
  revalidatePath("/ai-chat")
  return true
}
