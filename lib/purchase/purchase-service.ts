import { createClient } from "@/lib/supabase/client"

export interface PurchaseItem {
  id: string
  name: string
  price: number
  type: "course" | "item"
  image_url?: string
  description?: string
  stock?: number
}

export interface PurchaseResult {
  success: boolean
  message: string
  newBalance?: number
  purchaseId?: string
}

class PurchaseService {
  private supabase = createClient()

  async getUserBalance(): Promise<number> {
    try {
      const {
        data: { user },
      } = await this.supabase.auth.getUser()
      if (!user) {
        console.log("No user found")
        return 0
      }

      console.log("Getting balance for user:", user.id)

      const { data, error } = await this.supabase.from("user_coins").select("balance").eq("user_id", user.id).single()

      if (error) {
        console.error("Error getting user balance:", error)
        return 0
      }

      const balance = data?.balance || 0
      console.log("User balance:", balance)
      return balance
    } catch (error) {
      console.error("Exception getting user balance:", error)
      return 0
    }
  }

  async checkAccess(itemId: string, type: "course" | "item"): Promise<boolean> {
    try {
      const {
        data: { user },
      } = await this.supabase.auth.getUser()
      if (!user) {
        console.log("No user found for access check")
        return false
      }

      console.log("Checking access for:", itemId, type, "user:", user.id)

      if (type === "course") {
        const { data, error } = await this.supabase
          .from("user_courses")
          .select("id")
          .eq("user_id", user.id)
          .eq("course_id", itemId)
          .single()

        if (error && error.code !== "PGRST116") {
          console.error("Error checking course access:", error)
        }

        const hasAccess = !!data
        console.log("Course access result:", hasAccess)
        return hasAccess
      } else {
        const { data, error } = await this.supabase
          .from("orders")
          .select("id")
          .eq("user_id", user.id)
          .eq("item_id", itemId)
          .eq("status", "completed")
          .single()

        if (error && error.code !== "PGRST116") {
          console.error("Error checking item access:", error)
        }

        const hasAccess = !!data
        console.log("Item access result:", hasAccess)
        return hasAccess
      }
    } catch (error) {
      console.error("Exception checking access:", error)
      return false
    }
  }

  async purchaseItem(item: PurchaseItem): Promise<PurchaseResult> {
    try {
      const {
        data: { user },
      } = await this.supabase.auth.getUser()
      if (!user) {
        throw new Error("Not authenticated")
      }

      console.log("Purchasing item:", item)

      // Check if user already has access
      const hasAccess = await this.checkAccess(item.id, item.type)
      if (hasAccess) {
        return {
          success: false,
          message: `You already own this ${item.type}`,
        }
      }

      // Call the appropriate database function
      if (item.type === "course") {
        console.log("Calling process_course_purchase with:", {
          p_user_id: user.id,
          p_course_id: item.id,
          p_price: item.price,
        })

        const { data, error } = await this.supabase.rpc("process_course_purchase", {
          p_user_id: user.id,
          p_course_id: item.id,
          p_price: item.price,
        })

        if (error) {
          console.error("Course purchase error:", error)
          throw error
        }

        console.log("Course purchase result:", data)

        return {
          success: data.success,
          message: data.message,
          newBalance: data.new_balance,
          purchaseId: data.purchase_id,
        }
      } else {
        console.log("Calling process_item_purchase with:", {
          p_user_id: user.id,
          p_item_id: item.id,
          p_price: item.price,
        })

        const { data, error } = await this.supabase.rpc("process_item_purchase", {
          p_user_id: user.id,
          p_item_id: item.id,
          p_price: item.price,
        })

        if (error) {
          console.error("Item purchase error:", error)
          throw error
        }

        console.log("Item purchase result:", data)

        return {
          success: data.success,
          message: data.message,
          newBalance: data.new_balance,
          purchaseId: data.purchase_id,
        }
      }
    } catch (error: any) {
      console.error("Purchase service error:", error)
      return {
        success: false,
        message: error.message || "Purchase failed. Please try again.",
      }
    }
  }
}

export const purchaseService = new PurchaseService()
