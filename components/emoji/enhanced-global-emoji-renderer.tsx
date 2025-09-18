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

export function EnhancedGlobalEmojiRenderer() {
  const [isInitialized, setIsInitialized] = useState(false)
  const cacheRef = useRef<EmojiCache>({ mappings: new Map(), lastUpdated: 0 })
  const observerRef = useRef<MutationObserver | null>(null)
  const supabase = createClient()

  // Add CSS styles to prevent image-like behavior
  useEffect(() => {
    const style = document.createElement("style")
    style.id = "emoji-renderer-styles"
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
        background: transparent !important;
        cursor: inherit !important;
      }
      .inline-emoji::-webkit-context-menu {
        display: none !important;
      }
      .emoji-wrapper {
        display: inline;
        position: relative;
      }
      .emoji-wrapper::selection {
        background: transparent;
      }
      .emoji-wrapper::-moz-selection {
        background: transparent;
      }
    `

    // Remove existing style if present
    const existingStyle = document.getElementById("emoji-renderer-styles")
    if (existingStyle) {
      existingStyle.remove()
    }

    document.head.appendChild(style)

    return () => {
      const styleElement = document.getElementById("emoji-renderer-styles")
      if (styleElement) {
        styleElement.remove()
      }
    }
  }, [])

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

  // Create emoji element with proper event handling
  const createEmojiElement = useCallback((emoji: string, imageUrl: string): HTMLElement => {
    const wrapper = document.createElement("span")
    wrapper.className = "emoji-wrapper"
    wrapper.setAttribute("data-emoji", emoji)
    wrapper.setAttribute("data-emoji-processed", "true")

    const img = document.createElement("img")
    img.src = imageUrl
    img.alt = emoji
    img.className = "inline-emoji"
    img.draggable = false
    img.style.cssText = `
      display: inline;
      width: 1.2em;
      height: 1.2em;
      vertical-align: -0.1em;
      margin: 0 0.05em;
      pointer-events: none;
      user-select: none;
      -webkit-user-drag: none;
      -webkit-touch-callout: none;
      cursor: inherit;
    `

    // Prevent all image-like interactions
    const preventDefault = (e: Event) => {
      e.preventDefault()
      e.stopPropagation()
      return false
    }

    img.addEventListener("contextmenu", preventDefault)
    img.addEventListener("dragstart", preventDefault)
    img.addEventListener("mousedown", preventDefault)
    img.addEventListener("touchstart", preventDefault, { passive: false })
    img.addEventListener("selectstart", preventDefault)

    // Handle image load errors
    img.addEventListener("error", () => {
      wrapper.textContent = emoji
    })

    wrapper.appendChild(img)
    return wrapper
  }, [])

  // Replace emojis in text content
  const replaceEmojisInText = useCallback(
    async (textNode: Text): Promise<void> => {
      const mappings = await getEmojiMappings()
      if (mappings.size === 0) return

      const originalText = textNode.textContent || ""
      if (!originalText.trim()) return

      // Check if text contains any emojis
      let hasEmojis = false
      for (const emoji of mappings.keys()) {
        if (originalText.includes(emoji)) {
          hasEmojis = true
          break
        }
      }

      if (!hasEmojis) return

      const parent = textNode.parentNode
      if (!parent) return

      // Create document fragment to hold new content
      const fragment = document.createDocumentFragment()
      let lastIndex = 0
      let text = originalText

      // Process each emoji in the text
      for (const [emoji, imageUrl] of mappings) {
        const parts = text.split(emoji)
        if (parts.length > 1) {
          text = parts.join("\u0000") // Use null character as placeholder
        }
      }

      // Replace placeholders with actual content
      let currentText = originalText
      for (const [emoji, imageUrl] of mappings) {
        const index = currentText.indexOf(emoji)
        if (index !== -1) {
          // Add text before emoji
          if (index > lastIndex) {
            const textBefore = currentText.substring(lastIndex, index)
            if (textBefore) {
              fragment.appendChild(document.createTextNode(textBefore))
            }
          }

          // Add emoji element
          const emojiElement = createEmojiElement(emoji, imageUrl)
          fragment.appendChild(emojiElement)

          lastIndex = index + emoji.length
          currentText = currentText.substring(lastIndex)
          lastIndex = 0
        }
      }

      // Add remaining text
      if (currentText) {
        fragment.appendChild(document.createTextNode(currentText))
      }

      // Replace the original text node
      parent.insertBefore(fragment, textNode)
      parent.removeChild(textNode)
    },
    [getEmojiMappings, createEmojiElement],
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
        try {
          await replaceEmojisInText(textNode)
        } catch (error) {
          console.warn("Error processing text node:", error)
        }
      }
    },
    [shouldSkipElement, replaceEmojisInText],
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

  // This component doesn't render anything visible
  return null
}
