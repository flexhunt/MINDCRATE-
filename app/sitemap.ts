export const dynamic = 'force-dynamic'
export const revalidate = 0

import { MetadataRoute } from 'next'
import { turso } from "@/lib/turso"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    // Fetch all articles
    const { rows } = await turso.execute(
      "SELECT slug, created_at FROM articles ORDER BY created_at DESC"
    );

    const articles = rows.map((article: any) => ({
      url: `https://mindcrate.vercel.app/${article.slug}`,
      lastModified: new Date(article.created_at || Date.now()),
      changeFrequency: 'daily' as const,
      priority: 0.8,
    }))

    return [
      {
        url: 'https://mindcrate.vercel.app',
        lastModified: new Date(),
        changeFrequency: 'always',
        priority: 1,
      },
      ...articles,
    ]
  } catch (error) {
    console.error("Sitemap generation error:", error);
    return [
      {
        url: 'https://mindcrate.vercel.app',
        lastModified: new Date(),
        changeFrequency: 'always',
        priority: 1,
      }
    ]
  }
}
