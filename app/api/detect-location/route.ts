import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    // Get client IP from headers
    const forwarded = request.headers.get("x-forwarded-for")
    const ip = forwarded ? forwarded.split(",")[0] : request.headers.get("x-real-ip") || "127.0.0.1"

    // Use a free IP geolocation service
    const response = await fetch(`http://ip-api.com/json/${ip}`)
    const locationData = await response.json()

    if (locationData.status === "success") {
      return NextResponse.json({
        country: locationData.country,
        countryCode: locationData.countryCode,
        region: locationData.regionName,
        city: locationData.city,
        timezone: locationData.timezone,
      })
    }

    return NextResponse.json({ error: "Could not detect location" }, { status: 400 })
  } catch (error) {
    console.error("Error detecting location:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
