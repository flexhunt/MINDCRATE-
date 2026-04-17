export const revalidate = 0; // Disable static caching for now

import { turso } from "@/lib/turso"
import Link from "next/link"

export default async function Home() {
    const { rows } = await turso.execute(
        "SELECT slug, title, description, created_at FROM articles ORDER BY created_at DESC LIMIT 100"
    );

    return (
        <main className="min-h-screen bg-black text-white p-6 md:p-12 lg:p-24 selection:bg-cyan-500/30">
            <div className="max-w-4xl mx-auto space-y-12">
                <div className="space-y-4">
                    <h1 className="text-4xl md:text-6xl font-black tracking-tighter">
                        Unlock Your <span className="text-cyan-400">Potential.</span>
                    </h1>
                    <p className="text-xl text-zinc-400 max-w-2xl leading-relaxed">
                        The ultimate library of guides for ADHD, executive dysfunction, and practical productivity. Stop reading generic advice and start building habits that actually stick.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-6 pt-8 border-t border-white/10">
                    {rows.map((row: any) => (
                        <Link 
                            key={row.slug} 
                            href={`/${row.slug}`}
                            className="block p-6 rounded-2xl border border-white/5 bg-white/5 hover:bg-white/10 transition-all group"
                        >
                            <h2 className="text-2xl font-bold mb-2 group-hover:text-cyan-400 transition-colors">
                                {row.title}
                            </h2>
                            <p className="text-zinc-400 leading-relaxed max-w-3xl">
                                {row.description}
                            </p>
                            <div className="mt-4 text-xs font-semibold tracking-wider text-zinc-600 uppercase">
                                {new Date(row.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                            </div>
                        </Link>
                    ))}
                    
                    {rows.length === 0 && (
                        <div className="text-zinc-500 italic p-12 text-center border border-dashed border-white/10 rounded-2xl">
                            Loading fresh guides...
                        </div>
                    )}
                </div>
            </div>
        </main>
    )
}
