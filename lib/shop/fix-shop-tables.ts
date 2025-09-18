import { createClient } from "@/lib/supabase/client"

/**
 * Fixes the structure of the shop tables by adding missing columns
 */
export async function fixShopTables() {
  const supabase = createClient()

  try {
    // Check if items table exists
    const { data: columns, error: columnsError } = await supabase
      .from("items")
      .select("id")
      .limit(1)
      .catch((err) => {
        // If table doesn't exist, return empty result
        if (err.message.includes("does not exist")) {
          return { data: null, error: { message: "Table does not exist" } }
        }
        throw err
      })

    // If we can query the table, check for missing columns
    if (columns !== null) {
      console.log("Items table exists, checking columns...")

      // Try to add missing columns if they don't exist
      try {
        await supabase.query(`
          DO $$
          BEGIN
            -- Check if created_by column exists
            IF NOT EXISTS (
              SELECT 1 
              FROM information_schema.columns 
              WHERE table_name = 'items' AND column_name = 'created_by'
            ) THEN
              -- Add created_by column
              ALTER TABLE public.items 
              ADD COLUMN created_by UUID;
            END IF;

            -- Check if image_url column exists
            IF NOT EXISTS (
              SELECT 1 
              FROM information_schema.columns 
              WHERE table_name = 'items' AND column_name = 'image_url'
            ) THEN
              -- Add image_url column
              ALTER TABLE public.items 
              ADD COLUMN image_url TEXT;
            END IF;
          END $$;
        `)
        console.log("Added missing columns if they were missing")
      } catch (error) {
        console.error("Error adding missing columns:", error)
      }
    }

    // Check if is_admin function exists
    try {
      const { error: functionError } = await supabase.rpc("is_admin", {
        user_id: "00000000-0000-0000-0000-000000000000", // Dummy UUID for testing
      })

      // If function doesn't exist, create it
      if (functionError && functionError.message.includes("does not exist")) {
        console.log("is_admin function does not exist, creating it...")

        await supabase.query(`
          CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
          RETURNS BOOLEAN AS $$
          BEGIN
            RETURN EXISTS (
              SELECT 1 FROM public.admin_users WHERE user_id = $1
            );
          END;
          $$ LANGUAGE plpgsql SECURITY DEFINER;
        `)
        console.log("Created is_admin function")
      }
    } catch (error) {
      console.error("Error checking/creating is_admin function:", error)
    }

    return { success: true }
  } catch (error) {
    console.error("Error fixing shop tables:", error)
    return { success: false, error }
  }
}
