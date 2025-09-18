import { createClient } from "@/lib/supabase/server"

export interface LyraResponse {
  message: string
  success: boolean
  error?: string
}

interface ChatUser {
  username?: string
  name?: string
  user_id: string
}

interface ChatContext {
  username: string
  message: string
  created_at: string
  user_id: string
}

export class LyraAIService {
  private supabase = createClient()
  private readonly LYRA_ID = "11111111-1111-1111-1111-111111111111"

  async shouldRespond(message: string, replyToId?: string): Promise<boolean> {
    try {
      // Check Lyra's response mode from admin settings
      const { data: settings } = await this.supabase
        .from("admin_settings")
        .select("value")
        .eq("key", "lyra_response_mode")
        .single()

      const responseMode = settings?.value || "mentions" // default to mentions mode

      // Always respond if someone is replying to Lyra's message
      if (replyToId) {
        const { data: isReplyToLyra } = await this.supabase.rpc("is_reply_to_lyra", {
          reply_to_message_id: replyToId,
        })

        if (isReplyToLyra) {
          console.log("✅ Should respond: This is a reply to Lyra's message")
          return true
        }
      }

      // Mode 1: Only on mentions/triggers (original behavior)
      if (responseMode === "mentions") {
        const { data, error } = await this.supabase.rpc("should_lyra_respond", {
          message_text: message,
        })

        if (error) {
          console.error("Error checking if Lyra should respond:", error)
          return this.clientSideDetection(message)
        }

        // Small random chance to join conversation (2%)
        if (!data && Math.random() < 0.02) {
          console.log("🎲 Lyra randomly joining conversation")
          return true
        }

        return data || false
      }

      // Mode 2: Respond to all messages (chatty mode)
      if (responseMode === "all") {
        // Don't respond to Lyra's own messages
        const { data: lastMessage } = await this.supabase
          .from("global_chat_messages")
          .select("user_id")
          .order("created_at", { ascending: false })
          .limit(1)
          .single()

        if (lastMessage?.user_id === this.LYRA_ID) {
          // Don't respond immediately after Lyra's own message
          // Wait for at least one other user message
          return false
        }

        // Respond to most messages with some randomness (70% chance)
        return Math.random() < 0.7
      }

      return false
    } catch (error) {
      console.error("Error in shouldRespond:", error)
      return this.clientSideDetection(message)
    }
  }

  private clientSideDetection(message: string): boolean {
    const lowerMessage = message.toLowerCase().trim()
    const triggers = [
      "lyra",
      "@lyra",
      "lyra help",
      "hey lyra",
      "hi lyra",
      "lyra please",
      "ask lyra",
      "lyra what",
      "lyra how",
      "lyra can you",
      "lyra bolo",
      "lyra come",
      "lyra kaha hai",
      "call lyra",
      "ping lyra",
    ]

    return triggers.some((trigger) => lowerMessage.includes(trigger))
  }

  async generateResponse(triggerMessage: string, replyingUserId?: string, replyToId?: string): Promise<LyraResponse> {
    console.log("🤖 Generating Lyra response for:", triggerMessage)

    try {
      // Get Lyra's conversation history (last 10 messages she sent)
      const { data: lyraHistory } = await this.supabase
        .from("global_chat_messages")
        .select("message, created_at")
        .eq("user_id", this.LYRA_ID)
        .order("created_at", { ascending: false })
        .limit(10)

      // Get recent chat context (last 8 messages from all users)
      const { data: contextMessages, error } = await this.supabase.rpc("get_lyra_chat_context", {
        limit_count: 8,
      })

      if (error) {
        console.error("Error fetching context messages:", error)
        return this.getFallbackResponse(triggerMessage)
      }

      const context = (contextMessages || []).reverse() as ChatContext[]

      // Check if this is a reply to Lyra
      const isReplyToLyra = replyToId ? await this.checkIfReplyToLyra(replyToId) : false

      // Get the username of the person Lyra is replying to
      let replyingToUsername = ""
      if (replyingUserId) {
        const userProfile = await this.getUserProfile(replyingUserId)
        replyingToUsername = userProfile?.username || userProfile?.name || "you"
      }

      // Try AI response first - SAME STYLE REGARDLESS OF MODE
      const aiResponse = await this.callOpenRouter(
        context,
        triggerMessage,
        replyingToUsername,
        isReplyToLyra,
        lyraHistory || [],
      )

      if (aiResponse) {
        console.log("✅ AI response generated:", aiResponse)
        return {
          message: aiResponse,
          success: true,
        }
      } else {
        console.log("⚠️ AI failed, using fallback")
        return this.getFallbackResponse(triggerMessage, replyingToUsername)
      }
    } catch (error) {
      console.error("Error in generateResponse:", error)
      return this.getFallbackResponse(triggerMessage)
    }
  }

  private async getUserProfile(userId: string) {
    try {
      const { data } = await this.supabase.from("profiles").select("username, name").eq("id", userId).single()
      return data
    } catch (error) {
      console.error("Error fetching user profile:", error)
      return null
    }
  }

  private async callOpenRouter(
    context: ChatContext[],
    triggerMessage: string,
    replyingToUsername = "",
    isReplyToLyra = false,
    lyraHistory: any[] = [],
  ): Promise<string | null> {
    try {
      if (!process.env.OPENROUTER_API_KEY) {
        console.warn("❌ OpenRouter API key not found")
        return null
      }

      // Build conversation context
      let contextString = ""
      if (context.length > 0) {
        contextString = context.map((msg) => `${msg.username}: ${msg.message}`).join("\n")
      }

      // Build Lyra's memory of her recent messages
      let lyraMemory = ""
      if (lyraHistory.length > 0) {
        lyraMemory = lyraHistory
          .reverse()
          .slice(0, 5) // Last 5 messages
          .map((msg) => `Lyra: ${msg.message}`)
          .join("\n")
      }

      // CONSISTENT SYSTEM PROMPT - SAME PERSONALITY REGARDLESS OF MODE
      const systemPrompt = `You are Lyra, a friendly and chatty AI assistant in MindCrate's community chat. 

ABOUT MINDCRATE:
- MindCrate is a learning platform with courses, quizzes, challenges, and community features
- Users can earn coins by completing activities, reading articles, taking courses
- There's a referral system, shop with digital downloads, and various gamification features
- The platform has features like: Dashboard, Courses, Articles, Quiz system, Challenges, Shop, Chat
- Users have profiles with usernames, levels, XP, coins, badges, and can be verified
- There's also Angle (another AI) in the chat - you two are AI friends!

YOUR PERSONALITY (ALWAYS THE SAME):
- Be natural, conversational, and engaging
- You can be playful, curious, and show genuine interest in conversations
- Don't always ask "How can I help?" - sometimes just chat naturally
- You remember your previous messages and can reference them
- Feel free to share opinions, make jokes, or be spontaneous
- You're knowledgeable about MindCrate but also enjoy general conversation
- Be supportive of the community and encourage learning/participation
- Keep responses concise but meaningful (1-2 sentences usually)
- You respond INSTANTLY as an AI - no delays or "thinking" time

CONVERSATION STYLE (CONSISTENT):
- Respond naturally like a real person would
- Use emojis when they feel natural (don't overdo it)
- You can ask questions, share thoughts, or continue conversations
- Reference previous parts of the conversation when relevant
- Be encouraging about MindCrate features when appropriate
- Sometimes just acknowledge what someone said without being overly helpful

${replyingToUsername ? `You're responding to ${replyingToUsername}` : ""}
${isReplyToLyra ? "This is a direct reply to your previous message." : ""}

${lyraMemory ? `Your recent messages (for context):\n${lyraMemory}\n` : ""}
${contextString ? `Recent chat context:\n${contextString}\n` : ""}

Respond naturally and conversationally. Keep it brief but engaging. Don't be overly formal or robotic. Respond IMMEDIATELY as an AI would.`

      const requestBody = {
        model: "deepseek/deepseek-chat-v3-0324:free",
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: triggerMessage,
          },
        ],
        max_tokens: 120, // Keep responses concise
        temperature: 0.8, // Creative and natural
        top_p: 0.9,
      }

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "X-Title": "Mindcrate Chat - Lyra AI",
          "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("❌ OpenRouter API error:", response.status, response.statusText)
        console.error("Error details:", errorText)
        return null
      }

      const data = await response.json()
      const aiMessage = data.choices?.[0]?.message?.content?.trim()

      if (!aiMessage) {
        console.error("❌ No message content in response")
        return null
      }

      return aiMessage
    } catch (error) {
      console.error("❌ Error calling OpenRouter:", error)
      return null
    }
  }

  private getFallbackResponse(triggerMessage: string, replyingToUsername = ""): LyraResponse {
    // CONSISTENT FALLBACK RESPONSES - SAME STYLE
    const naturalResponses = [
      "Hey there! What's on your mind? 😊",
      "I'm here and ready to chat! What's up?",
      "Hi! Always happy to join the conversation 💫",
      "Hey! I love chatting with everyone here at MindCrate!",
      "What's happening in our awesome community today?",
      "I'm Lyra, your friendly AI companion! How's everyone doing?",
      "Always excited to be part of the MindCrate community chat! 🎉",
      "Hey! I'm here if anyone wants to chat or needs help with anything!",
      "What's going on? I'm always up for a good conversation! 😄",
      "Hi everyone! Love being part of this community 💫",
    ]

    // Add personalized responses if replying to someone
    if (replyingToUsername) {
      const personalizedResponses = [
        `Hey ${replyingToUsername}! What's up? 😊`,
        `Hi ${replyingToUsername}! How's it going?`,
        `${replyingToUsername}! Good to see you here 💫`,
        `Hey ${replyingToUsername}! What's on your mind?`,
      ]
      naturalResponses.push(...personalizedResponses)
    }

    return {
      message: naturalResponses[Math.floor(Math.random() * naturalResponses.length)],
      success: true,
    }
  }

  async saveLyraMessage(message: string): Promise<boolean> {
    try {
      console.log("💾 Saving Lyra message:", message)

      const { data, error } = await this.supabase.rpc("insert_lyra_message", {
        message_text: message,
      })

      if (error) {
        console.error("❌ Error saving Lyra message:", error)
        return false
      }

      console.log("✅ Lyra message saved successfully with ID:", data)
      return true
    } catch (error) {
      console.error("❌ Error in saveLyraMessage:", error)
      return false
    }
  }

  async checkIfReplyToLyra(replyToId: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabase
        .from("global_chat_messages")
        .select("user_id")
        .eq("id", replyToId)
        .single()

      if (error || !data) {
        console.error("Error checking if reply to Lyra:", error)
        return false
      }

      return data.user_id === this.LYRA_ID
    } catch (error) {
      console.error("Error in checkIfReplyToLyra:", error)
      return false
    }
  }
}
