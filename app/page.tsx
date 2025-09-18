"use client"

import type React from "react"

import { Brain, Sparkles, Users, Star, Menu, X } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

function GlassFeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType
  title: string
  description: string
}) {
  return (
    <div className="rounded-xl md:rounded-2xl bg-white/10 backdrop-blur-lg border border-white/20 p-4 md:p-6 hover:bg-white/20 transition">
      <Icon className="h-6 w-6 md:h-8 md:w-8 text-purple-400 mb-3 md:mb-4" />
      <h3 className="text-base md:text-lg font-semibold">{title}</h3>
      <p className="text-xs md:text-sm text-gray-300 mt-2">{description}</p>
    </div>
  )
}

function GlassTestimonialCard({
  name,
  role,
  quote,
  rating,
}: {
  name: string
  role: string
  quote: string
  rating?: number
}) {
  return (
    <div className="rounded-xl md:rounded-2xl bg-white/10 backdrop-blur-lg border border-white/20 p-4 md:p-6">
      <p className="text-sm md:text-base text-gray-300 mb-4">"{quote}"</p>
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm md:text-base font-semibold">{name}</h4>
          <span className="text-xs text-gray-400">{role}</span>
        </div>
        {rating && (
          <div className="flex text-yellow-400">
            {Array.from({ length: rating }).map((_, i) => (
              <Star key={i} className="h-3 w-3 md:h-4 md:w-4 fill-yellow-400" />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function Home() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <div className="relative min-h-screen text-white bg-gradient-to-br from-purple-900 via-gray-900 to-black">
      {/* Navbar */}
      <nav className="flex justify-between items-center px-4 md:px-6 py-3 md:py-4 backdrop-blur-md bg-black/30 border-b border-white/10">
        <Link href="/" className="flex items-center gap-2 font-bold text-base md:text-lg">
          <Brain className="h-5 w-5 md:h-6 md:w-6 text-purple-400" /> Mindcrate
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex gap-4 text-sm">
          <Link href="/research-papers" className="hover:text-purple-400">
            Research Papers
          </Link>
          <Link href="/questionnaire" className="hover:text-purple-400">
            Questionnaires
          </Link>
          <Link href="#features" className="hover:text-purple-400">
            Features
          </Link>
          <Link href="#testimonials" className="hover:text-purple-400">
            Testimonials
          </Link>
          <Link href="#pricing" className="hover:text-purple-400">
            Pricing
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/signup"
            className="px-3 py-2 md:px-4 md:py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition text-xs md:text-sm"
          >
            Get Started
          </Link>
          {/* Mobile Menu Button */}
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="md:hidden p-2">
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-black/90 backdrop-blur-md border-b border-white/10">
          <div className="flex flex-col px-4 py-3 space-y-3 text-sm">
            <Link href="/research-papers" className="hover:text-purple-400" onClick={() => setIsMobileMenuOpen(false)}>
              Research Papers
            </Link>
            <Link href="/questionnaire" className="hover:text-purple-400" onClick={() => setIsMobileMenuOpen(false)}>
              Questionnaires
            </Link>
            <Link href="#features" className="hover:text-purple-400" onClick={() => setIsMobileMenuOpen(false)}>
              Features
            </Link>
            <Link href="#testimonials" className="hover:text-purple-400" onClick={() => setIsMobileMenuOpen(false)}>
              Testimonials
            </Link>
            <Link href="#pricing" className="hover:text-purple-400" onClick={() => setIsMobileMenuOpen(false)}>
              Pricing
            </Link>
          </div>
        </div>
      )}

      {/* Hero */}
      <section className="flex flex-col items-center justify-center text-center px-4 md:px-6 py-12 md:py-20">
        <h1 className="text-2xl md:text-5xl font-extrabold max-w-2xl leading-tight">
          Explore Your Mind. Understand Psychology. Grow Personally.
        </h1>
        <p className="mt-3 md:mt-4 text-sm md:text-lg text-gray-300 max-w-xl px-2">
          Mindcrate helps you explore psychological research, take assessments, and gain AI-powered insights about
          yourself.
        </p>
        <div className="mt-4 md:mt-6 flex flex-col sm:flex-row gap-3 md:gap-4 w-full max-w-sm sm:max-w-none">
          <Link
            href="/questionnaire"
            className="px-4 md:px-6 py-2 md:py-3 rounded-lg bg-purple-600 hover:bg-purple-700 transition text-sm md:text-base"
          >
            Take Assessment
          </Link>
          <Link
            href="/research-papers"
            className="px-4 md:px-6 py-2 md:py-3 rounded-lg border border-white/20 hover:bg-white/10 transition text-sm md:text-base"
          >
            Browse Research
          </Link>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="px-4 md:px-6 py-12 md:py-20 max-w-6xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-8 md:mb-12">Features</h2>
        <div className="grid gap-4 md:gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <GlassFeatureCard
            icon={Brain}
            title="Psychology Assessments"
            description="Take scientifically-backed questionnaires to understand your personality and mental patterns."
          />
          <GlassFeatureCard
            icon={Sparkles}
            title="AI-Powered Insights"
            description="Get personalized explanations and insights based on your assessment results."
          />
          <GlassFeatureCard
            icon={Users}
            title="Research Database"
            description="Access and search through a comprehensive database of psychology research papers."
          />
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="px-4 md:px-6 py-12 md:py-20 max-w-4xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-8 md:mb-12">What People Say</h2>
        <div className="grid gap-4 md:gap-6 sm:grid-cols-2">
          <GlassTestimonialCard
            name="Aarav Sharma"
            role="Student"
            quote="Mindcrate keeps me consistent with my daily habits."
            rating={5}
          />
          <GlassTestimonialCard
            name="Neha Patel"
            role="Designer"
            quote="The AI chatbot is like having a personal mentor."
            rating={5}
          />
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="px-4 md:px-6 py-12 md:py-20 max-w-4xl mx-auto text-center">
        <h2 className="text-2xl md:text-3xl font-bold mb-6 md:mb-8">Pricing</h2>
        <div className="grid sm:grid-cols-2 gap-4 md:gap-6">
          <div className="rounded-xl md:rounded-2xl bg-white/10 backdrop-blur-lg border border-white/20 p-6 md:p-8">
            <h3 className="text-lg md:text-xl font-semibold">Free Plan</h3>
            <p className="text-gray-300 mt-2 text-sm md:text-base">Basic tools to get started</p>
            <p className="text-xl md:text-2xl font-bold mt-4">₹0 / month</p>
            <Link
              href="/signup"
              className="mt-4 md:mt-6 block px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm md:text-base"
            >
              Start Free
            </Link>
          </div>
          <div className="rounded-xl md:rounded-2xl bg-gradient-to-br from-purple-600 to-purple-800 text-white p-6 md:p-8">
            <h3 className="text-lg md:text-xl font-semibold">Pro Plan</h3>
            <p className="mt-2 text-sm md:text-base">Unlock all features for serious growth</p>
            <p className="text-xl md:text-2xl font-bold mt-4">₹499 / month</p>
            <Link
              href="/signup"
              className="mt-4 md:mt-6 block px-4 py-2 bg-white text-purple-700 font-semibold rounded-lg text-sm md:text-base"
            >
              Go Pro
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-4 md:px-6 py-6 md:py-8 text-center text-xs md:text-sm text-gray-400 border-t border-white/10">
        © {new Date().getFullYear()} Mindcrate. All rights reserved.
      </footer>
    </div>
  )
}
