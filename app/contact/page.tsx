"use client"
import { Mail, MapPin, Phone } from "lucide-react"
import { motion } from "framer-motion"

export default function ContactPage() {
  return (
    <div className="container max-w-5xl py-16 mx-auto">
      <motion.h1
        className="text-4xl font-extrabold mb-10 text-center bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        Get in Touch with Mindcrate
      </motion.h1>

      <div className="grid gap-10 md:grid-cols-2">
        {/* Left Section */}
        <motion.div
          className="space-y-8"
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          <p className="text-lg text-zinc-600 dark:text-zinc-300">
            Whether you have questions, ideas, or partnership requests — we’d love to hear from you. The Mindcrate team
            is here to support your journey.
          </p>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-primary" />
              <span>flexhunt1@gmail.com</span>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="h-5 w-5 text-primary" />
              <span>+91 7706984182</span>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-primary" />
              <span>Mindcrate HQ — Remote, Global</span>
            </div>
          </div>

          <div className="pt-4">
            <h2 className="text-xl font-semibold mb-2">Response Time</h2>
            <p>We usually reply within 24 hours on weekdays.</p>
          </div>
        </motion.div>

        {/* Right Section - Form */}
        <motion.div
          className="rounded-2xl bg-white/10 dark:bg-zinc-900/50 backdrop-blur-md p-8 shadow-xl"
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-2xl font-semibold mb-6">Send us a message</h2>

          <form className="space-y-5">
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-1">
                Name
              </label>
              <input
                id="name"
                type="text"
                className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-transparent p-3 focus:ring-2 focus:ring-primary outline-none"
                placeholder="Your name"
                required
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-transparent p-3 focus:ring-2 focus:ring-primary outline-none"
                placeholder="Your email"
                required
              />
            </div>

            <div>
              <label htmlFor="subject" className="block text-sm font-medium mb-1">
                Subject
              </label>
              <input
                id="subject"
                type="text"
                className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-transparent p-3 focus:ring-2 focus:ring-primary outline-none"
                placeholder="Message subject"
                required
              />
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-medium mb-1">
                Message
              </label>
              <textarea
                id="message"
                rows={5}
                className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-transparent p-3 focus:ring-2 focus:ring-primary outline-none"
                placeholder="Your message"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 py-3 text-lg font-semibold text-white shadow-lg transition-transform hover:scale-[1.02]"
            >
              Send Message
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  )
}
