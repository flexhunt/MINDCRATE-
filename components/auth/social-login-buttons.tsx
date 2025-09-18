"use client"

import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { FcGoogle } from "react-icons/fc"

interface SocialLoginButtonsProps {
  isLoading: boolean
  setIsLoading: (isLoading: boolean) => void
}

export default function SocialLoginButtons({ isLoading, setIsLoading }: SocialLoginButtonsProps) {
  const router = useRouter()
  const supabase = createClient()

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true)
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
    } catch (error) {
      console.log("Google login error")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      variant="outline"
      disabled={isLoading}
      onClick={handleGoogleLogin}
      className="w-full bg-white text-gray-800 hover:bg-gray-100 hover:text-gray-900 border border-gray-300 font-medium transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]"
    >
      <FcGoogle className="mr-2 h-5 w-5" />
      Continue with Google
    </Button>
  )
}
