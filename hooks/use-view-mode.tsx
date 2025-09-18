"use client"

import { useState, useEffect } from "react"

export function useViewMode() {
  const [viewMode, setViewMode] = useState<"dashboard" | "navigation">("navigation")

  useEffect(() => {
    // Load saved view mode from localStorage
    const savedViewMode = localStorage.getItem("viewMode") as "dashboard" | "navigation" | null
    if (savedViewMode) {
      setViewMode(savedViewMode)
    }

    // Listen for view mode changes
    const handleViewModeChange = (event: CustomEvent) => {
      setViewMode(event.detail)
    }

    window.addEventListener("viewModeChange", handleViewModeChange as EventListener)

    return () => {
      window.removeEventListener("viewModeChange", handleViewModeChange as EventListener)
    }
  }, [])

  return viewMode
}
