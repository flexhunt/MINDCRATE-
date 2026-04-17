export const dynamic = 'force-dynamic'
export const revalidate = 0

import { getTurso } from "@/lib/turso"
import Link from "next/link"

const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=dev.trider.app"

export default async function Home() {
    let rows: any[] = [];
    try {
        const result = await getTurso().execute(
            "SELECT slug, title, ai_summary, created_at FROM articles ORDER BY created_at DESC LIMIT 100"
        );
        rows = result.rows || [];
    } catch (e) {
        console.error("Database connection failed:", e);
    }

    return (
        <main className="min-h-screen bg-[#050505] text-white">
            {/* ━━ Top Nav ━━ */}
            <nav className="sticky top-0 z-50 backdrop-blur-2xl bg-[#050505]/80 border-b border-white/[0.04]">
                <div className="max-w-5xl mx-auto flex items-center justify-between px-5 py-3">
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center">
                            <span className="text-emerald-400 text-xs font-black">M</span>
                        </div>
                        <span className="text-sm font-bold tracking-tight text-white">Mindcrate</span>
                    </div>
                    <a 
                        href={PLAY_STORE_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black px-4 py-1.5 rounded-full transition-all duration-200 hover:shadow-[0_0_20px_-4px_rgba(16,185,129,0.5)]"
                    >
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 0 1-.61-.92V2.734a1 1 0 0 1 .609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.199l2.302 2.302c.312.234.5.611.5 1.007a1.228 1.228 0 0 1-.5 1.007l-2.302 2.302-2.596-2.596 2.596-3.022zM5.864 2.658L16.8 9.091l-2.302 2.302-8.634-8.735z"/>
                        </svg>
                        <span className="text-xs font-bold tracking-wide">Get Trider Free</span>
                    </a>
                </div>
            </nav>

            {/* ━━ Hero Section ━━ */}
            <section className="max-w-5xl mx-auto px-5 pt-16 pb-12 md:pt-24 md:pb-16">
                <div className="max-w-2xl space-y-5">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/15">
                        <span className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                        </span>
                        <span className="text-[10px] font-bold tracking-widest uppercase text-emerald-400">{rows.length} guides and counting</span>
                    </div>
                    <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-[1.05]">
                        Guides that don't<br />
                        <span className="text-zinc-500">waste your time.</span>
                    </h1>
                    <p className="text-base md:text-lg text-zinc-500 leading-relaxed max-w-lg">
                        Practical guides for ADHD brains, procrastinators, and anyone who's Googled "how to be productive" at 2AM. No fluff. No 47-step morning routines.
                    </p>
                </div>
            </section>

            {/* ━━ Trider Feature Strip ━━ */}
            <section className="max-w-5xl mx-auto px-5 mb-12">
                <a 
                    href={PLAY_STORE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 p-5 rounded-2xl bg-gradient-to-r from-emerald-500/[0.06] to-transparent border border-emerald-500/10 hover:border-emerald-500/25 transition-all duration-300"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center shrink-0">
                            <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                            </svg>
                        </div>
                        <div>
                            <div className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">Try Trider — the habit tracker for people who hate habit trackers</div>
                            <div className="text-xs text-zinc-600 mt-0.5">Streaks · Focus Timer · Freeze Days · Mood Journal · Free</div>
                        </div>
                    </div>
                    <div className="sm:ml-auto shrink-0">
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 group-hover:gap-2.5 transition-all">
                            Download
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                            </svg>
                        </span>
                    </div>
                </a>
            </section>

            {/* ━━ Article Grid ━━ */}
            <section className="max-w-5xl mx-auto px-5 pb-20">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {rows.map((row: any, i: number) => (
                        <Link 
                            key={row.slug} 
                            href={`/${row.slug}`}
                            className={`group block p-5 rounded-xl border border-white/[0.04] hover:border-white/[0.1] bg-white/[0.02] hover:bg-white/[0.04] transition-all duration-300 ${i === 0 ? 'md:col-span-2' : ''}`}
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                    <h2 className={`font-bold tracking-tight text-white group-hover:text-emerald-300 transition-colors mb-2 ${i === 0 ? 'text-xl md:text-2xl' : 'text-base'}`}>
                                        {row.title as string}
                                    </h2>
                                    <p className={`text-zinc-500 leading-relaxed line-clamp-2 ${i === 0 ? 'text-sm' : 'text-xs'}`}>
                                        {row.ai_summary as string}
                                    </p>
                                    <div className="mt-3 text-[10px] font-medium tracking-wider text-zinc-700 uppercase">
                                        {row.created_at ? new Date(row.created_at as string).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : ""}
                                    </div>
                                </div>
                                <svg className="w-4 h-4 text-zinc-800 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                </svg>
                            </div>
                        </Link>
                    ))}
                    
                    {rows.length === 0 && (
                        <div className="md:col-span-2 text-zinc-600 italic p-12 text-center text-sm border border-dashed border-white/[0.06] rounded-xl">
                            No guides published yet. Check back soon.
                        </div>
                    )}
                </div>
            </section>

            {/* ━━ Footer ━━ */}
            <footer className="border-t border-white/[0.04] py-8 text-center">
                <p className="text-[11px] text-zinc-700">
                    © {new Date().getFullYear()} Mindcrate · Built by the <a href={PLAY_STORE_URL} target="_blank" className="text-zinc-500 hover:text-emerald-400 transition-colors">Trider</a> team
                </p>
            </footer>
        </main>
    )
}
