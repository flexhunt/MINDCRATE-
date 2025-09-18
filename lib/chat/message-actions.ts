import { createClient } from "@/lib/supabase/client"

export async function deleteMessage(messageId: string, userId: string): Promise<boolean> {
  const supabase = createClient()

  try {
    console.log(`Attempting to delete message with ID: ${messageId}`)

    // Make sure we're using the correct message ID
    if (!messageId || messageId.startsWith("optimistic-")) {
      throw new Error("Cannot delete message with invalid ID")
    }

    // First try using the RPC function
    const { data: functionResult, error: functionError } = await supabase.rpc("delete_chat_message", {
      message_id: messageId,
      user_id: userId,
    })

    if (!functionError && functionResult === true) {
      console.log("Message deleted successfully via function")
      return true
    }

    // If function fails, try direct delete
    const { error, count } = await supabase
      .from("global_chat_messages")
      .delete({ count: "exact" })
      .eq("id", messageId)
      .eq("user_id", userId) // Ensure user can only delete their own messages

    console.log(`Delete operation result: ${count} rows affected`)

    if (error) {
      console.error("Supabase delete error:", error)

      // Try the API route as a fallback
      return await deleteMessageViaAPI(messageId)
    }

    if (count === 0) {
      console.warn("No messages were deleted. Message may not exist or user doesn't have permission.")

      // Try the API route as a fallback
      return await deleteMessageViaAPI(messageId)
    }

    return true
  } catch (error) {
    console.error("Exception deleting message:", error)

    // Try the API route as a fallback
    return await deleteMessageViaAPI(messageId)
  }
}

async function deleteMessageViaAPI(messageId: string): Promise<boolean> {
  try {
    console.log(`Attempting to delete message via API: ${messageId}`)

    const response = await fetch("/api/chat/delete-message", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ messageId }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error("API delete error:", errorData)
      return false
    }

    return true
  } catch (error) {
    console.error("API delete exception:", error)
    return false
  }
}
