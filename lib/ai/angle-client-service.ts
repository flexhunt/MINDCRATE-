import { createClient } from "@/lib/supabase/client"

export class AngleClientService {
  private supabase = createClient()

  async triggerAngleResponse(message: string, userId: string): Promise<void> {
    try {
      const response = await fetch("/api/chat/angle-response", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message,
          userId,
        }),
      })

      if (!response.ok) {
        console.error("Failed to trigger Angle response:", response.status)
      }
    } catch (error) {
      console.error("Error triggering Angle response:", error)
    }
  }

  detectAngleMention(message: string): boolean {
    const lowerMessage = message.toLowerCase()
    const triggers = ["angle", "@angle", "angle bolo", "hey angle", "hi angle", "angle help", "angle please"]

    return triggers.some((trigger) => lowerMessage.includes(trigger))
  }
}

export const angleClient = new AngleClientService()
