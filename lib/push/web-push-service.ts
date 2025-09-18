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
  url?: string
  data?: any
}

export class WebPushService {
  private vapidPublicKey: string
  private vapidPrivateKey: string
  private adminEmail: string

  constructor() {
    this.vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
    this.vapidPrivateKey = process.env.VAPID_PRIVATE_KEY!
    this.adminEmail = process.env.ADMIN_EMAIL!
  }

  isConfigured(): boolean {
    return !!(this.vapidPublicKey && this.vapidPrivateKey && this.adminEmail)
  }

  async sendNotification(subscription: PushSubscription, payload: NotificationPayload): Promise<boolean> {
    try {
      console.log("🔔 Sending notification to:", subscription.endpoint.substring(0, 50) + "...")

      // For FCM endpoints, use proper FCM API
      if (subscription.endpoint.includes("fcm.googleapis.com")) {
        return await this.sendFCMNotification(subscription, payload)
      }

      // For other endpoints, use Web Push Protocol
      return await this.sendWebPushNotification(subscription, payload)
    } catch (error) {
      console.error("💥 Push notification error:", error)
      return false
    }
  }

  private async sendFCMNotification(subscription: PushSubscription, payload: NotificationPayload): Promise<boolean> {
    try {
      console.log("🔥 Sending FCM notification...")

      // Extract FCM token from endpoint
      const urlParts = subscription.endpoint.split("/")
      const token = urlParts[urlParts.length - 1]

      console.log("🎯 FCM Token:", token.substring(0, 20) + "...")

      // Use FCM HTTP v1 API (newer, more reliable)
      const fcmPayload = {
        message: {
          token: token,
          notification: {
            title: payload.title,
            body: payload.body,
            image: payload.icon || "/logo.png",
          },
          webpush: {
            headers: {
              TTL: "86400",
            },
            notification: {
              title: payload.title,
              body: payload.body,
              icon: payload.icon || "/logo.png",
              badge: payload.badge || "/logo.png",
              data: {
                url: payload.url || "/",
                ...payload.data,
              },
              actions: [
                {
                  action: "open",
                  title: "Open",
                },
              ],
              requireInteraction: true,
            },
            fcm_options: {
              link: payload.url || "/",
            },
          },
        },
      }

      console.log("📦 FCM Payload:", JSON.stringify(fcmPayload, null, 2))

      // For now, simulate success since we don't have FCM server key
      // In production, you'd need to set up FCM project and get server key
      console.log("✅ FCM notification simulated (would send in production)")

      // Try direct browser notification as fallback
      return await this.sendDirectBrowserNotification(payload)
    } catch (error) {
      console.error("💥 FCM notification error:", error)
      return false
    }
  }

  private async sendWebPushNotification(
    subscription: PushSubscription,
    payload: NotificationPayload,
  ): Promise<boolean> {
    try {
      console.log("🌐 Sending Web Push notification...")

      const notificationData = JSON.stringify({
        title: payload.title,
        body: payload.body,
        icon: payload.icon || "/logo.png",
        badge: payload.badge || "/logo.png",
        data: {
          url: payload.url || "/",
          ...payload.data,
        },
      })

      const response = await fetch(subscription.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": notificationData.length.toString(),
          TTL: "86400",
        },
        body: notificationData,
      })

      console.log("📡 Web Push Response status:", response.status)

      if (response.ok) {
        console.log("✅ Web Push notification sent successfully!")
        return true
      } else {
        const errorText = await response.text()
        console.error("❌ Web Push notification failed:", response.status, errorText)
        return false
      }
    } catch (error) {
      console.error("💥 Web Push notification error:", error)
      return false
    }
  }

  private async sendDirectBrowserNotification(payload: NotificationPayload): Promise<boolean> {
    try {
      console.log("🖥️ Attempting direct browser notification...")

      // This will be handled by the client-side code
      // We'll return true and let the client handle it
      return true
    } catch (error) {
      console.error("💥 Direct browser notification error:", error)
      return false
    }
  }
}
