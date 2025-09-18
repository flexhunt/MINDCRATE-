"use client"
import { createClient } from "@/lib/supabase/client"

/**
 * Clears all cookies from the browser
 */
export function clearAllCookies() {
  document.cookie.split(";").forEach((c) => {
    document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/")
  })
}

/**
 * Signs out the user and redirects to the home page
 */
export async function signOutAndRedirect() {
  const supabase = createClient()

  try {
    // First clear cookies
    clearAllCookies()

    // Then sign out from Supabase
    await supabase.auth.signOut()

    // Force a hard redirect to the home page
    window.location.href = "/"

    return true
  } catch (err) {
    console.error("Sign out failed:", err)

    // Still try to redirect
    window.location.href = "/"
    return false
  }
}
