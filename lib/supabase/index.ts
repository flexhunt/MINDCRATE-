// This file provides guidance on which Supabase client to use

/**
 * IMPORTANT: Use the correct Supabase client based on your file location
 *
 * For App Router (files in /app directory):
 * \`\`\`
 * import { createClient } from "@/lib/supabase/server"
 * \`\`\`
 *
 * For Pages Router (files in /pages directory):
 * \`\`\`
 * import { createClientForPages } from "@/lib/supabase/pages-server"
 * \`\`\`
 */

// Re-export nothing - this file is just for documentation
