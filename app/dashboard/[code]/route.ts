import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: { code: string } }) {
  const code = params.code

  // Simply redirect to the API endpoint
  const apiUrl = new URL(`/api/coins/process-coin-link?code=${encodeURIComponent(code)}`, request.url)
  return NextResponse.redirect(apiUrl)
}
