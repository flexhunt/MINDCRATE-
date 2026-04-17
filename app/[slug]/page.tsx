import { getTurso } from "@/lib/turso"
import { notFound } from "next/navigation"
import MarkdownRenderer from "@/components/markdown-renderer"
import Link from "next/link"

export const dynamic = 'force-dynamic'
export const revalidate = 0 

const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=dev.trider.app"

// Contextual CTA variations - picks based on article content
const INLINE_CTAS = [
    {
        keywords: ["adhd", "focus", "attention", "distract"],
        badge: "Built for ADHD brains",
        title: "Your brain works different. Your tracker should too.",
        desc: "Trider's Freeze Day feature protects your streak when executive dysfunction hits. No guilt. No broken chains.",
        feature: "🧊 Freeze Days · 🎯 Focus Timer · 📊 No-shame tracking"
    },
    {
        keywords: ["procrastinat", "lazy", "motivation", "start"],
        badge: "Anti-procrastination tool",
        title: "Reading about it won't fix it. Tracking it might.",
        desc: "Trider sends smart nudges based on YOUR patterns. Not generic 6AM motivational garbage.",
        feature: "⚡ Smart Reminders · 🔥 Streak System · 📱 2-tap check-in"
    },
    {
        keywords: ["habit", "routine", "morning", "daily", "streak"],
        badge: "Habit tracking, reimagined",
        title: "Most habit apps are built for robots. This one isn't.",
        desc: "Miss a day? Freeze it. Hate rigid schedules? Use flexible tracking. Actually used by people who suck at consistency.",
        feature: "🔄 Flexible Habits · 🧊 Freeze Days · 👥 Squad Accountability"
    },
    {
        keywords: ["sleep", "dopamine", "screen", "phone", "detox"],
        badge: "Your recovery companion",
        title: "Track the comeback, not just the failure.",
        desc: "Trider focuses on streaks AND recovery. Because relapsing on a dopamine detox isn't the end — it's data.",
        feature: "📈 Recovery Tracking · 🧘 Mood Journal · 🔕 Focus Mode"
    },
    {
        keywords: ["study", "exam", "school", "college", "learn"],
        badge: "Study habit builder",
        title: "Stop planning to study. Start tracking the actual hours.",
        desc: "Built-in focus timer. Habit streaks for study sessions. Real data, not vibes.",
        feature: "⏱️ Focus Timer · 📚 Session Tracking · 🏆 Daily Streaks"
    },
    {
        keywords: ["kids", "children", "child", "toddler", "parenting", "bedtime"],
        badge: "Build family routines",
        title: "Kids don't follow routines. They follow consistency.",
        desc: "Track your own habits first. When you're consistent, they will be too. Use Trider to build a routine that actually sticks — for you.",
        feature: "⏰ Custom Reminders · ✅ Daily Checklist · 🔥 Streak Motivation"
    },
    {
        keywords: ["skin", "skincare", "face", "glow", "moistur", "sunscreen", "beauty"],
        badge: "Skincare habit tracker",
        title: "A perfect routine is useless if you skip it half the time.",
        desc: "Trider tracks your skincare routine like any other habit. Morning. Night. No more forgetting. No more 'I'll start Monday'.",
        feature: "🌙 Morning + Night Habits · ✅ Streak Tracking · 📸 Visual Progress"
    },
    {
        keywords: ["expense", "budget", "money", "saving", "finance", "spend"],
        badge: "Build better money habits",
        title: "Tracking expenses is a habit. Treat it like one.",
        desc: "Set a daily 'check your spending' habit in Trider. 2 minutes a day. That's all it takes to stop bleeding money without noticing.",
        feature: "📅 Daily Check-in Habit · ⏰ Reminder System · 🔥 Consistency Streaks"
    }
]

function getContextualCTA(content: string) {
    const lower = content.toLowerCase()
    for (const cta of INLINE_CTAS) {
        if (cta.keywords.some(kw => lower.includes(kw))) return cta
    }
    // Default fallback
    return INLINE_CTAS[2]
}

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
    const content = article.content_markdown as string;
    const cta = getContextualCTA(content);
    
    // Split content roughly in half for mid-article CTA injection
    const paragraphs = content.split('\n\n');
    const midPoint = Math.floor(paragraphs.length / 2);
    const firstHalf = paragraphs.slice(0, midPoint).join('\n\n');
    const secondHalf = paragraphs.slice(midPoint).join('\n\n');

    return (
        <main className="min-h-screen bg-[#050505] text-white">
            {/* ━━ Sticky Nav ━━ */}
            <nav className="sticky top-0 z-50 backdrop-blur-2xl bg-[#050505]/80 border-b border-white/[0.04]">
                <div className="max-w-3xl mx-auto flex items-center justify-between px-5 py-2.5">
                    <Link 
                        href="/" 
                        className="group flex items-center gap-2 text-zinc-600 hover:text-white transition-colors"
                    >
                        <svg className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                        </svg>
                        <span className="text-xs font-semibold tracking-wider uppercase">Mindcrate</span>
                    </Link>
                    <a 
                        href={PLAY_STORE_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black px-4 py-1.5 rounded-full transition-all duration-200 hover:shadow-[0_0_20px_-4px_rgba(16,185,129,0.5)]"
                    >
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 0 1-.61-.92V2.734a1 1 0 0 1 .609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.199l2.302 2.302c.312.234.5.611.5 1.007a1.228 1.228 0 0 1-.5 1.007l-2.302 2.302-2.596-2.596 2.596-3.022zM5.864 2.658L16.8 9.091l-2.302 2.302-8.634-8.735z"/>
                        </svg>
                        <span className="text-xs font-bold tracking-wide">Get Trider Free</span>
                    </a>
                </div>
            </nav>

            {/* ━━ Article ━━ */}
            <article className="max-w-3xl mx-auto px-5 py-10 md:py-16">
                {/* Title + Meta */}
                <header className="mb-10">
                    <h1 className="text-3xl md:text-[2.75rem] lg:text-5xl font-extrabold tracking-tight text-white leading-[1.1] mb-5">
                        {article.title}
                    </h1>
                    <div className="flex items-center gap-3 text-zinc-600 text-xs font-medium">
                        <span>
                            {article.created_at ? new Date(article.created_at as string).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : "Recently published"}
                        </span>
                        <span className="w-1 h-1 rounded-full bg-zinc-700" />
                        <span>by Mindcrate Team</span>
                    </div>
                </header>

                {/* ━━ First Half of Article ━━ */}
                <div className="prose prose-invert max-w-none article-content">
                    <MarkdownRenderer content={firstHalf} />
                </div>

                {/* ━━ MID-ARTICLE CONTEXTUAL CTA ━━ */}
                <div className="my-12 mx-auto max-w-xl">
                    <a 
                        href={PLAY_STORE_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group block p-5 rounded-2xl bg-gradient-to-br from-white/[0.04] to-white/[0.02] border border-white/[0.06] hover:border-emerald-500/30 transition-all duration-300 hover:shadow-[0_0_40px_-12px_rgba(16,185,129,0.15)]"
                    >
                        <div className="flex items-start gap-4">
                            <div className="shrink-0 w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                                <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 4.5h14.25M3 9h9.75M3 13.5h5.25M13.5 13.5L17.25 9.75M17.25 9.75L21 13.5M17.25 9.75V21" />
                                </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-[10px] font-bold tracking-widest uppercase text-emerald-400/80 mb-1">{cta.badge}</div>
                                <div className="text-sm font-bold text-white mb-1 group-hover:text-emerald-300 transition-colors">{cta.title}</div>
                                <div className="text-xs text-zinc-500 leading-relaxed">{cta.desc}</div>
                                <div className="mt-3 text-[10px] text-zinc-600 font-mono tracking-wide">{cta.feature}</div>
                            </div>
                            <svg className="w-4 h-4 text-zinc-700 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                            </svg>
                        </div>
                    </a>
                </div>

                {/* ━━ Second Half of Article ━━ */}
                <div className="prose prose-invert max-w-none article-content">
                    <MarkdownRenderer content={secondHalf} />
                </div>

                {/* ━━ BOTTOM CONVERSION BLOCK ━━ */}
                <section className="mt-16 mb-8">
                    <div className="relative p-8 md:p-10 rounded-2xl overflow-hidden"
                         style={{ background: 'linear-gradient(135deg, #0a1a0f 0%, #050505 50%, #0a0f1a 100%)' }}>
                        {/* Animated border glow */}
                        <div className="absolute inset-0 rounded-2xl border border-emerald-500/10" />
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-px bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent" />
                        
                        <div className="relative z-10 text-center space-y-5">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/15 mx-auto">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                                </span>
                                <span className="text-[10px] font-bold tracking-widest uppercase text-emerald-400">Free on Google Play</span>
                            </div>
                            
                            <h3 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                                This article is a map.<br />
                                <span className="text-zinc-500">Trider is the vehicle.</span>
                            </h3>
                            
                            <p className="text-sm text-zinc-500 max-w-md mx-auto leading-relaxed">
                                Streak tracking. Focus timer. Mood journal. Freeze days for when life hits. Built by someone with ADHD, for people with ADHD.
                            </p>

                            {/* Social proof */}
                            <div className="flex items-center justify-center gap-6 text-zinc-600 text-xs font-medium pt-2">
                                <span className="flex items-center gap-1.5">
                                    <svg className="w-3.5 h-3.5 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                                    </svg>
                                    4.8 on Play Store
                                </span>
                                <span className="w-1 h-1 rounded-full bg-zinc-700" />
                                <span>100% Free Core</span>
                                <span className="w-1 h-1 rounded-full bg-zinc-700" />
                                <span>No Ads</span>
                            </div>
                            
                            <div className="pt-3">
                                <a 
                                    href={PLAY_STORE_URL}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="group inline-flex items-center gap-3 bg-emerald-500 hover:bg-emerald-400 text-black px-8 py-3.5 rounded-full font-bold text-sm transition-all duration-200 hover:shadow-[0_0_30px_-8px_rgba(16,185,129,0.5)] hover:scale-[1.03] active:scale-[0.98]"
                                >
                                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 0 1-.61-.92V2.734a1 1 0 0 1 .609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.199l2.302 2.302c.312.234.5.611.5 1.007a1.228 1.228 0 0 1-.5 1.007l-2.302 2.302-2.596-2.596 2.596-3.022zM5.864 2.658L16.8 9.091l-2.302 2.302-8.634-8.735z"/>
                                    </svg>
                                    Download Trider — It's Free
                                </a>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ━━ Footer ━━ */}
                <footer className="mt-12 pt-6 border-t border-white/[0.04] text-center">
                    <p className="text-[11px] text-zinc-700">
                        © {new Date().getFullYear()} Mindcrate · Written for the people who Googled this at 2AM
                    </p>
                </footer>
            </article>
        </main>
    )
}
