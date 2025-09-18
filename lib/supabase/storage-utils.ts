"use client"

import { createClient } from "@/lib/supabase/client"

/**
 * Uploads a file to the avatars bucket, creating the bucket if it doesn't exist
 */
export async function uploadToAvatarsBucket(
  filePath: string,
  file: File,
): Promise<{ publicUrl: string | null; error: Error | null }> {
  const supabase = createClient()

  try {
    // First, try to upload directly (this will fail if bucket doesn't exist)
    const { error: uploadError } = await supabase.storage.from("avatars").upload(filePath, file, { upsert: true })

    // If upload failed because bucket doesn't exist, try to create the bucket
    if (
      uploadError &&
      (uploadError.message.includes("Bucket not found") ||
        uploadError.message.includes("bucket") ||
        uploadError.message.includes("does not exist"))
    ) {
      console.log("Bucket not found, attempting to create it...")

      try {
        // Create the bucket
        const { error: createError } = await supabase.storage.createBucket("avatars", {
          public: true,
          fileSizeLimit: 1024 * 1024 * 2, // 2MB
        })

        if (createError) {
          console.error("Error creating bucket:", createError)
          return { publicUrl: null, error: new Error(`Failed to create bucket: ${createError.message}`) }
        }

        // Try upload again after creating bucket
        const { error: retryError } = await supabase.storage.from("avatars").upload(filePath, file, { upsert: true })

        if (retryError) {
          console.error("Error uploading after bucket creation:", retryError)
          return { publicUrl: null, error: new Error(`Upload failed after bucket creation: ${retryError.message}`) }
        }
      } catch (createBucketError: any) {
        console.error("Error in bucket creation process:", createBucketError)
        return { publicUrl: null, error: new Error(`Bucket creation process failed: ${createBucketError.message}`) }
      }
    } else if (uploadError) {
      // Some other upload error occurred
      console.error("Upload error:", uploadError)
      return { publicUrl: null, error: new Error(`Upload failed: ${uploadError.message}`) }
    }

    // Get the public URL
    const { data } = supabase.storage.from("avatars").getPublicUrl(filePath)
    return { publicUrl: data.publicUrl, error: null }
  } catch (error: any) {
    console.error("Unexpected error in storage operation:", error)
    return { publicUrl: null, error: new Error(`Storage operation failed: ${error.message}`) }
  }
}
