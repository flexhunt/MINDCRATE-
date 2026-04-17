import { turso } from "@/lib/turso"
import { notFound } from "next/navigation"
import MarkdownRenderer from "@/components/markdown-renderer"
import { ArrowLeft, Download, Crown } from "lucide-react"
import Link from "next/link"

export const revalidate = 0; // Disable static caching for now

export async function generateMetadata({ params }: { params: { slug: string } }) {
    const { rows } = await turso.execute({
        sql: "SELECT title, description FROM articles WHERE slug = ?",
        args: [params.slug]
    });

    if (!rows || rows.length === 0) return { title: "Guide Not Found" };

    return {
        title: rows[0].title + " | Mindcrate",
        description: rows[0].description,
    }
}

export default async function ArticlePage({ params }: { params: { slug: string } }) {
    const { rows } = await turso.execute({
        sql: "SELECT * FROM articles WHERE slug = ?",
        args: [params.slug]
    });

    if (!rows || rows.length === 0) {
        notFound();
    }

    const article = rows[0];

    return (
        <main className="min-h-screen bg-black text-white selection:bg-cyan-500/30">
            {/* Header bar */}
            <div className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/10 p-4">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <Link href="/" className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                        <span className="font-semibold text-sm tracking-widest uppercase">Back to Library</span>
                    </Link>
                    <a href="https://play.google.com/store/apps/details?id=dev.trider.in" target="_blank" className="bg-cyan-500 text-black px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-cyan-400 transition-colors">
                        Get App
                    </a>
                </div>
            </div>

            <article className="max-w-4xl mx-auto p-6 md:p-12 lg:p-24">
                {/* Article content */}
                <div className="prose prose-invert prose-cyan max-w-none prose-lg md:prose-xl">
                    <MarkdownRenderer content={article.content_markdown as string} />
                </div>
                
                {/* The Trider Funnel CTA */}
                <div className="mt-24 mb-12 p-8 md:p-12 rounded-[2rem] bg-gradient-to-br from-[#0f1115] to-[#050608] border border-white/10 shadow-2xl relative overflow-hidden group">
                    <div className="absolute inset-0 bg-cyan-500/5 group-hover:bg-cyan-500/10 transition-colors duration-500" />
                    
                    <div className="relative z-10 flex flex-col items-center text-center space-y-6">
                        <div className="w-16 h-16 rounded-2xl bg-black border border-white/10 flex items-center justify-center mb-2 shadow-[0_0_30px_-5px_rgba(0,229,255,0.3)]">
                            <Crown className="w-8 h-8 text-cyan-400" />
                        </div>
                        <h3 className="text-3xl md:text-5xl font-black tracking-tighter text-white">
                            Stop Reading. <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Start Tracking.</span>
                        </h3>
                        <p className="text-lg md:text-xl text-zinc-400 max-w-2xl leading-relaxed">
                            Generic advice won't fix executive dysfunction. Trider is a habit tracker built for people who hate structure. Use the "Freeze Day" feature to protect streaks when paralysis hits.
                        </p>
                        
                        <div className="pt-6">
                            <a 
                                href="https://play.google.com/store/apps/details?id=dev.trider.in" 
                                target="_blank"
                                className="inline-flex items-center gap-3 bg-white text-black px-10 py-5 rounded-full text-lg font-bold hover:scale-105 transition-transform duration-300 shadow-[0_0_40px_-10px_rgba(255,255,255,0.5)]"
                            >
                                <Download className="w-6 h-6" />
                                Download on Android
                            </a>
                        </div>
                    </div>
                </div>
            </article>
        </main>
    )
}
