"use client"

import { useState } from "react"
import { useSearchParams } from "next/navigation"
import SignupForm from "@/components/auth/signup-form"
import MinimalSignupForm from "@/components/auth/minimal-signup-form"
import SocialLoginButtons from "@/components/auth/social-login-buttons"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"

export default function SignupClient() {
  const [isLoading, setIsLoading] = useState(false)
  const searchParams = useSearchParams()
  const referralCode = searchParams.get("ref") || ""
  const minimal = searchParams.get("minimal") === "true"

  if (minimal) {
    return (
      <div className="mx-auto w-full max-w-md space-y-6 p-4">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold">Create an account</h1>
          <p className="text-muted-foreground">Enter your information to get started</p>
        </div>
        <MinimalSignupForm isLoading={isLoading} setIsLoading={setIsLoading} referralCode={referralCode} />
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-md space-y-6 p-4">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">Create an account</h1>
        <p className="text-muted-foreground">Enter your information to get started</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Sign up</CardTitle>
          <CardDescription>Choose your preferred signup method</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="social">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="social">Social</TabsTrigger>
              <TabsTrigger value="form">Email</TabsTrigger>
            </TabsList>
            <TabsContent value="social" className="space-y-4">
              <div className="grid gap-4">
                <div className="text-sm text-muted-foreground text-center mb-2">Sign up with your social account</div>
                <SocialLoginButtons isLoading={isLoading} setIsLoading={setIsLoading} />
              </div>
            </TabsContent>
            <TabsContent value="form" className="space-y-4">
              <SignupForm isLoading={isLoading} setIsLoading={setIsLoading} referralCode={referralCode} />
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Separator />
          <div className="text-sm text-muted-foreground text-center">
            Already have an account?{" "}
            <Link href="/login" className="underline underline-offset-4 hover:text-primary">
              Login
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
