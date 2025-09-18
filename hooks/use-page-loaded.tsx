"use client"

import { useState, useEffect } from "react"

export function usePageLoaded() {
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    // Set loaded to true after component mounts
    setIsLoaded(true)

    // Reset on unmount
    return () => {
      setIsLoaded(false)
    }
  }, [])

  return isLoaded
}
