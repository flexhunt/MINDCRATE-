import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import AdminClient from "./admin-client"

export default async function ShopAdminPage() {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)

  try {
    // Get the current session
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return redirect("/")
    }

    // Fetch profile data
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single()

    if (profileError) {
      console.error("Profile fetch error:", profileError)
    }

    // Check if shop tables exist
    let shopTablesExist = true
    let isAdmin = false
    let items = []

    // Check if items table exists
    try {
      const { error: itemsError } = await supabase.from("items").select("count").limit(1)

      if (itemsError) {
        console.error("Items fetch error:", itemsError)
        if (itemsError.message.includes("relation") && itemsError.message.includes("does not exist")) {
          shopTablesExist = false
        }
      }
    } catch (error) {
      console.error("Error checking items table:", error)
      shopTablesExist = false
    }

    // If shop tables exist, check if user is admin and get items
    if (shopTablesExist) {
      try {
        // Check if admin_users table exists
        const { error: adminTableError } = await supabase.from("admin_users").select("user_id").limit(1)

        if (adminTableError && adminTableError.message.includes("does not exist")) {
          // Admin table doesn't exist, create it and make current user admin
          try {
            // Create admin_users table using a stored procedure if available
            await supabase.rpc("create_admin_table").catch(() => {
              console.log("create_admin_table function not available")
            })

            // Insert the current user as admin
            await supabase.from("admin_users").insert({
              user_id: session.user.id,
              granted_by: session.user.id,
            })

            isAdmin = true
          } catch (error) {
            console.error("Error creating admin table:", error)
            // Call our fix-db endpoint as a fallback
            await fetch("/api/shop/fix-db", { method: "POST" })
          }
        } else {
          // Check if user is admin directly from the table
          const { data: adminData, error: adminError } = await supabase
            .from("admin_users")
            .select("user_id")
            .eq("user_id", session.user.id)
            .single()

          if (adminError && adminError.code !== "PGRST116") {
            console.error("Admin check error:", adminError)
          } else {
            isAdmin = !!adminData
          }

          // If not admin and is_admin function exists, try that as fallback
          if (!isAdmin) {
            try {
              // Use updated parameter name
              const { data: adminCheck, error: adminCheckError } = await supabase.rpc("is_admin", {
                input_user_id: session.user.id,
              })

              if (adminCheckError) {
                console.error("Admin check error:", adminCheckError)
                if (!adminCheckError.message.includes("does not exist")) {
                  // Some other error, not just missing function
                  console.error("Unexpected admin check error:", adminCheckError)
                }
              } else {
                isAdmin = !!adminCheck
              }
            } catch (error) {
              console.error("Error checking admin status:", error)
            }
          }
        }

        // If user is admin, get items
        if (isAdmin) {
          try {
            const { data: itemsData, error: itemsError } = await supabase
              .from("items")
              .select("*")
              .order("created_at", { ascending: false })

            if (itemsError) {
              console.error("Items fetch error:", itemsError)
            } else {
              items = itemsData || []
            }
          } catch (error) {
            console.error("Error fetching items:", error)
          }
        }
      } catch (error) {
        console.error("Error in admin checks:", error)
      }
    }

    // Pass data to client component
    return (
      <AdminClient
        user={session.user}
        profile={profile || {}}
        items={items}
        shopTablesExist={shopTablesExist}
        isAdmin={isAdmin}
      />
    )
  } catch (error) {
    console.error("Shop admin page error:", error)
    return redirect("/shop")
  }
}
