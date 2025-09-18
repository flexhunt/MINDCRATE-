"use client"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { PanelLeft, Navigation } from "lucide-react"
import { useState, useEffect } from "react"

export function ViewToggle() {
  const [layoutMode, setLayoutMode] = useState<"sidebar" | "navbar">("navbar")

  useEffect(() => {
    // Load saved layout mode from localStorage
    const savedLayoutMode = localStorage.getItem("layoutMode") as "sidebar" | "navbar" | null
    if (savedLayoutMode) {
      setLayoutMode(savedLayoutMode)
    }
  }, [])

  const handleLayoutChange = (mode: "sidebar" | "navbar") => {
    setLayoutMode(mode)
    localStorage.setItem("layoutMode", mode)
    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent("layoutModeChange", { detail: mode }))
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="h-8 w-8">
          {layoutMode === "navbar" ? (
            <Navigation className="h-[1.2rem] w-[1.2rem]" />
          ) : (
            <PanelLeft className="h-[1.2rem] w-[1.2rem]" />
          )}
          <span className="sr-only">Toggle layout mode</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleLayoutChange("navbar")} className="flex items-center gap-2">
          <Navigation className="h-4 w-4" />
          <span>Navigation Bar</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleLayoutChange("sidebar")} className="flex items-center gap-2">
          <PanelLeft className="h-4 w-4" />
          <span>Sidebar</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
