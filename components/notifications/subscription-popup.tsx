"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { Bell, X, Zap, Gift, Trophy, Shield, Clock } from "lucide-react"

interface SubscriptionPopupProps {
  isOpen: boolean
  onClose: () => void
  onSubscribe: () => Promise<void>
}

export function SubscriptionPopup({ isOpen, onClose, onSubscribe }: SubscriptionPopupProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleSubscribe = async () => {
    setIsLoading(true)
    try {
      await onSubscribe()
      onClose()
    } catch (error) {
      console.error("Subscription failed:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDontShowAgain = () => {
    localStorage.setItem("push-notification-dismissed", "true")
    onClose()
    toast({
      title: "Got it!",
      description: "We won't ask again. You can enable notifications in your profile.",
    })
  }

  const handleRemindLater = () => {
    const remindTime = Date.now() + 24 * 60 * 60 * 1000 // 24 hours
    localStorage.setItem("push-notification-remind", remindTime.toString())
    onClose()
    toast({
      title: "We'll remind you tomorrow!",
      description: "You can also enable notifications anytime in your profile.",
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-2 border-blue-200 dark:border-blue-800">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl font-bold">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
              <Bell className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            Turn On Notifications
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Hero Message */}
          <div className="text-center">
            <p className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
              Stay updated with important announcements
            </p>
            <p className="text-sm text-muted-foreground">Get notified about new features, courses, and updates.</p>
          </div>

          {/* Benefits */}
          <div className="space-y-3">
            <div className="flex items-center space-x-3 bg-white/60 dark:bg-gray-800/60 p-3 rounded-lg">
              <Zap className="h-5 w-5 text-yellow-500" />
              <div>
                <div className="font-medium text-sm">Instant Updates</div>
                <div className="text-xs text-muted-foreground">Be first to know about new features</div>
              </div>
            </div>

            <div className="flex items-center space-x-3 bg-white/60 dark:bg-gray-800/60 p-3 rounded-lg">
              <Gift className="h-5 w-5 text-pink-500" />
              <div>
                <div className="font-medium text-sm">New Content</div>
                <div className="text-xs text-muted-foreground">Get notified when new courses are available</div>
              </div>
            </div>

            <div className="flex items-center space-x-3 bg-white/60 dark:bg-gray-800/60 p-3 rounded-lg">
              <Trophy className="h-5 w-5 text-orange-500" />
              <div>
                <div className="font-medium text-sm">Important Announcements</div>
                <div className="text-xs text-muted-foreground">System updates and maintenance notices</div>
              </div>
            </div>
          </div>

          {/* Privacy Note */}
          <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-center space-x-2 mb-1">
              <Shield className="h-4 w-4 text-green-600" />
              <span className="font-medium text-green-800 dark:text-green-300 text-sm">Privacy Protected</span>
            </div>
            <ul className="text-xs text-green-700 dark:text-green-400 space-y-1">
              <li>• Only important updates, no spam</li>
              <li>• Turn off anytime with one click</li>
              <li>• Your data stays secure</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              onClick={handleSubscribe}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium h-11"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Enabling...
                </>
              ) : (
                <>
                  <Bell className="mr-2 h-4 w-4" />
                  Turn On Notifications
                </>
              )}
            </Button>

            <div className="flex space-x-2">
              <Button onClick={handleRemindLater} variant="outline" className="flex-1" disabled={isLoading}>
                <Clock className="mr-2 h-4 w-4" />
                Remind Later
              </Button>

              <Button
                onClick={handleDontShowAgain}
                variant="ghost"
                className="flex-1 text-muted-foreground"
                disabled={isLoading}
              >
                <X className="mr-2 h-4 w-4" />
                Don't Ask Again
              </Button>
            </div>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            You can change this anytime in your profile settings
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
