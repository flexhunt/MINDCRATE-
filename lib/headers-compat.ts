// This file provides compatibility for components that need headers functionality
// but might be used in both app/ and pages/ directories

// For server components in app/ directory
export function getHeadersServer() {
  // Only import headers in a server context
  if (typeof window === "undefined") {
    try {
      // Dynamic import to prevent static analysis from detecting this import
      const headers = require("next/headers")
      return headers
    } catch (e) {
      // Fallback for pages/ directory
      return {
        cookies: () => ({
          get: () => null,
          getAll: () => [],
          set: () => {},
          delete: () => {},
        }),
        headers: () => new Map(),
      }
    }
  }

  // Client-side fallback
  return {
    cookies: () => ({
      get: () => null,
      getAll: () => [],
      set: () => {},
      delete: () => {},
    }),
    headers: () => new Map(),
  }
}

// Safe way to check if we're in app/ directory
export function isAppDirectory() {
  try {
    require("next/headers")
    return true
  } catch (e) {
    return false
  }
}
