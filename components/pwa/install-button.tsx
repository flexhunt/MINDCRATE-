"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Download, Plus } from "lucide-react"
import { InstallPrompt } from "./install-prompt"

export function InstallButton() {
  const [showPrompt, setShowPrompt] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [isIOS, setIsIOS] = useState(false)

  useEffect(() => {
    // Check if app is installed
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches
    const isIOSStandalone = (window.navigator as any).standalone === true
    setIsInstalled(isStandalone || isIOSStandalone)

    // Detect device
    const userAgent = navigator.userAgent.toLowerCase()
    const isIOSDevice =
      /iphone|ipad|ipod/.test(userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
    const isMobileDevice =
      /mobile|tablet|android|iphone|ipad|ipod|blackberry|windows phone/.test(userAgent) || window.innerWidth <= 768

    setIsMobile(isMobileDevice)
    setIsIOS(isIOSDevice)

    // Listen for custom event to show prompt
    const handleShowPrompt = () => setShowPrompt(true)
    window.addEventListener("show-install-prompt", handleShowPrompt)

    return () => {
      window.removeEventListener("show-install-prompt", handleShowPrompt)
    }
  }, [])

  const handleClick = () => {
    console.log("Install button clicked")
    setShowPrompt(true)
  }

  // Don't show button if already installed
  if (isInstalled) {
    return null
  }

  return (
    <>
      <Button
        onClick={handleClick}
        className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold px-4 py-2 rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg text-sm"
      >
        {isMobile ? (
          <>
            <Plus className="w-4 h-4 mr-1" />
            {isIOS ? "Add to Home" : "Install App"}
          </>
        ) : (
          <>
            <Download className="w-4 h-4 mr-1" />
            Install
          </>
        )}
      </Button>

      {/* Render popup when needed */}
      {showPrompt && (
        <div className="fixed inset-0 z-50">
          <InstallPrompt />
          <button
            onClick={() => setShowPrompt(false)}
            className="absolute inset-0 bg-black/60"
            aria-label="Close popup"
          />
        </div>
      )}
    </>
  )
}
