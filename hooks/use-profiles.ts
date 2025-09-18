"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"

interface Profile {
  id: string
  username: string
  avatar_url?: string
  name?: string
  is_angle?: boolean
}

export function useProfiles() {
  const [profiles, setProfiles] = useState<Record<string, Profile>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        setLoading(true)
        const { data, error } = await supabase.from("profiles").select("id, username, avatar_url, name, is_angle")

        if (error) throw error

        const profilesMap: Record<string, Profile> = {}
        data?.forEach((profile) => {
          profilesMap[profile.id] = profile
        })

        setProfiles(profilesMap)
      } catch (err: any) {
        console.error("Error fetching profiles:", err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchProfiles()

    // Subscribe to profile changes
    const channel = supabase
      .channel("profiles-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "profiles",
        },
        (payload) => {
          console.log("Profile change received:", payload)

          if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
            const newProfile = payload.new as Profile
            setProfiles((prev) => ({
              ...prev,
              [newProfile.id]: newProfile,
            }))
          } else if (payload.eventType === "DELETE") {
            const deletedProfile = payload.old as Profile
            setProfiles((prev) => {
              const updated = { ...prev }
              delete updated[deletedProfile.id]
              return updated
            })
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  const getProfile = (userId: string): Profile | null => {
    return profiles[userId] || null
  }

  const refreshProfiles = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase.from("profiles").select("id, username, avatar_url, name, is_angle")

      if (error) throw error

      const profilesMap: Record<string, Profile> = {}
      data?.forEach((profile) => {
        profilesMap[profile.id] = profile
      })

      setProfiles(profilesMap)
    } catch (err: any) {
      console.error("Error refreshing profiles:", err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return {
    profiles,
    loading,
    error,
    getProfile,
    refreshProfiles,
  }
}
