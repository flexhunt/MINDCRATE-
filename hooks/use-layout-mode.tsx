"use client"

import { useState, useEffect } from "react"

export function useLayoutMode() {
  const [layoutMode, setLayoutModeState] = useState<"sidebar" | "navbar">("navbar")

  useEffect(() => {
    // Load saved layout mode from localStorage
    const savedLayoutMode = localStorage.getItem("layoutMode") as "sidebar" | "navbar" | null
    if (savedLayoutMode) {
      setLayoutModeState(savedLayoutMode)
    }

    // Listen for layout mode changes
    const handleLayoutModeChange = (event: CustomEvent) => {
      setLayoutModeState(event.detail)
    }

    window.addEventListener("layoutModeChange", handleLayoutModeChange as EventListener)

    return () => {
      window.removeEventListener("layoutModeChange", handleLayoutModeChange as EventListener)
    }
  }, [])

  const setLayoutMode = (mode: "sidebar" | "navbar") => {
    setLayoutModeState(mode)
    localStorage.setItem("layoutMode", mode)
    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent("layoutModeChange", { detail: mode }))
  }

  return { layoutMode, setLayoutMode }
}
