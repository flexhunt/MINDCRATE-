/**
 * Date utility functions to centralize date-fns usage
 */

// Format a date to a string
export function formatDate(date: Date | string | number, formatString = "MMMM d, yyyy"): string {
  const dateObj = typeof date === "string" || typeof date === "number" ? new Date(date) : date

  // Simple formatting without date-fns
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ]

  const day = dateObj.getDate()
  const month = months[dateObj.getMonth()]
  const year = dateObj.getFullYear()

  return `${month} ${day}, ${year}`
}

// Format distance to now (e.g., "2 days ago")
export function formatDistanceToNow(date: Date | string | number, options?: { addSuffix?: boolean }): string {
  const dateObj = typeof date === "string" || typeof date === "number" ? new Date(date) : date
  const now = new Date()

  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000)

  if (diffInSeconds < 60) {
    return options?.addSuffix ? "just now" : "less than a minute"
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) {
    return options?.addSuffix
      ? `${diffInMinutes} minute${diffInMinutes !== 1 ? "s" : ""} ago`
      : `${diffInMinutes} minute${diffInMinutes !== 1 ? "s" : ""}`
  }

  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) {
    return options?.addSuffix
      ? `${diffInHours} hour${diffInHours !== 1 ? "s" : ""} ago`
      : `${diffInHours} hour${diffInHours !== 1 ? "s" : ""}`
  }

  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 30) {
    return options?.addSuffix
      ? `${diffInDays} day${diffInDays !== 1 ? "s" : ""} ago`
      : `${diffInDays} day${diffInDays !== 1 ? "s" : ""}`
  }

  const diffInMonths = Math.floor(diffInDays / 30)
  if (diffInMonths < 12) {
    return options?.addSuffix
      ? `${diffInMonths} month${diffInMonths !== 1 ? "s" : ""} ago`
      : `${diffInMonths} month${diffInMonths !== 1 ? "s" : ""}`
  }

  const diffInYears = Math.floor(diffInMonths / 12)
  return options?.addSuffix
    ? `${diffInYears} year${diffInYears !== 1 ? "s" : ""} ago`
    : `${diffInYears} year${diffInYears !== 1 ? "s" : ""}`
}
