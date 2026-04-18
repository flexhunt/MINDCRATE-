import { getTurso } from "@/lib/turso";

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    // Fetch all articles
    const { rows } = await getTurso().execute(
      "SELECT slug, created_at FROM articles ORDER BY created_at DESC"
    );

    const urls = rows.map((article: any) => `
  <url>
    <loc>https://mindcrate.vercel.app/${article.slug}</loc>
    <lastmod>${new Date(article.created_at || Date.now()).toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`).join('');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

    return new Response(xml, {
      headers: {
        "Content-Type": "application/xml",
        "Cache-Control": "public, s-maxage=0, stale-while-revalidate=0",
      },
    });
  } catch (error) {
    console.error("Guides Sitemap generation error:", error);
    return new Response(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
</urlset>`, {
      headers: {
        "Content-Type": "application/xml",
      },
    });
  }
}
