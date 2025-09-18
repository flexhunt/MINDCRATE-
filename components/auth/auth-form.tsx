"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import SimpleLoginForm from "./simple-login-form"
import SignupForm from "./signup-form"
import SocialLoginButtons from "./social-login-buttons"
import { Separator } from "@/components/ui/separator"
import { motion, AnimatePresence } from "framer-motion"

interface AuthFormProps {
  referralCode?: string
}

export default function AuthForm({ referralCode }: AuthFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState(referralCode ? "signup" : "login")

  return (
    <Card className="w-full rounded-xl shadow-lg border border-border/60">
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
      >
        {/* Tabs Header */}
        <TabsList className="grid w-full grid-cols-2 rounded-t-xl overflow-hidden">
          <TabsTrigger
            value="login"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-colors"
          >
            Login
          </TabsTrigger>
          <TabsTrigger
            value="signup"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-colors"
          >
            Sign up
          </TabsTrigger>
        </TabsList>

        {/* Content with animation */}
        <AnimatePresence mode="wait">
          {activeTab === "login" && (
            <motion.div
              key="login"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <TabsContent value="login">
                <CardHeader>
                  <CardTitle>Login to Mindcrate</CardTitle>
                  <CardDescription>
                    Enter your email and password to access your account
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <SimpleLoginForm isLoading={isLoading} setIsLoading={setIsLoading} />

                  {/* Separator */}
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <Separator className="w-full" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">
                        Or continue with
                      </span>
                    </div>
                  </div>

                  <SocialLoginButtons isLoading={isLoading} setIsLoading={setIsLoading} />
                </CardContent>
              </TabsContent>
            </motion.div>
          )}

          {activeTab === "signup" && (
            <motion.div
              key="signup"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <TabsContent value="signup">
                <CardHeader>
                  <CardTitle>Join Mindcrate</CardTitle>
                  <CardDescription>
                    Create your account to start your mindset growth journey
                    {referralCode && (
                      <span className="block mt-1 text-green-600 dark:text-green-400">
                        Referral code: {referralCode}
                      </span>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <SignupForm
                    isLoading={isLoading}
                    setIsLoading={setIsLoading}
                    referralCode={referralCode}
                  />

                  {/* Separator */}
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <Separator className="w-full" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">
                        Or continue with
                      </span>
                    </div>
                  </div>

                  <SocialLoginButtons isLoading={isLoading} setIsLoading={setIsLoading} />
                </CardContent>
              </TabsContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Tabs>
    </Card>
  )
}
