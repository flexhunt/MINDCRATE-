export const dynamic = "force-dynamic"

export async function GET() {
  // Redirect to our working sitemap
  const response = await fetch("https://mindcrate.vercel.app/api/generate-sitemap")
  const sitemap = await response.text()

  return new Response(sitemap, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
    },
  })
}
