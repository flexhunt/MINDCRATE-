import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()

    // Get the current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { courseId, price } = await request.json()

    if (!courseId || typeof price !== "number") {
      return NextResponse.json({ error: "Invalid request data" }, { status: 400 })
    }

    // Verify the course exists and get its details
    const { data: course, error: courseError } = await supabase
      .from("courses")
      .select("id, title, price, is_published")
      .eq("id", courseId)
      .single()

    if (courseError || !course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 })
    }

    if (!course.is_published) {
      return NextResponse.json({ error: "Course is not available for purchase" }, { status: 400 })
    }

    if (course.price !== price) {
      return NextResponse.json({ error: "Price mismatch" }, { status: 400 })
    }

    // Check if user already owns the course
    const { data: existingPurchase } = await supabase
      .from("user_courses")
      .select("id")
      .eq("user_id", user.id)
      .eq("course_id", courseId)
      .single()

    if (existingPurchase) {
      return NextResponse.json({ error: "You already own this course" }, { status: 400 })
    }

    // Process the purchase using the database function
    const { data: result, error: purchaseError } = await supabase.rpc("process_course_purchase", {
      p_user_id: user.id,
      p_course_id: courseId,
      p_price: price,
    })

    if (purchaseError) {
      console.error("Purchase error:", purchaseError)
      return NextResponse.json({ error: "Purchase failed" }, { status: 500 })
    }

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      newBalance: result.new_balance,
      purchaseId: result.purchase_id,
    })
  } catch (error) {
    console.error("Course purchase API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
