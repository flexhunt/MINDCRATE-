"use client"

import type React from "react"
import { createContext, useContext, useState } from "react"

interface ChatServiceContextType {
  isConnected: boolean
  error: string | null
}

const ChatServiceContext = createContext<ChatServiceContextType>({
  isConnected: false,
  error: null,
})

export function useChatServiceContext() {
  return useContext(ChatServiceContext)
}

interface ChatServiceProviderProps {
  children: React.ReactNode
}

export function ChatServiceProvider({ children }: ChatServiceProviderProps) {
  const [isConnected] = useState(false)
  const [error] = useState<string | null>(null)

  return <ChatServiceContext.Provider value={{ isConnected, error }}>{children}</ChatServiceContext.Provider>
}
