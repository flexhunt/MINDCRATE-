import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

export const runtime = "edge"

export async function GET() {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)

    // Get all published articles with metadata
    const { data: articles, error } = await supabase
      .from("articles")
      .select("slug, updated_at, created_at, title")
      .eq("is_published", true)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching articles:", error)
      return new Response("Error fetching articles", { status: 500 })
    }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://mindcrate.vercel.app"

    // Generate XML sitemap for articles
    const articleUrls =
      articles
        ?.map((article) => {
          const lastModified = new Date(article.updated_at || article.created_at).toISOString()

          return `
    <url>
      <loc>${baseUrl}/articles/${article.slug}</loc>
      <lastmod>${lastModified}</lastmod>
      <changefreq>monthly</changefreq>
      <priority>0.8</priority>
    </url>`
        })
        .join("") || ""

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:mobile="http://www.google.com/schemas/sitemap-mobile/1.0"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
  <url>
    <loc>${baseUrl}/articles</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>${articleUrls}
</urlset>`

    return new Response(sitemap, {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400",
        "X-Robots-Tag": "noindex",
      },
    })
  } catch (error) {
    console.error("Sitemap generation error:", error)
    return new Response("Internal Server Error", { status: 500 })
  }
}
