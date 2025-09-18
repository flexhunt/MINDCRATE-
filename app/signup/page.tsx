import { Suspense } from "react"
import SignupClient from "./signup-client"
import Link from "next/link"
import { Brain } from "lucide-react"

export default function SignupPage() {
  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <div className="mx-auto flex w-full flex-col items-center justify-center space-y-4 sm:w-[350px]">
        <Link href="/" className="flex items-center gap-2">
          <Brain className="h-8 w-8 text-purple-600 dark:text-purple-400" />
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Mindcrate</h1>
        </Link>
      </div>
      <Suspense fallback={<div className="text-center mt-4">Loading...</div>}>
        <SignupClient />
      </Suspense>
    </div>
  )
}
