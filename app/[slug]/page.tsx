import { getTurso } from "@/lib/turso"
import { notFound } from "next/navigation"
import MarkdownRenderer from "@/components/markdown-renderer"
import Link from "next/link"

export const dynamic = 'force-dynamic'
export const revalidate = 0 

export async function generateMetadata({ params }: { params: { slug: string } }) {
    const { rows } = await getTurso().execute({
        sql: "SELECT title, ai_summary FROM articles WHERE slug = ?",
        args: [params.slug]
    });

    if (!rows || rows.length === 0) return { title: "Guide Not Found" };

    const title = rows[0].title + " | Mindcrate";
    const description = rows[0].ai_summary as string;

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            url: `https://mindcrate.vercel.app/${params.slug}`,
            siteName: "Mindcrate",
            type: "article",
        },
        twitter: {
            card: "summary",
            title,
            description,
        },
        alternates: {
            canonical: `https://mindcrate.vercel.app/${params.slug}`,
        },
    }
}

export default async function ArticlePage({ params }: { params: { slug: string } }) {
    let rows: any[] = [];
    try {
        const result = await getTurso().execute({
            sql: "SELECT * FROM articles WHERE slug = ?",
            args: [params.slug]
        });
        rows = result.rows || [];
    } catch(e) {
        console.error(e)
    }

    if (!rows || rows.length === 0) {
        notFound();
    }

    const article = rows[0];

    return (
        <main className="min-h-screen bg-black text-white">
            {/* ── Floating Top Bar ── */}
            <nav className="sticky top-0 z-50 backdrop-blur-2xl bg-black/60 border-b border-white/[0.06]">
                <div className="max-w-3xl mx-auto flex items-center justify-between px-5 py-3">
                    <Link 
                        href="/" 
                        className="group flex items-center gap-2 text-zinc-500 hover:text-white transition-colors duration-300"
                    >
                        <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                        </svg>
                        <span className="text-sm font-medium">Library</span>
                    </Link>
                    <a 
                        href="https://play.google.com/store/apps/details?id=dev.trider.app" 
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm font-semibold text-black bg-white px-4 py-1.5 rounded-full hover:bg-zinc-200 transition-colors duration-200"
                    >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 0 1-.61-.92V2.734a1 1 0 0 1 .609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.199l2.302 2.302c.312.234.5.611.5 1.007a1.228 1.228 0 0 1-.5 1.007l-2.302 2.302-2.596-2.596 2.596-3.022zM5.864 2.658L16.8 9.091l-2.302 2.302-8.634-8.735z"/>
                        </svg>
                        Download Trider
                    </a>
                </div>
            </nav>

            {/* ── Article Body ── */}
            <article className="max-w-3xl mx-auto px-5 py-12 md:py-20">
                {/* ── Dynamic Top Header (SEO Best Practice: 1 H1 per page) ── */}
                <header className="mb-10 lg:mb-14">
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-white mb-6 leading-[1.1]">
                        {article.title}
                    </h1>
                    <div className="flex items-center gap-3 text-zinc-500 text-sm font-medium">
                        <span className="flex items-center gap-1.5">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            {article.created_at ? new Date(article.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : "Recently updated"}
                        </span>
                        <span>•</span>
                        <span>by {article.author_id || "Trider Team"}</span>
                    </div>
                </header>

                <div className="prose prose-invert max-w-none prose-h1:hidden prose-h2:text-3xl prose-h2:mt-12 prose-a:text-cyan-400">
                    <MarkdownRenderer content={article.content_markdown as string} />
                </div>
                
                {/* ── Trider CTA Block ── */}
                <section className="mt-20 mb-8 relative">
                    {/* Glow effect */}
                    <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-cyan-500/20 rounded-[2rem] blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                    
                    <div className="relative p-8 md:p-12 rounded-2xl bg-[#0a0a0a] border border-white/[0.08] overflow-hidden">
                        {/* Subtle grid pattern */}
                        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />
                        
                        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-8">
                            {/* Left: Text */}
                            <div className="flex-1 space-y-4">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold tracking-wider uppercase">
                                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                                    Free on Android
                                </div>
                                <h3 className="text-2xl md:text-3xl font-bold tracking-tight text-white leading-snug">
                                    Done reading?<br />
                                    <span className="text-zinc-500">Now go build the habit.</span>
                                </h3>
                                <p className="text-sm text-zinc-500 leading-relaxed max-w-md">
                                    Trider tracks streaks, has a built-in focus timer, and lets you freeze days when life hits. No premium paywall for core features.
                                </p>
                            </div>
                            
                            {/* Right: Button */}
                            <div className="shrink-0">
                                <a 
                                    href="https://play.google.com/store/apps/details?id=dev.trider.app" 
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="group inline-flex items-center gap-3 bg-white text-black pl-5 pr-7 py-4 rounded-2xl font-bold text-base hover:scale-[1.03] active:scale-[0.98] transition-all duration-200 shadow-[0_4px_24px_-4px_rgba(255,255,255,0.15)]"
                                >
                                    <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-black/10 group-hover:bg-black/20 transition-colors">
                                        <svg className="w-5 h-5 text-black" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 0 1-.61-.92V2.734a1 1 0 0 1 .609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.199l2.302 2.302c.312.234.5.611.5 1.007a1.228 1.228 0 0 1-.5 1.007l-2.302 2.302-2.596-2.596 2.596-3.022zM5.864 2.658L16.8 9.091l-2.302 2.302-8.634-8.735z"/>
                                        </svg>
                                    </span>
                                    <span className="flex flex-col items-start leading-tight">
                                        <span className="text-[10px] font-medium text-black/50 uppercase tracking-wider">Get it on</span>
                                        <span className="text-base font-bold -mt-0.5">Google Play</span>
                                    </span>
                                </a>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── Footer ── */}
                <footer className="mt-16 pt-8 border-t border-white/[0.06] text-center">
                    <p className="text-xs text-zinc-600">
                        © {new Date().getFullYear()} Mindcrate · Guides for ADHD brains that actually work
                    </p>
                </footer>
            </article>
        </main>
    )
}
