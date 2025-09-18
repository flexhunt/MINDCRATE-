"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface UsernameCheckProps {
  profile: any
  user: any
}

export default function UsernameCheck({ profile, user }: UsernameCheckProps) {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const [shouldShow, setShouldShow] = useState(false)

  // Don't show on profile page
  if (pathname === "/profile") {
    return null
  }

  useEffect(() => {
    // Check if user has a username
    if (profile && (!profile.username || profile.username.trim() === "")) {
      setShouldShow(true)
      setOpen(true)
    } else {
      setShouldShow(false)
      setOpen(false)
    }
  }, [profile])

  const handleGoToProfile = () => {
    router.push("/profile")
    setOpen(false)
  }

  if (!profile || (profile.username && profile.username.trim() !== "")) {
    return null
  }

  return (
    <>
      {/* Persistent alert at the top of the page */}
      {shouldShow && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Username Required</AlertTitle>
          <AlertDescription className="flex flex-col gap-2">
            <p>You need to create a username before you can use the platform.</p>
            <Button variant="outline" size="sm" onClick={handleGoToProfile} className="w-fit">
              Go to Profile Settings
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Modal dialog for first-time notification */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Username Required</DialogTitle>
            <DialogDescription>
              You need to create a username before you can continue using the platform.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col space-y-4 py-4">
            <p>
              Please go to your profile settings to create a username. Your username will be used for your public
              profile and cannot be changed frequently.
            </p>
            <div className="bg-muted p-3 rounded-md">
              <p className="text-sm font-medium">Username requirements:</p>
              <ul className="text-sm list-disc list-inside mt-2">
                <li>At least 3 characters long</li>
                <li>Can contain letters, numbers, and underscores</li>
                <li>Must be unique</li>
                <li>Cannot contain spaces or special characters</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" onClick={handleGoToProfile}>
              Go to Profile Settings
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
