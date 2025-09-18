"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

interface VerifiedUsersContextType {
  verifiedUsers: Set<string>
  isVerified: (userId: string) => boolean
  refreshVerifiedUsers: () => Promise<void>
}

const VerifiedUsersContext = createContext<VerifiedUsersContextType>({
  verifiedUsers: new Set(),
  isVerified: () => false,
  refreshVerifiedUsers: async () => {},
})

export const useVerifiedUsers = () => useContext(VerifiedUsersContext)

export function VerifiedUsersProvider({ children }: { children: React.ReactNode }) {
  const [verifiedUsers, setVerifiedUsers] = useState<Set<string>>(new Set())
  const supabase = createClient()

  const refreshVerifiedUsers = async () => {
    try {
      const { data, error } = await supabase.from("profiles").select("id").eq("verified", true)

      if (error) throw error

      const verifiedIds = new Set(data?.map((profile) => profile.id) || [])
      setVerifiedUsers(verifiedIds)
    } catch (error) {
      console.error("Error fetching verified users:", error)
    }
  }

  const isVerified = (userId: string) => {
    return verifiedUsers.has(userId)
  }

  useEffect(() => {
    refreshVerifiedUsers()

    // Subscribe to changes in verified status
    const channel = supabase
      .channel("verified-users-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "profiles",
          filter: "verified=eq.true",
        },
        () => {
          refreshVerifiedUsers()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  return (
    <VerifiedUsersContext.Provider value={{ verifiedUsers, isVerified, refreshVerifiedUsers }}>
      {children}
    </VerifiedUsersContext.Provider>
  )
}
