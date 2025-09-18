"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"
import { createClient } from "@/lib/supabase/client"
import { Alert, AlertDescription } from "@/components/ui/alert" // Add Alert import
import { AlertCircle, Loader2 } from "lucide-react" // Add icons import

interface MetaMaskLoginProps {
  isLoading: boolean
  setIsLoading: (isLoading: boolean) => void
}

// Add type definitions for window.ethereum
declare global {
  interface Window {
    ethereum?: {
      isMetaMask?: boolean
      request: (request: { method: string; params?: any[] }) => Promise<any>
    }
  }
}

export default function MetaMaskLogin({ isLoading, setIsLoading }: MetaMaskLoginProps) {
  const [isMetaMaskInstalled, setIsMetaMaskInstalled] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null) // Add error state
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsMetaMaskInstalled(!!window.ethereum && !!window.ethereum.isMetaMask)
    }
  }, [])

  async function handleMetaMaskLogin() {
    if (!isMetaMaskInstalled) {
      window.open("https://metamask.io/download/", "_blank")
      return
    }

    try {
      setIsLoading(true)
      setErrorMessage(null) // Clear previous errors

      // Request account access
      const accounts = await window.ethereum!.request({ method: "eth_requestAccounts" })
      const address = accounts[0]

      // Get the current chain ID
      const chainId = await window.ethereum!.request({ method: "eth_chainId" })

      // Create a message for the user to sign
      const message = `Login to our app with address: ${address}`

      // Ask user to sign the message
      const signature = await window.ethereum!.request({
        method: "personal_sign",
        params: [message, address],
      })

      // Verify the signature on the server or use it to authenticate
      // For this example, we'll store the address in Supabase custom claims

      // Check if user exists with this wallet address
      const { data: existingUser } = await supabase.from("profiles").select().eq("wallet_address", address).single()

      if (existingUser) {
        // User exists, log them in
        // In a real app, you would verify the signature server-side
        const { error } = await supabase.auth.signInWithPassword({
          email: `${address.toLowerCase()}@metamask.user`,
          password: signature.slice(0, 20), // Using part of the signature as password
        })

        if (error) {
          setErrorMessage(error.message || "Failed to connect with MetaMask")
          throw error
        }
      } else {
        // Create a new user
        const { error } = await supabase.auth.signUp({
          email: `${address.toLowerCase()}@metamask.user`,
          password: signature.slice(0, 20), // Using part of the signature as password
          options: {
            data: {
              wallet_address: address,
              wallet_type: "metamask",
              chain_id: chainId,
            },
          },
        })

        if (error) {
          setErrorMessage(error.message || "Failed to connect with MetaMask")
          throw error
        }

        // Create profile entry
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (user) {
          await supabase.from("profiles").insert({
            id: user.id,
            wallet_address: address,
          })
        }
      }

      router.refresh()
      router.replace("/dashboard")
    } catch (error: any) {
      console.error("MetaMask login error:", error)
      setErrorMessage(error.message || "Failed to connect with MetaMask")
      toast({
        title: "Error",
        description: error.message || "Failed to connect with MetaMask",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      {/* Display error message if there is one */}
      {errorMessage && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      <Button variant="outline" type="button" disabled={isLoading} onClick={handleMetaMaskLogin} className="w-full">
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {isMetaMaskInstalled ? "Connecting..." : "Opening MetaMask..."}
          </>
        ) : (
          <>
            <svg className="mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
              <path d="M378.7 32H133.3L16 196.2 256 496.8 496 196.2 378.7 32z" fill="#E17726" />
              <path d="M256 496.8V32H133.3L16 196.2 256 496.8z" fill="#E27625" />
            </svg>
            {isMetaMaskInstalled ? "Continue with MetaMask" : "Install MetaMask"}
          </>
        )}
      </Button>
    </>
  )
}
