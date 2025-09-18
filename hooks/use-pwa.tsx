"use client"

import { useState, useEffect } from "react"

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed"
    platform: string
  }>
  prompt(): Promise<void>
}

export function usePWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isInstallable, setIsInstallable] = useState(false)
  const [deviceType, setDeviceType] = useState<"ios" | "android" | "desktop" | "unknown">("unknown")

  useEffect(() => {
    // Check if app is already installed
    const checkInstalled = () => {
      const isStandalone = window.matchMedia("(display-mode: standalone)").matches
      const isIOSStandalone = (window.navigator as any).standalone === true
      setIsInstalled(isStandalone || isIOSStandalone)
    }

    // Detect device type
    const detectDevice = () => {
      const userAgent = navigator.userAgent.toLowerCase()
      if (/iphone|ipad|ipod/.test(userAgent)) {
        setDeviceType("ios")
      } else if (/android/.test(userAgent)) {
        setDeviceType("android")
      } else {
        setDeviceType("desktop")
      }
    }

    checkInstalled()
    detectDevice()

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setIsInstallable(true)
    }

    // Listen for app install
    const handleAppInstalled = () => {
      setIsInstalled(true)
      setIsInstallable(false)
      setDeferredPrompt(null)
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    window.addEventListener("appinstalled", handleAppInstalled)

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
      window.removeEventListener("appinstalled", handleAppInstalled)
    }
  }, [])

  const installApp = async () => {
    if (!deferredPrompt) return false

    try {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice

      if (outcome === "accepted") {
        setDeferredPrompt(null)
        setIsInstallable(false)
        return true
      }
      return false
    } catch (error) {
      console.error("Error installing app:", error)
      return false
    }
  }

  const getInstallInstructions = () => {
    switch (deviceType) {
      case "ios":
        return {
          title: "Install on iPhone/iPad",
          steps: [
            "Tap the Share button (⬆️) at the bottom",
            'Scroll down and tap "Add to Home Screen"',
            'Tap "Add" to install the app',
          ],
        }
      case "android":
        return {
          title: "Install on Android",
          steps: [
            "Tap the menu (⋮) in your browser",
            'Select "Add to Home Screen" or "Install App"',
            'Tap "Install" to add the app',
          ],
        }
      default:
        return {
          title: "Install on Desktop",
          steps: [
            "Look for the install icon in your address bar",
            'Click "Install Mindcrate"',
            "The app will open in its own window",
          ],
        }
    }
  }

  return {
    isInstalled,
    isInstallable,
    deviceType,
    installApp,
    getInstallInstructions,
    canInstall: isInstallable && !isInstalled,
  }
}
