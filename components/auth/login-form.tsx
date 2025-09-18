"use client"

import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { useState } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react"
import Link from "next/link"

const formSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
})

type FormValues = z.infer<typeof formSchema>

interface LoginFormProps {
  isLoading: boolean
  setIsLoading: (isLoading: boolean) => void
}

export default function LoginForm({ isLoading, setIsLoading }: LoginFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isRedirecting, setIsRedirecting] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
    mode: "onChange",
  })

  const onSubmit = async (values: FormValues) => {
    try {
      setIsLoading(true)
      setErrorMessage(null)
      setSuccessMessage(null)

      console.log("🔐 Login attempt:", values.email)

      const { error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      })

      if (error) {
        console.error("❌ Login error:", error.message)
        setErrorMessage("Invalid email or password. Please try again.")
        return
      }

      console.log("✅ Login successful")
      setSuccessMessage("Login successful! Redirecting...")
      setIsRedirecting(true)

      setTimeout(() => {
        router.replace("/dashboard")
      }, 1000)
    } catch (error) {
      console.error("❌ Login catch error:", error)
      setErrorMessage("Something went wrong. Please try again.")
    } finally {
      if (!successMessage) {
        setIsLoading(false)
      }
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {errorMessage && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{errorMessage}</AlertDescription>
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
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  {...field}
                  disabled={isLoading || isRedirecting}
                  onChange={(e) => {
                    field.onChange(e)
                    setErrorMessage(null)
                  }}
                />
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
              <div className="flex items-center justify-between">
                <FormLabel>Password</FormLabel>
                <Link
                  href="/forgot-password"
                  className="text-xs text-muted-foreground hover:text-primary transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <FormControl>
                <Input
                  type="password"
                  placeholder="••••••••"
                  {...field}
                  disabled={isLoading || isRedirecting}
                  onChange={(e) => {
                    field.onChange(e)
                    setErrorMessage(null)
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isLoading || isRedirecting}>
          {isLoading || isRedirecting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {isRedirecting ? "Redirecting..." : "Logging in..."}
            </>
          ) : (
            "Login"
          )}
        </Button>
      </form>
    </Form>
  )
}
