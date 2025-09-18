"use client"

import { useEffect, useRef, useCallback, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import type { Database } from "@/types/supabase"

type CustomEmoji = Database["public"]["Tables"]["custom_emojis"]["Row"]

interface EmojiCache {
  mappings: Map<string, string>
  lastUpdated: number
}

const CACHE_DURATION = 10 * 60 * 1000 // 10 minutes
const SENSITIVE_SELECTORS = [
  "input",
  "textarea",
  "select",
  "button",
  "code",
  "pre",
  '[contenteditable="true"]',
  "[data-emoji-processed]",
  ".emoji-processed",
  "script",
  "style",
  "noscript",
]

export function GlobalEmojiRenderer() {
  const [isInitialized, setIsInitialized] = useState(false)
  const cacheRef = useRef<EmojiCache>({ mappings: new Map(), lastUpdated: 0 })
  const observerRef = useRef<MutationObserver | null>(null)
  const supabase = createClient()

  // Load emoji mappings from Supabase
  const loadEmojiMappings = useCallback(async (): Promise<Map<string, string>> => {
    try {
      const { data, error } = await supabase
        .from("custom_emojis")
        .select("original_emoji, custom_url")
        .eq("is_active", true)

      if (error) {
        console.warn("Failed to load emoji mappings:", error)
        return new Map()
      }

      const mappings = new Map<string, string>()
      data?.forEach((emoji: CustomEmoji) => {
        mappings.set(emoji.original_emoji, emoji.custom_url)
      })

      return mappings
    } catch (error) {
      console.warn("Error loading emoji mappings:", error)
      return new Map()
    }
  }, [supabase])

  // Get cached mappings or load fresh ones
  const getEmojiMappings = useCallback(async (): Promise<Map<string, string>> => {
    const now = Date.now()
    const cache = cacheRef.current

    if (cache.mappings.size > 0 && now - cache.lastUpdated < CACHE_DURATION) {
      return cache.mappings
    }

    const mappings = await loadEmojiMappings()
    cacheRef.current = { mappings, lastUpdated: now }
    return mappings
  }, [loadEmojiMappings])

  // Check if element should be skipped
  const shouldSkipElement = useCallback((element: Element): boolean => {
    // Check if element matches sensitive selectors
    if (SENSITIVE_SELECTORS.some((selector) => element.matches(selector))) {
      return true
    }

    // Check if any parent matches sensitive selectors
    let parent = element.parentElement
    while (parent) {
      if (SENSITIVE_SELECTORS.some((selector) => parent!.matches(selector))) {
        return true
      }
      parent = parent.parentElement
    }

    return false
  }, [])

  // Replace emojis in text content
  const replaceEmojisInText = useCallback(
    async (text: string): Promise<string> => {
      const mappings = await getEmojiMappings()
      if (mappings.size === 0) return text

      let result = text
      for (const [emoji, imageUrl] of mappings) {
        if (result.includes(emoji)) {
          const imgTag = `<img src="${imageUrl}" alt="${emoji}" class="inline-emoji" style="display: inline; width: 1.2em; height: 1.2em; vertical-align: -0.1em; margin: 0 0.05em; pointer-events: none; user-select: none; -webkit-user-drag: none; -webkit-touch-callout: none;" draggable="false" oncontextmenu="return false;" ondragstart="return false;" onmousedown="return false;" />`
          result = result.split(emoji).join(imgTag)
        }
      }
      return result
    },
    [getEmojiMappings],
  )

  // Process text nodes in an element
  const processTextNodes = useCallback(
    async (element: Element) => {
      if (shouldSkipElement(element)) return

      const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, {
        acceptNode: (node) => {
          const parent = node.parentElement
          if (!parent || shouldSkipElement(parent)) {
            return NodeFilter.FILTER_REJECT
          }
          return NodeFilter.FILTER_ACCEPT
        },
      })

      const textNodes: Text[] = []
      let node: Text | null
      while ((node = walker.nextNode() as Text)) {
        textNodes.push(node)
      }

      for (const textNode of textNodes) {
        const originalText = textNode.textContent || ""
        if (!originalText.trim()) continue

        // Check if text contains any emojis
        const mappings = await getEmojiMappings()
        let hasEmojis = false
        for (const emoji of mappings.keys()) {
          if (originalText.includes(emoji)) {
            hasEmojis = true
            break
          }
        }

        if (!hasEmojis) continue

        try {
          const processedText = await replaceEmojisInText(originalText)
          if (processedText !== originalText) {
            const wrapper = document.createElement("span")
            wrapper.innerHTML = processedText
            wrapper.setAttribute("data-emoji-processed", "true")

            // Replace the text node with the processed content
            const parent = textNode.parentNode
            if (parent) {
              parent.insertBefore(wrapper, textNode)
              parent.removeChild(textNode)
            }
          }
        } catch (error) {
          console.warn("Error processing text node:", error)
        }
      }
    },
    [shouldSkipElement, replaceEmojisInText, getEmojiMappings],
  )

  // Process existing content on page
  const processExistingContent = useCallback(async () => {
    const elements = document.querySelectorAll(
      "body *:not([data-emoji-processed]):not(script):not(style):not(noscript)",
    )

    for (const element of Array.from(elements)) {
      if (!shouldSkipElement(element)) {
        await processTextNodes(element)
      }
    }
  }, [processTextNodes, shouldSkipElement])

  // Handle mutations
  const handleMutations = useCallback(
    async (mutations: MutationRecord[]) => {
      for (const mutation of mutations) {
        if (mutation.type === "childList") {
          for (const node of Array.from(mutation.addedNodes)) {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as Element
              await processTextNodes(element)

              // Process child elements
              const childElements = element.querySelectorAll("*:not([data-emoji-processed])")
              for (const childElement of Array.from(childElements)) {
                await processTextNodes(childElement)
              }
            }
          }
        }
      }
    },
    [processTextNodes],
  )

  // Initialize the emoji renderer
  const initialize = useCallback(async () => {
    if (isInitialized) return

    try {
      // Load initial mappings
      await getEmojiMappings()

      // Process existing content
      await processExistingContent()

      // Set up mutation observer
      if (observerRef.current) {
        observerRef.current.disconnect()
      }

      observerRef.current = new MutationObserver(handleMutations)
      observerRef.current.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: false,
        attributes: false,
      })

      setIsInitialized(true)
    } catch (error) {
      console.warn("Failed to initialize emoji renderer:", error)
    }
  }, [isInitialized, getEmojiMappings, processExistingContent, handleMutations])

  // Subscribe to realtime updates
  useEffect(() => {
    const channel = supabase
      .channel("custom_emojis_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "custom_emojis",
        },
        () => {
          // Clear cache when emojis are updated
          cacheRef.current = { mappings: new Map(), lastUpdated: 0 }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  // Initialize on mount
  useEffect(() => {
    // Wait for DOM to be ready
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", initialize)
      return () => document.removeEventListener("DOMContentLoaded", initialize)
    } else {
      initialize()
    }
  }, [initialize])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [])

  // Add CSS styles to prevent image-like behavior
  useEffect(() => {
    const style = document.createElement("style")
    style.textContent = `
    .inline-emoji {
      pointer-events: none !important;
      user-select: none !important;
      -webkit-user-select: none !important;
      -moz-user-select: none !important;
      -ms-user-select: none !important;
      -webkit-user-drag: none !important;
      -webkit-touch-callout: none !important;
      -webkit-tap-highlight-color: transparent !important;
      outline: none !important;
      border: none !important;
    }
    .inline-emoji::-webkit-context-menu {
      display: none !important;
    }
  `
    document.head.appendChild(style)

    return () => {
      document.head.removeChild(style)
    }
  }, [])

  // This component doesn't render anything visible
  return null
}
