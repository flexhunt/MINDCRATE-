"use client"

import { AnimatedEmoji } from '@ayuuxh/emoji-kit'

interface EmojiFeatureProps {
    items: string[] // e.g. ["🤖 AI Coach", "🧊 Freeze Days"]
    className?: string
}

// Splits "🤖 AI Coach" into emoji + label, renders emoji as animated
function parseEmojiItem(item: string) {
    // Match leading emoji (unicode emoji characters)
    const emojiRegex = /^(\p{Emoji_Presentation}|\p{Emoji}\uFE0F|\p{Emoji_Modifier_Base})/u
    const match = item.match(emojiRegex)
    
    if (match) {
        return {
            emoji: match[0],
            label: item.slice(match[0].length).trim()
        }
    }
    
    // Handle compound emojis like 😮‍💨 🏴‍☠️ (ZWJ sequences)
    const zwjRegex = /^(.+?)(?=\s)/
    const zwjMatch = item.match(zwjRegex)
    if (zwjMatch && zwjMatch[1].length <= 8) {
        return {
            emoji: zwjMatch[1],
            label: item.slice(zwjMatch[1].length).trim()
        }
    }
    
    return { emoji: null, label: item }
}

export function EmojiFeaturePills({ items, className = "" }: EmojiFeatureProps) {
    return (
        <div className={`flex flex-wrap items-center justify-center gap-2 ${className}`}>
            {items.map((item) => {
                const { emoji, label } = parseEmojiItem(item)
                return (
                    <span 
                        key={item} 
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.03] border border-white/[0.05] text-[10px] font-semibold text-zinc-600"
                    >
                        {emoji && <AnimatedEmoji id={emoji} size={14} />}
                        {label}
                    </span>
                )
            })}
        </div>
    )
}

export function InlineEmoji({ id, size = 18 }: { id: string, size?: number }) {
    return <AnimatedEmoji id={id} size={size} />
}
