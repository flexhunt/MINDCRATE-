import type React from "react"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Mindcrate - Brain Hacks & Productivity Guides",
  description: "The ultimate library of guides for ADHD, executive dysfunction, and practical productivity. Built to help you take action.",
  metadataBase: new URL("https://mindcrate.vercel.app"),
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-black text-white antialiased`}>
        <div className="min-h-screen flex flex-col">
          <div className="flex-1">{children}</div>
        </div>
      </body>
    </html>
  )
}
