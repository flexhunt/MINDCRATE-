"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

interface PWAContextType {
  isInstalled: boolean
  isInstallable: boolean
  showInstallPrompt: () => void
  hideInstallPrompt: () => void
}

const PWAContext = createContext<PWAContextType | undefined>(undefined)

export function PWAProvider({ children }: { children: ReactNode }) {
  const [isInstalled, setIsInstalled] = useState(false)
  const [isInstallable, setIsInstallable] = useState(false)

  useEffect(() => {
    // Check if app is installed (running in standalone mode)
    const checkInstalled = () => {
      const isStandalone = window.matchMedia("(display-mode: standalone)").matches
      const isIOSStandalone = (window.navigator as any).standalone === true
      setIsInstalled(isStandalone || isIOSStandalone)
    }

    checkInstalled()

    // Listen for app install
    window.addEventListener("appinstalled", () => {
      setIsInstalled(true)
      setIsInstallable(false)
    })

    // Listen for beforeinstallprompt
    window.addEventListener("beforeinstallprompt", () => {
      setIsInstallable(true)
    })

    return () => {
      window.removeEventListener("appinstalled", checkInstalled)
      window.removeEventListener("beforeinstallprompt", checkInstalled)
    }
  }, [])

  const showInstallPrompt = () => {
    // This will be handled by the InstallPrompt component
  }

  const hideInstallPrompt = () => {
    // This will be handled by the InstallPrompt component
  }

  return (
    <PWAContext.Provider
      value={{
        isInstalled,
        isInstallable,
        showInstallPrompt,
        hideInstallPrompt,
      }}
    >
      {children}
    </PWAContext.Provider>
  )
}

export function usePWA() {
  const context = useContext(PWAContext)
  if (context === undefined) {
    throw new Error("usePWA must be used within a PWAProvider")
  }
  return context
}
