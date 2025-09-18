"use client"

import { useEffect } from "react"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Error details:", error)
  }, [error])

  const handleReset = () => {
    try {
      if (typeof reset === "function") {
        reset()
      } else {
        window.location.reload()
      }
    } catch (e) {
      window.location.reload()
    }
  }

  const handleGoHome = () => {
    window.location.href = "/dashboard"
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
        <p className="text-gray-600 mb-6">We encountered an error. Let's try to fix it.</p>

        <div className="space-y-3">
          <button onClick={handleReset} className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
            Try Again
          </button>

          <button onClick={handleGoHome} className="w-full px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  )
}
