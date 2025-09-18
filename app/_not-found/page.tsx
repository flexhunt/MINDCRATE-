"use client"

import { Suspense } from "react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { motion } from "framer-motion"
import { Sparkles } from "lucide-react"

export default function NotFoundPage() {
  return (
    <Suspense
      fallback={<div className="flex h-screen items-center justify-center bg-black text-white">Loading...</div>}
    >
      <div className="relative flex h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-zinc-900 via-black to-zinc-900 text-white">
        {/* Background animated gradient blobs */}
        <motion.div
          className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-purple-500/30 blur-3xl"
          animate={{ y: [0, 30, 0], x: [0, 20, 0] }}
          transition={{ repeat: Number.POSITIVE_INFINITY, duration: 8 }}
        />
        <motion.div
          className="absolute bottom-[-150px] right-[-150px] h-[500px] w-[500px] rounded-full bg-blue-500/20 blur-3xl"
          animate={{ y: [0, -30, 0], x: [0, -20, 0] }}
          transition={{ repeat: Number.POSITIVE_INFINITY, duration: 10 }}
        />

        {/* Content */}
        <motion.div
          className="z-10 mx-auto max-w-md text-center"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-6xl font-extrabold text-transparent drop-shadow-lg">
            404
          </h1>
          <h2 className="mt-2 text-2xl font-semibold">Lost in Space</h2>
          <p className="mt-4 text-zinc-400">
            The page you’re looking for doesn’t exist, or it may have been moved elsewhere in the universe.
          </p>

          <motion.div className="mt-8" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
            <Button
              asChild
              size="lg"
              className="group relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-600 to-blue-600 px-8 py-6 text-lg font-semibold text-white shadow-lg transition-all hover:shadow-purple-500/40"
            >
              <Link href="/dashboard">
                <Sparkles className="mr-2 h-5 w-5 transition-transform group-hover:rotate-12" />
                Take Me Home
              </Link>
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </Suspense>
  )
}
