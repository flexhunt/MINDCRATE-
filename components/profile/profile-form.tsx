"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { toast } from "@/components/ui/use-toast"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { User } from "@supabase/supabase-js"
import { Loader2, Camera, Check, AlertCircle, UserIcon, AtSign, Globe, FileText } from "lucide-react"
import ProfileUrl from "./profile-url"
import { uploadToAvatarsBucket } from "@/lib/supabase/storage-utils"
import { Alert, AlertDescription } from "@/components/ui/alert"

const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  username: z
    .string()
    .min(3, { message: "Username must be at least 3 characters" })
    .regex(/^[a-zA-Z0-9_]+$/, { message: "Username can only contain letters, numbers, and underscores" }),
  bio: z.string().max(160, { message: "Bio must be less than 160 characters" }).optional().or(z.literal("")),
  website: z.string().url({ message: "Please enter a valid URL" }).optional().or(z.literal("")),
})

type FormValues = z.infer<typeof formSchema>

interface ProfileFormProps {
  profile: any
  user: User
}

export default function ProfileForm({ profile, user }: ProfileFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(profile?.avatar_url || null)
  const [uploading, setUploading] = useState(false)
  const [usernameAvailable, setUsernameAvailable] = useState(true)
  const [usernameChecking, setUsernameChecking] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const defaultValues = {
    name: profile?.name || user?.user_metadata?.name || "",
    username: profile?.username || "",
    bio: profile?.bio || "",
    website: profile?.website || "",
  }

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  })

  useEffect(() => {
    if (profile) {
      form.reset({
        name: profile.name || user?.user_metadata?.name || "",
        username: profile.username || "",
        bio: profile.bio || "",
        website: profile.website || "",
      })
    }
  }, [profile, user, form])

  const username = form.watch("username")

  useEffect(() => {
    const checkUsername = async () => {
      if (!username || username === profile?.username || username.length < 3) {
        setUsernameAvailable(true)
        return
      }

      try {
        setUsernameChecking(true)
        const { data, error } = await supabase
          .from("profiles")
          .select("username")
          .eq("username", username)
          .neq("id", user.id)
          .limit(1)

        if (error) {
          console.error("Username check error:", error)
          setUsernameAvailable(true) // Default to available on error
          return
        }

        setUsernameAvailable(!(data && data.length > 0))
      } catch (error) {
        console.error("Username check error:", error)
        setUsernameAvailable(true)
      } finally {
        setUsernameChecking(false)
      }
    }

    const timer = setTimeout(() => {
      checkUsername()
    }, 500)

    return () => clearTimeout(timer)
  }, [username, profile?.username, supabase, user.id])

  async function onSubmit(values: FormValues) {
    try {
      if (!usernameAvailable) {
        toast({
          title: "Username not available",
          description: "Please choose a different username.",
          variant: "destructive",
        })
        return
      }

      setIsLoading(true)
      setSaveSuccess(false)

      const updateData = {
        id: user.id,
        name: values.name,
        username: values.username,
        bio: values.bio || null,
        website: values.website || null,
      }

      const { data, error } = await supabase.from("profiles").upsert(updateData).select()

      if (error) {
        console.error("Profile update error:", error)
        throw error
      }

      setSaveSuccess(true)

      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      })

      router.refresh()

      if (data && data.length > 0) {
        const updatedProfile = data[0]
        setAvatarUrl(updatedProfile.avatar_url)
      }
    } catch (error: any) {
      console.error("Profile update error:", error)

      let errorMessage = "Failed to update profile. Please try again."

      if (error?.message?.includes("column")) {
        errorMessage = "Some profile fields couldn't be updated. The database schema may need to be updated."
      } else if (error?.message?.includes("unique constraint")) {
        errorMessage = "Username is already taken. Please choose a different username."
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
      setTimeout(() => {
        setSaveSuccess(false)
      }, 3000)
    }
  }

  async function uploadAvatar(event: React.ChangeEvent<HTMLInputElement>) {
    try {
      setUploading(true)

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error("You must select an image to upload.")
      }

      const file = event.target.files[0]
      const fileExt = file.name.split(".").pop()
      const filePath = `${user.id}-${Math.random()}.${fileExt}`

      const { publicUrl, error } = await uploadToAvatarsBucket(filePath, file)

      if (error || !publicUrl) {
        throw error || new Error("Failed to get public URL for uploaded file")
      }

      const { error: updateError } = await supabase.from("profiles").update({ avatar_url: publicUrl }).eq("id", user.id)

      if (updateError) {
        console.error("Avatar update error:", updateError)
        throw updateError
      }

      setAvatarUrl(publicUrl)

      toast({
        title: "Avatar updated",
        description: "Your profile picture has been updated successfully.",
      })

      router.refresh()
    } catch (error: any) {
      console.error("Avatar upload error:", error)
      toast({
        title: "Error",
        description: error.message || "Error uploading avatar.",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Avatar Section */}
      <div className="flex flex-col items-center space-y-6">
        <div className="relative group">
          <Avatar className="h-32 w-32 border-4 border-white shadow-xl ring-4 ring-blue-100 dark:ring-blue-900/30">
            <AvatarImage src={avatarUrl || ""} alt={profile?.name || "User"} className="object-cover" />
            <AvatarFallback className="text-3xl bg-gradient-to-br from-blue-500 to-purple-600 text-white">
              {(profile?.name || user?.email || "U").charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <label
            htmlFor="avatar-upload"
            className="absolute -bottom-2 -right-2 flex h-12 w-12 cursor-pointer items-center justify-center rounded-full bg-blue-600 text-white shadow-lg ring-4 ring-white dark:ring-gray-800 transition-all hover:bg-blue-700 hover:scale-105 group-hover:shadow-xl"
          >
            {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Camera className="h-5 w-5" />}
            <span className="sr-only">Change Avatar</span>
          </label>
          <input
            id="avatar-upload"
            type="file"
            accept="image/*"
            onChange={uploadAvatar}
            disabled={uploading}
            className="hidden"
          />
        </div>

        {profile?.username && (
          <div className="text-center">
            <ProfileUrl username={profile.username} />
          </div>
        )}
      </div>

      {saveSuccess && (
        <Alert className="bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300 border-green-200 dark:border-green-900 rounded-xl">
          <Check className="h-4 w-4" />
          <AlertDescription className="font-medium">Your profile has been updated successfully!</AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Name Field */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2 text-base font-medium">
                  <UserIcon className="h-4 w-4 text-blue-600" />
                  Display Name
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="Your full name"
                    {...field}
                    className="h-12 text-base rounded-xl border-2 focus:border-blue-500 transition-colors"
                  />
                </FormControl>
                <FormDescription className="text-sm">
                  This is your public display name that others will see.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Username Field */}
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2 text-base font-medium">
                  <AtSign className="h-4 w-4 text-purple-600" />
                  Username <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      placeholder="yourusername"
                      {...field}
                      className={`h-12 text-base rounded-xl border-2 pr-12 transition-colors ${
                        !usernameAvailable ? "border-red-500 focus:border-red-500" : "focus:border-purple-500"
                      }`}
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {usernameChecking ? (
                        <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                      ) : username && !usernameAvailable ? (
                        <AlertCircle className="h-5 w-5 text-red-500" />
                      ) : username && usernameAvailable ? (
                        <Check className="h-5 w-5 text-green-500" />
                      ) : null}
                    </div>
                  </div>
                </FormControl>
                <FormDescription className="flex justify-between text-sm">
                  <span>Your unique username for your profile URL.</span>
                  {usernameChecking ? (
                    <span className="text-gray-500">Checking...</span>
                  ) : !usernameAvailable ? (
                    <span className="text-red-500 font-medium">Already taken</span>
                  ) : username ? (
                    <span className="text-green-600 font-medium">Available ✓</span>
                  ) : null}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Bio Field */}
          <FormField
            control={form.control}
            name="bio"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2 text-base font-medium">
                  <FileText className="h-4 w-4 text-green-600" />
                  Bio
                </FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Tell us a little bit about yourself..."
                    className="min-h-[100px] text-base rounded-xl border-2 focus:border-green-500 transition-colors resize-none"
                    {...field}
                    value={field.value || ""}
                  />
                </FormControl>
                <FormDescription className="flex justify-between text-sm">
                  <span>Brief description for your profile.</span>
                  <span className="text-gray-500">{(field.value || "").length}/160</span>
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Website Field */}
          <FormField
            control={form.control}
            name="website"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2 text-base font-medium">
                  <Globe className="h-4 w-4 text-orange-600" />
                  Website
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="https://example.com"
                    {...field}
                    value={field.value || ""}
                    className="h-12 text-base rounded-xl border-2 focus:border-orange-500 transition-colors"
                  />
                </FormControl>
                <FormDescription className="text-sm">Your personal or professional website URL.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isLoading || !usernameAvailable}
            className="w-full h-12 text-base font-medium rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Saving Changes...
              </>
            ) : saveSuccess ? (
              <>
                <Check className="mr-2 h-5 w-5" />
                Saved Successfully!
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </form>
      </Form>
    </div>
  )
}
