"use client"

import { useNavigation } from "@/components/providers/navigation-provider"
import { usePathname } from "next/navigation"

export function NavigationDebug() {
  const { isNavigating } = useNavigation()
  const pathname = usePathname()

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-black/80 text-white p-2 rounded text-xs">
      <div>Path: {pathname}</div>
      <div>Navigating: {isNavigating ? "Yes" : "No"}</div>
    </div>
  )
}
