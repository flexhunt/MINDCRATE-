"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { X, Download, Smartphone, Apple, Monitor, Zap, Wifi, Bell } from "lucide-react"

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed"
    platform: string
  }>
  prompt(): Promise<void>
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isAndroid, setIsAndroid] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [installStep, setInstallStep] = useState(0)

  useEffect(() => {
    // Enhanced device detection
    const userAgent = navigator.userAgent.toLowerCase()
    const isIOSDevice =
      /iphone|ipad|ipod/.test(userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1) ||
      /macintosh/.test(userAgent)
    const isAndroidDevice = /android/.test(userAgent)
    const isMobileDevice =
      /mobile|tablet|android|iphone|ipad|ipod|blackberry|windows phone/.test(userAgent) ||
      window.innerWidth <= 768 ||
      navigator.maxTouchPoints > 0

    console.log("🔍 Enhanced device detection:", { isIOSDevice, isAndroidDevice, isMobileDevice, userAgent })

    setIsIOS(isIOSDevice)
    setIsAndroid(isAndroidDevice)
    setIsMobile(isMobileDevice)

    // Check if already installed
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches
    const isIOSStandalone = (window.navigator as any).standalone === true
    const isWindowControlsOverlay = window.matchMedia("(display-mode: window-controls-overlay)").matches
    const installed = isStandalone || isIOSStandalone || isWindowControlsOverlay

    console.log("📱 Install status:", { isStandalone, isIOSStandalone, isWindowControlsOverlay, installed })
    setIsInstalled(installed)

    if (installed) return

    // Check dismissal history
    const dismissed = localStorage.getItem("install-prompt-dismissed")
    const dismissedTime = localStorage.getItem("install-prompt-dismissed-time")
    const installAttempts = Number.parseInt(localStorage.getItem("install-attempts") || "0")

    if (dismissed && dismissedTime) {
      const timeSinceDismissed = Date.now() - Number.parseInt(dismissedTime)
      const waitTime = installAttempts > 2 ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000 // 7 days if attempted multiple times

      if (timeSinceDismissed < waitTime) {
        console.log("⏰ Install prompt dismissed recently, waiting...")
        return
      } else {
        localStorage.removeItem("install-prompt-dismissed")
        localStorage.removeItem("install-prompt-dismissed-time")
      }
    }

    // Show for mobile users after delay
    if (isMobileDevice && !installed) {
      const timer = setTimeout(() => {
        console.log("📱 Showing install prompt for mobile")
        setShowPrompt(true)
      }, 3000)

      return () => clearTimeout(timer)
    }

    // Listen for beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      console.log("🎯 beforeinstallprompt event fired")
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      if (isMobileDevice || !isIOSDevice) {
        setShowPrompt(true)
      }
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstall = async () => {
    console.log("🚀 Install clicked", { deferredPrompt, isIOS, isAndroid })

    const attempts = Number.parseInt(localStorage.getItem("install-attempts") || "0")
    localStorage.setItem("install-attempts", (attempts + 1).toString())

    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt()
        const { outcome } = await deferredPrompt.userChoice
        console.log("✅ Install outcome:", outcome)

        if (outcome === "accepted") {
          setDeferredPrompt(null)
          setShowPrompt(false)
          localStorage.removeItem("install-attempts")
        }
      } catch (error) {
        console.error("❌ Install error:", error)
      }
    } else {
      // Show step-by-step instructions
      setInstallStep(1)
    }
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    localStorage.setItem("install-prompt-dismissed", "true")
    localStorage.setItem("install-prompt-dismissed-time", Date.now().toString())
  }

  const handleRemindLater = () => {
    setShowPrompt(false)
    localStorage.setItem("install-prompt-dismissed", "true")
    localStorage.setItem("install-prompt-dismissed-time", (Date.now() - 22 * 60 * 60 * 1000).toString()) // 2 hours
  }

  if (!showPrompt || isInstalled) {
    return null
  }

  return (
    <>
      {/* Enhanced backdrop with blur */}
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
        {/* Enhanced popup */}
        <div className="bg-white dark:bg-gray-900 rounded-t-3xl sm:rounded-3xl w-full max-w-md shadow-2xl animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-4 duration-500 border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Close button */}
          <button
            onClick={handleDismiss}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors z-10"
          >
            <X className="w-5 h-5" />
          </button>

          {installStep === 0 ? (
            <>
              {/* Header with gradient */}
              <div className="bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 p-6 text-white">
                <div className="text-center">
                  <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-2xl mx-auto mb-4 flex items-center justify-center">
                    <span className="text-white font-bold text-xl">M</span>
                  </div>
                  <h2 className="text-2xl font-bold mb-2">📱 Get the Mindcrate App</h2>
                  <p className="text-white/90 text-sm">Install for the ultimate learning experience</p>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                {/* Features grid */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                    <Zap className="w-8 h-8 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Lightning Fast</p>
                  </div>
                  <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-xl">
                    <Wifi className="w-8 h-8 text-green-600 dark:text-green-400 mx-auto mb-2" />
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Works Offline</p>
                  </div>
                  <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                    <Bell className="w-8 h-8 text-purple-600 dark:text-purple-400 mx-auto mb-2" />
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Push Notifications</p>
                  </div>
                  <div className="text-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-xl">
                    <Smartphone className="w-8 h-8 text-orange-600 dark:text-orange-400 mx-auto mb-2" />
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Native Feel</p>
                  </div>
                </div>

                {/* Install button */}
                <Button
                  onClick={handleInstall}
                  className="w-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 text-white font-bold py-4 rounded-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg text-lg mb-4"
                >
                  <Download className="w-6 h-6 mr-2" />
                  {isIOS ? (
                    <>
                      <Apple className="w-5 h-5 mr-1" />
                      Add to Home Screen
                    </>
                  ) : isAndroid ? (
                    <>
                      <Smartphone className="w-5 h-5 mr-1" />
                      Install App
                    </>
                  ) : (
                    <>
                      <Monitor className="w-5 h-5 mr-1" />
                      Install Mindcrate
                    </>
                  )}
                </Button>

                {/* Secondary actions */}
                <div className="flex gap-2">
                  <Button onClick={handleRemindLater} variant="outline" className="flex-1 text-sm py-2">
                    ⏰ Later
                  </Button>
                  <Button onClick={handleDismiss} variant="ghost" className="flex-1 text-sm py-2">
                    ❌ No Thanks
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Step-by-step instructions */}
              <div className="p-6">
                <h3 className="text-xl font-bold mb-4 text-center">
                  {isIOS
                    ? "📱 iPhone/iPad Instructions"
                    : isAndroid
                      ? "🤖 Android Instructions"
                      : "💻 Desktop Instructions"}
                </h3>

                <div className="space-y-4">
                  {isIOS ? (
                    <>
                      <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">
                          1
                        </div>
                        <p className="text-sm">
                          Tap the <strong>Share</strong> button (⬆️) at the bottom
                        </p>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">
                          2
                        </div>
                        <p className="text-sm">
                          Scroll down and tap <strong>"Add to Home Screen"</strong>
                        </p>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">
                          3
                        </div>
                        <p className="text-sm">
                          Tap <strong>"Add"</strong> to install the app
                        </p>
                      </div>
                    </>
                  ) : isAndroid ? (
                    <>
                      <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-bold">
                          1
                        </div>
                        <p className="text-sm">
                          Tap the <strong>menu</strong> (⋮) in your browser
                        </p>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-bold">
                          2
                        </div>
                        <p className="text-sm">
                          Select <strong>"Add to Home Screen"</strong> or <strong>"Install App"</strong>
                        </p>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-bold">
                          3
                        </div>
                        <p className="text-sm">
                          Tap <strong>"Install"</strong> to add the app
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                        <div className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center font-bold">
                          1
                        </div>
                        <p className="text-sm">
                          Look for the <strong>install icon</strong> in your address bar
                        </p>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                        <div className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center font-bold">
                          2
                        </div>
                        <p className="text-sm">
                          Click <strong>"Install Mindcrate"</strong>
                        </p>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                        <div className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center font-bold">
                          3
                        </div>
                        <p className="text-sm">The app will open in its own window</p>
                      </div>
                    </>
                  )}
                </div>

                <div className="flex gap-2 mt-6">
                  <Button onClick={() => setInstallStep(0)} variant="outline" className="flex-1">
                    ← Back
                  </Button>
                  <Button onClick={handleDismiss} variant="default" className="flex-1">
                    Got it!
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}
