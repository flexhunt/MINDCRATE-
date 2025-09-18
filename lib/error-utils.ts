/**
 * Formats an error object into a readable string
 * @param error The error object to format
 * @returns A formatted error string
 */
export function formatError(error: any): string {
  if (!error) return "Unknown error"

  if (error.__isAuthError) {
    // Handle Supabase Auth errors
    return `Authentication error (${error.status}): ${error.message}`
  }

  if (error.code && error.message) {
    return `Error ${error.code}: ${error.message}`
  }

  if (error.message) {
    return error.message
  }

  return String(error)
}

/**
 * Checks if an error is a network-related error
 * @param error The error to check
 * @returns True if the error is likely network-related
 */
export function isNetworkError(error: any): boolean {
  if (!error) return false

  // Check for common network error patterns
  if (
    error.message &&
    (error.message.includes("network") ||
      error.message.includes("connection") ||
      error.message.includes("offline") ||
      error.message.includes("timeout"))
  ) {
    return true
  }

  // Check for fetch/network error status codes
  if (error.status === 0 || error.status === 408 || error.status === 429) {
    return true
  }

  return false
}

/**
 * Checks if an error is likely a temporary/transient error that could be retried
 * @param error The error to check
 * @returns True if the error is likely temporary and can be retried
 */
export function isRetryableError(error: any): boolean {
  if (!error) return false

  // Network errors are generally retryable
  if (isNetworkError(error)) return true

  // Supabase auth unexpected_failure is often temporary
  if (error.__isAuthError && error.code === "unexpected_failure") {
    return true
  }

  // Server errors (5xx) are often temporary
  if (error.status && error.status >= 500 && error.status < 600) {
    return true
  }

  return false
}
