import type { Metadata } from "next"
import AuthForm from "@/components/auth/auth-form"
import Link from "next/link"
import { Brain } from "lucide-react"

export const metadata: Metadata = {
  title: "Login | Mindcrate",
  description: "Login to your Mindcrate account and continue your journey.",
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen w-screen items-center justify-center bg-gradient-to-br from-purple-600 via-purple-500 to-indigo-600 dark:from-gray-900 dark:via-purple-900 dark:to-black">
      <div className="mx-auto w-full max-w-md rounded-2xl bg-card p-8 shadow-xl backdrop-blur-md">
        {/* Header */}
        <div className="flex flex-col items-center space-y-2 text-center mb-6">
          <Link href="/" className="flex items-center gap-2 group">
            <Brain className="h-9 w-9 text-purple-600 transition-transform group-hover:rotate-12 dark:text-purple-400" />
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Mindcrate</h1>
          </Link>
          <h2 className="text-xl font-semibold tracking-tight">Welcome back</h2>
          <p className="text-sm text-muted-foreground">
            Enter your credentials to sign in to your account
          </p>
        </div>

        {/* Auth Form */}
        <AuthForm />

        {/* Footer */}
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            className="font-medium text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 underline underline-offset-4 transition-colors"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}
