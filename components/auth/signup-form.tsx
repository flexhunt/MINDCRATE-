"use client"

import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { toast } from "@/components/ui/use-toast"
import { useState } from "react"
import { Loader2, AlertCircle, CheckCircle, Mail, User, Lock } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

// Update the form schema to:
const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
})

type FormValues = z.infer<typeof formSchema>

interface SignupFormProps {
  isLoading: boolean
  setIsLoading: (isLoading: boolean) => void
  referralCode?: string
}

export default function SignupForm({ isLoading, setIsLoading, referralCode }: SignupFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const [errorDetails, setErrorDetails] = useState<string | null>(null)
  const [signupStep, setSignupStep] = useState<"idle" | "auth" | "profile" | "complete">("idle")
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isRedirecting, setIsRedirecting] = useState(false)

  // Remove the username field from the form's defaultValues
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  })

  async function onSubmit(values: FormValues) {
    try {
      setErrorDetails(null)
      setSignupStep("idle")
      setSuccessMessage(null)

      setIsLoading(true)

      // Step 1: Sign up the user with auth - SIMPLIFIED
      setSignupStep("auth")
      const { data, error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            name: values.name, // Add user metadata during signup
          },
        },
      })

      if (error) {
        console.error("Signup error:", error)

        let errorMessage = "Failed to create account. Please try again."

        if (error.message.includes("Email already registered")) {
          errorMessage = "This email is already registered. Please use a different email or try logging in."
        } else if (error.message.includes("Password")) {
          errorMessage = "Password must be at least 6 characters long."
        } else if (error.message.includes("rate limit")) {
          errorMessage = "Too many signup attempts. Please try again later."
        } else if (error.message.includes("Database error")) {
          errorMessage = "There was an issue creating your account. Please try again with a different email."
        }

        setErrorDetails(errorMessage)

        toast({
          title: "Signup Failed",
          description: errorMessage,
          variant: "destructive",
        })

        setIsLoading(false)
        return
      }

      if (!data.user) {
        setErrorDetails("No user was created. Please try again.")
        toast({
          title: "Error",
          description: "No user was created. Please try again.",
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }

      if (data.user && !data.session) {
        setSuccessMessage(
          "Account created! Please check your email to confirm your account. If you don't see the email, please check your spam folder.",
        )
        toast({
          title: "Success",
          description: "Please check your email to confirm your account. Don't forget to check your spam folder.",
        })
        setIsLoading(false)
        return
      }

      // Step 2: Create profile manually but don't try to create coin balance
      setSignupStep("profile")
      try {
        // Create profile entry with name
        const { error: profileError } = await supabase.from("profiles").upsert(
          {
            id: data.user.id,
            name: values.name,
            email: values.email,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: "id",
          },
        )

        if (profileError) {
          console.error("Profile creation error:", profileError)
          // Continue anyway - the profile might be created by the database trigger
        }
      } catch (profileErr) {
        console.error("Error creating profile:", profileErr)
        // Continue anyway - the database trigger should handle profile creation
      }

      // Step 4: Complete signup and redirect
      setSignupStep("complete")
      setSuccessMessage("Account created successfully! Redirecting to dashboard...")
      setIsRedirecting(true)

      // Add a slight delay before redirecting to show the success message
      setTimeout(() => {
        router.replace("/dashboard")
      }, 1500)
    } catch (error: any) {
      console.error("Signup exception:", error)
      setErrorDetails(error.message || "An unexpected error occurred")
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      })
      setIsLoading(false)
    }
  }

  // Helper function to get step text
  const getStepText = () => {
    switch (signupStep) {
      case "auth":
        return "Creating account..."
      case "profile":
        return "Setting up profile..."
      case "complete":
        return "Redirecting..."
      default:
        return "Creating account..."
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {errorDetails && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{errorDetails}</AlertDescription>
          </Alert>
        )}

        {successMessage && (
          <Alert className="mb-4 bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-300 border-green-200 dark:border-green-900">
            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertDescription>{successMessage}</AlertDescription>
          </Alert>
        )}

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input placeholder="John Doe" {...field} disabled={isLoading || isRedirecting} className="pl-10" />
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    placeholder="you@example.com"
                    {...field}
                    disabled={isLoading || isRedirecting}
                    className="pl-10"
                  />
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    type="password"
                    placeholder="••••••••"
                    {...field}
                    disabled={isLoading || isRedirecting}
                    className="pl-10"
                  />
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isLoading || isRedirecting}>
          {isLoading || isRedirecting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {isRedirecting ? "Redirecting to dashboard..." : getStepText()}
            </>
          ) : (
            "Create account"
          )}
        </Button>
      </form>
    </Form>
  )
}
