"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Suspense } from "react"
import { motion } from "framer-motion"
import { FileX2 } from "lucide-react"

function NotFoundContent() {
  const searchParams = useSearchParams()
  const slug = searchParams.get("slug")

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen overflow-hidden bg-gradient-to-br from-zinc-950 via-black to-zinc-900 p-6 text-center text-white">
      {/* Floating background blobs */}
      <motion.div
        className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-purple-500/30 blur-3xl"
        animate={{ y: [0, 30, 0], x: [0, 20, 0] }}
        transition={{ repeat: Infinity, duration: 8 }}
      />
      <motion.div
        className="absolute bottom-[-150px] right-[-150px] h-[500px] w-[500px] rounded-full bg-blue-500/20 blur-3xl"
        animate={{ y: [0, -30, 0], x: [0, -20, 0] }}
        transition={{ repeat: Infinity, duration: 10 }}
      />

      {/* Icon */}
      <motion.div
        initial={{ scale: 0, rotate: -30, opacity: 0 }}
        animate={{ scale: 1, rotate: 0, opacity: 1 }}
        transition={{ duration: 0.7 }}
      >
        <FileX2 className="h-20 w-20 text-red-400 drop-shadow-lg" />
      </motion.div>

      {/* Text */}
      <motion.h1
        className="mt-6 text-4xl font-extrabold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
      >
        Article Not Found
      </motion.h1>

      <motion.p
        className="mt-4 text-lg text-zinc-400"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.6 }}
      >
        Sorry, the article{" "}
        <span className="font-semibold text-white">{slug}</span> doesn’t exist or
        has been removed.
      </motion.p>

      {/* Button */}
      <motion.div
        className="mt-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.6 }}
      >
        <Link
          href="/articles"
          className="rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-3 text-lg font-semibold shadow-lg transition-transform hover:scale-105"
        >
          Browse Articles
        </Link>
      </motion.div>
    </div>
  )
}

export default function NotFound() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <NotFoundContent />
    </Suspense>
  )
}
