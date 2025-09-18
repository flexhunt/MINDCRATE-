import type React from "react"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme/theme-provider"
import { NavigationProvider } from "@/components/providers/navigation-provider"
import { Toaster } from "@/components/ui/toast"
import { InstallPrompt } from "@/components/pwa/install-prompt"
import { AppUpdateNotification } from "@/components/pwa/app-update-notification"
import { EnhancedGlobalEmojiRenderer } from "@/components/emoji/enhanced-global-emoji-renderer"
import { VerifiedUsersProvider } from "@/components/global/verified-user-provider"
import { LocationDetector } from "@/components/auth/location-detector"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Mindcrate - AI-Powered Mindset Development Platform",
  description:
    "Transform your mindset with AI-powered growth tools, interactive challenges, and personalized insights. Join thousands developing mental resilience and achieving breakthrough results.",
  keywords:
    "mindset development, AI coaching, personal growth, mental resilience, cognitive training, self improvement",
  authors: [{ name: "Mindcrate Team" }],
  creator: "Mindcrate",
  publisher: "Mindcrate",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://mindcrate.vercel.app"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Mindcrate - AI-Powered Mindset Development",
    description: "Transform your mindset with AI-powered growth tools and personalized insights",
    url: "/",
    siteName: "Mindcrate",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "Mindcrate - AI-Powered Mindset Development",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Mindcrate - AI-Powered Mindset Development",
    description: "Transform your mindset with AI-powered growth tools and personalized insights",
    images: ["/logo.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/logo.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/logo.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/logo.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/logo.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#000000" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <meta name="google-adsense-account" content="ca-pub-9411496601032002" />
      </head>
      <body className={inter.className}>
        <div className="min-h-screen flex flex-col">
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange={false}>
            <VerifiedUsersProvider>
              <NavigationProvider>
                <LocationDetector />
                <EnhancedGlobalEmojiRenderer />
                <div className="flex-1">{children}</div>
                <InstallPrompt />
                <AppUpdateNotification />
                <Toaster />
              </NavigationProvider>
            </VerifiedUsersProvider>
          </ThemeProvider>
        </div>
      </body>
    </html>
  )
}
