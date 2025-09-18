"use client"

import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Moon, Sun, Monitor, Navigation, PanelLeft } from "lucide-react"
import { useLayoutMode } from "@/hooks/use-layout-mode"
import { useEffect, useState } from "react"

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme()
  const { layoutMode, setLayoutMode } = useLayoutMode()
  const [mounted, setMounted] = useState(false)
  const [colorTheme, setColorTheme] = useState("blue")

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const savedColorTheme = localStorage.getItem("color-theme") || "blue"
    setColorTheme(savedColorTheme)
    document.documentElement.setAttribute("data-color-theme", savedColorTheme)
  }, [])

  if (!mounted) {
    return (
      <Button variant="outline" size="icon" className="h-8 w-8">
        <Sun className="h-[1.2rem] w-[1.2rem]" />
      </Button>
    )
  }

  const handleLayoutToggle = () => {
    const newMode = layoutMode === "navbar" ? "sidebar" : "navbar"
    setLayoutMode(newMode)
  }

  const handleColorThemeChange = (color: string) => {
    setColorTheme(color)
    localStorage.setItem("color-theme", color)
    document.documentElement.setAttribute("data-color-theme", color)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="h-8 w-8">
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme and layout</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => setTheme("light")}
          className={`flex items-center gap-2 ${theme === "light" ? "bg-accent" : ""}`}
        >
          <Sun className="h-4 w-4" />
          <span>Light</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("dark")}
          className={`flex items-center gap-2 ${theme === "dark" ? "bg-accent" : ""}`}
        >
          <Moon className="h-4 w-4" />
          <span>Dark</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("system")}
          className={`flex items-center gap-2 ${theme === "system" ? "bg-accent" : ""}`}
        >
          <Monitor className="h-4 w-4" />
          <span>System</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={() => handleColorThemeChange("blue")}
          className={`flex items-center gap-2 ${colorTheme === "blue" ? "bg-accent" : ""}`}
        >
          <div className="h-4 w-4 rounded-full bg-blue-500" />
          <span>Blue</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => handleColorThemeChange("green")}
          className={`flex items-center gap-2 ${colorTheme === "green" ? "bg-accent" : ""}`}
        >
          <div className="h-4 w-4 rounded-full bg-green-500" />
          <span>Green</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => handleColorThemeChange("purple")}
          className={`flex items-center gap-2 ${colorTheme === "purple" ? "bg-accent" : ""}`}
        >
          <div className="h-4 w-4 rounded-full bg-purple-500" />
          <span>Purple</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => handleColorThemeChange("red")}
          className={`flex items-center gap-2 ${colorTheme === "red" ? "bg-accent" : ""}`}
        >
          <div className="h-4 w-4 rounded-full bg-red-500" />
          <span>Red</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={handleLayoutToggle} className="flex items-center gap-2">
          {layoutMode === "navbar" ? (
            <>
              <PanelLeft className="h-4 w-4" />
              <span>Switch to Sidebar</span>
            </>
          ) : (
            <>
              <Navigation className="h-4 w-4" />
              <span>Switch to Navigation</span>
            </>
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
