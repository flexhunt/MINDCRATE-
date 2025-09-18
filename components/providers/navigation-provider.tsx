"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode, Suspense } from "react"
import { useRouter, usePathname } from "next/navigation"

interface NavigationContextType {
  isNavigating: boolean
  navigateTo: (href: string) => void
}

const NavigationContext = createContext<NavigationContextType | null>(null)

export function useNavigation() {
  const context = useContext(NavigationContext)

  // Fallback if provider is not available
  if (!context) {
    console.warn("useNavigation called outside NavigationProvider, using fallback")
    return {
      isNavigating: false,
      navigateTo: (href: string) => {
        if (typeof window !== "undefined") {
          window.location.href = href
        }
      },
    }
  }

  return context
}

// Component that uses navigation hooks
function NavigationState({ children }: { children: ReactNode }) {
  const [isNavigating, setIsNavigating] = useState(false)
  const [lastPathname, setLastPathname] = useState("")
  const router = useRouter()
  const pathname = usePathname()

  // Reset navigation state when pathname changes and after a delay
  useEffect(() => {
    if (isNavigating && pathname !== lastPathname && lastPathname !== "") {
      // Add a delay to ensure the page is fully loaded
      const timer = setTimeout(() => {
        setIsNavigating(false)
      }, 800) // Reduced delay

      return () => clearTimeout(timer)
    }
  }, [pathname, isNavigating, lastPathname])

  const navigateTo = useCallback(
    (href: string) => {
      // Prevent navigation if already navigating or same path
      if (isNavigating || href === pathname) {
        return
      }

      try {
        setIsNavigating(true)
        setLastPathname(pathname)

        // Use router.push directly without delay
        router.push(href)
      } catch (error) {
        console.error("Navigation error:", error)
        setIsNavigating(false)
        // Fallback to window.location
        if (typeof window !== "undefined") {
          window.location.href = href
        }
      }
    },
    [pathname, router, isNavigating],
  )

  const contextValue: NavigationContextType = {
    isNavigating,
    navigateTo,
  }

  return (
    <NavigationContext.Provider value={contextValue}>
      {isNavigating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4">
            <div className="h-16 w-16 relative">
              <div className="absolute inset-0 rounded-full border-4 border-muted-foreground/20"></div>
              <div className="absolute inset-0 rounded-full border-4 border-t-primary animate-spin"></div>
            </div>
            <div className="text-lg font-medium animate-pulse">Loading...</div>
          </div>
        </div>
      )}
      {children}
    </NavigationContext.Provider>
  )
}

// Main provider that wraps the state in Suspense
export function NavigationProvider({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-screen">
          <div className="h-16 w-16 relative">
            <div className="absolute inset-0 rounded-full border-4 border-muted-foreground/20"></div>
            <div className="absolute inset-0 rounded-full border-4 border-t-primary animate-spin"></div>
          </div>
        </div>
      }
    >
      <NavigationState>{children}</NavigationState>
    </Suspense>
  )
}
