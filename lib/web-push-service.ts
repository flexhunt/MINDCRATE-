import webpush from "web-push"

// Initialize web-push with VAPID keys
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY
const adminEmail = process.env.ADMIN_EMAIL

if (vapidPublicKey && vapidPrivateKey && adminEmail) {
  webpush.setVapidDetails(`mailto:${adminEmail}`, vapidPublicKey, vapidPrivateKey)
  console.log("✅ Web Push VAPID configured")
} else {
  console.log("⚠️ Web Push VAPID keys missing")
}

interface PushSubscription {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
}

interface NotificationPayload {
  title: string
  body: string
  icon?: string
  badge?: string
  data?: any
}

export async function sendPushNotification(
  subscription: PushSubscription,
  payload: NotificationPayload,
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log("📤 Sending push notification via web-push library...")

    // Convert our subscription format to web-push format
    const pushSubscription = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
    }

    console.log("📦 Payload:", payload)
    console.log("🎯 Endpoint:", subscription.endpoint.substring(0, 50) + "...")

    // Send notification using web-push library
    const result = await webpush.sendNotification(pushSubscription, JSON.stringify(payload))

    console.log("��� Push notification sent successfully")
    console.log("📊 Result:", result.statusCode)

    return { success: true }
  } catch (error: any) {
    console.error("💥 Push notification error:", error)

    // Handle specific errors
    if (error.statusCode === 410) {
      console.log("🗑️ Subscription expired")
      return { success: false, error: "Subscription expired" }
    }

    if (error.statusCode === 413) {
      console.log("📏 Payload too large")
      return { success: false, error: "Payload too large" }
    }

    return {
      success: false,
      error: error.message || "Unknown error",
    }
  }
}

export function isWebPushConfigured(): boolean {
  return !!(vapidPublicKey && vapidPrivateKey && adminEmail)
}
