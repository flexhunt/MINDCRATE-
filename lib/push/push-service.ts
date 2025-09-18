// Simple push service that dynamically imports web-push
export class PushService {
  static async isConfigured(): Promise<boolean> {
    try {
      const hasEnvVars = !!(
        process.env.ADMIN_EMAIL &&
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY &&
        process.env.VAPID_PRIVATE_KEY
      )

      if (!hasEnvVars) return false

      // Try to import web-push
      await import("web-push")
      return true
    } catch {
      return false
    }
  }

  static async getConfigurationStatus() {
    const hasVapidPublicKey = !!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    const hasVapidPrivateKey = !!process.env.VAPID_PRIVATE_KEY
    const hasAdminEmail = !!process.env.ADMIN_EMAIL

    let hasWebPush = false
    try {
      await import("web-push")
      hasWebPush = true
    } catch {
      hasWebPush = false
    }

    return {
      isConfigured: hasVapidPublicKey && hasVapidPrivateKey && hasAdminEmail && hasWebPush,
      hasVapidPublicKey,
      hasVapidPrivateKey,
      hasAdminEmail,
      hasWebPush,
    }
  }
}
