"use client"

import { createClient } from "@/lib/supabase/client"

/**
 * Uploads a research paper file to the papers bucket
 */
export async function uploadToPapersBucket(
  filePath: string,
  file: File,
): Promise<{ publicUrl: string | null; error: Error | null }> {
  const supabase = createClient()

  try {
    // First, try to upload directly (this will fail if bucket doesn't exist)
    const { error: uploadError } = await supabase.storage
      .from("research-papers")
      .upload(filePath, file, { upsert: true })

    // If upload failed because bucket doesn't exist, try to create the bucket
    if (
      uploadError &&
      (uploadError.message.includes("Bucket not found") ||
        uploadError.message.includes("bucket") ||
        uploadError.message.includes("does not exist"))
    ) {
      console.log("Papers bucket not found, attempting to create it...")

      try {
        // Create the bucket with larger file size limit for research papers
        const { error: createError } = await supabase.storage.createBucket("research-papers", {
          public: true,
          fileSizeLimit: 1024 * 1024 * 50, // 50MB for research papers
        })

        if (createError) {
          console.error("Error creating papers bucket:", createError)
          return { publicUrl: null, error: new Error(`Failed to create bucket: ${createError.message}`) }
        }

        // Try upload again after creating bucket
        const { error: retryError } = await supabase.storage
          .from("research-papers")
          .upload(filePath, file, { upsert: true })

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
    const { data } = supabase.storage.from("research-papers").getPublicUrl(filePath)
    return { publicUrl: data.publicUrl, error: null }
  } catch (error: any) {
    console.error("Unexpected error in papers storage operation:", error)
    return { publicUrl: null, error: new Error(`Storage operation failed: ${error.message}`) }
  }
}

/**
 * Extract text content from PDF file for search indexing
 */
export async function extractPDFText(file: File): Promise<string> {
  // This is a placeholder - in a real implementation, you'd use a PDF parsing library
  // For now, we'll return the filename as searchable content
  return `PDF content from ${file.name}`
}

/**
 * Validate research paper file
 */
export function validatePaperFile(file: File): { isValid: boolean; error?: string } {
  // Check file type
  if (file.type !== "application/pdf") {
    return { isValid: false, error: "Only PDF files are allowed" }
  }

  // Check file size (50MB limit)
  const maxSize = 50 * 1024 * 1024
  if (file.size > maxSize) {
    return { isValid: false, error: "File size must be less than 50MB" }
  }

  return { isValid: true }
}
