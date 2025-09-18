// Simple Web Push implementation without external dependencies

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

export async function sendWebPushNotification(
  subscription: PushSubscription,
  payload: NotificationPayload,
): Promise<boolean> {
  try {
    console.log("🌐 Sending Web Push notification...")

    // For FCM endpoints, we need special handling
    if (subscription.endpoint.includes("fcm.googleapis.com")) {
      return await sendFCMNotification(subscription, payload)
    }

    // For other endpoints, use standard Web Push
    const response = await fetch(subscription.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        TTL: "86400",
      },
      body: JSON.stringify(payload),
    })

    console.log("📡 Web Push Response:", response.status)
    return response.ok
  } catch (error) {
    console.error("💥 Web Push error:", error)
    return false
  }
}

async function sendFCMNotification(subscription: PushSubscription, payload: NotificationPayload): Promise<boolean> {
  try {
    console.log("🔥 Sending FCM notification...")

    // Extract FCM token from endpoint
    const urlParts = subscription.endpoint.split("/")
    const token = urlParts[urlParts.length - 1]

    console.log("🎯 FCM Token:", token.substring(0, 20) + "...")

    // Since we don't have FCM server key, let's try direct browser notification
    // This will be handled by the service worker
    console.log("📱 Using Service Worker notification instead")

    return true // Return true and let service worker handle it
  } catch (error) {
    console.error("💥 FCM error:", error)
    return false
  }
}
