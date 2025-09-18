// Simplified fallback response generator for when OpenRouter API is unavailable
// This is now much more focused and less chatty

type Message = {
  role: string
  content: string
}

export function generateFallbackResponse(messages: Message[]): string {
  const lastUserMessage = [...messages].reverse().find((msg) => msg.role === "user")?.content || ""

  // Check for persona command
  let persona = "default"
  let cleanMessage = lastUserMessage

  if (lastUserMessage.startsWith("/male")) {
    persona = "male"
    cleanMessage = lastUserMessage.replace("/male", "").trim()
  } else if (lastUserMessage.startsWith("/female")) {
    persona = "female"
    cleanMessage = lastUserMessage.replace("/female", "").trim()
  }

  const lowerCaseMessage = cleanMessage.toLowerCase()

  // Focused responses based on message type
  let response = ""

  // Greeting patterns
  if (lowerCaseMessage.match(/\b(hello|hi|hey|greetings|good (morning|afternoon|evening))\b/)) {
    const greetings =
      persona === "male"
        ? ["Hey! How's it going?", "Hi there! What's up?", "Hello! How can I help?"]
        : persona === "female"
          ? ["Hi! How are you doing?", "Hey there! What's new?", "Hello! How can I help you?"]
          : ["Hi! How can I assist you today?", "Hello! What can I help with?", "Hey! What do you need?"]

    response = greetings[Math.floor(Math.random() * greetings.length)]
  }
  // Question patterns
  else if (lowerCaseMessage.includes("?") || lowerCaseMessage.match(/\b(what|how|when|where|why|who)\b/)) {
    const questions =
      persona === "male"
        ? ["Let me help you with that. What specifically do you need?", "Sure thing! What's the question?"]
        : persona === "female"
          ? ["I'd love to help! What would you like to know?", "Of course! What's your question?"]
          : ["I can help with that. What do you need to know?", "What's your question?"]

    response = questions[Math.floor(Math.random() * questions.length)]
  }
  // Help requests
  else if (lowerCaseMessage.match(/\b(help|assist|support)\b/)) {
    const help =
      persona === "male"
        ? ["I'm here to help! What do you need?", "Sure, I can assist. What's the issue?"]
        : persona === "female"
          ? ["I'm happy to help! What do you need assistance with?", "Of course! How can I help you?"]
          : ["I'm here to help. What do you need assistance with?", "How can I assist you?"]

    response = help[Math.floor(Math.random() * help.length)]
  }
  // Default responses - much simpler
  else {
    const defaults =
      persona === "male"
        ? ["What's on your mind?", "How can I help you today?", "What do you need?"]
        : persona === "female"
          ? ["How can I help you?", "What would you like to know?", "What can I assist with?"]
          : ["How can I assist you?", "What do you need help with?", "What can I do for you?"]

    response = defaults[Math.floor(Math.random() * defaults.length)]
  }

  console.log(`Focused fallback response (${persona}): "${response}"`)
  return response
}
