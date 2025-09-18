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
import { Loader2, AlertCircle, CheckCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

// Minimal form schema
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

export default function MinimalSignupForm({ isLoading, setIsLoading, referralCode }: SignupFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const [errorDetails, setErrorDetails] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isRedirecting, setIsRedirecting] = useState(false)

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
      setSuccessMessage(null)
      setIsLoading(true)

      // Only do the auth signup - nothing else
      const { data, error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            name: values.name,
          },
        },
      })

      if (error) {
        console.error("Signup error:", error)
        setErrorDetails(error.message || "Failed to create account. Please try again.")
        toast({
          title: "Signup Failed",
          description: error.message || "Failed to create account. Please try again.",
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

      // If email confirmation is required, show message and stop here
      if (data.user && !data.session) {
        setSuccessMessage("Account created! Please check your email to confirm your account.")
        toast({
          title: "Success",
          description: "Please check your email to confirm your account.",
        })
        setIsLoading(false)
        return
      }

      // Success - redirect to dashboard
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
                <Input placeholder="John Doe" {...field} disabled={isLoading || isRedirecting} />
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
                <Input placeholder="you@example.com" {...field} disabled={isLoading || isRedirecting} />
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
                <Input type="password" placeholder="••••••••" {...field} disabled={isLoading || isRedirecting} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {referralCode && (
          <div className="text-sm text-muted-foreground">
            Referral code: <span className="font-medium">{referralCode}</span> (will be applied automatically)
          </div>
        )}

        <Button type="submit" className="w-full" disabled={isLoading || isRedirecting}>
          {isLoading || isRedirecting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {isRedirecting ? "Redirecting to dashboard..." : "Creating account..."}
            </>
          ) : (
            "Create account"
          )}
        </Button>
      </form>
    </Form>
  )
}
