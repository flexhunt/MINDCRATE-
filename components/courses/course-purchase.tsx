"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Coins, BookOpen, CheckCircle, Loader2, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { purchaseService, type PurchaseItem } from "@/lib/purchase/purchase-service"

interface CoursePurchaseProps {
  courseId: string
  courseTitle: string
  price: number
  userBalance: number
  hasAccess?: boolean
  onSuccess?: () => void
  className?: string
}

export function CoursePurchase({
  courseId,
  courseTitle,
  price,
  userBalance: initialBalance,
  hasAccess: initialAccess = false,
  onSuccess,
  className = "",
}: CoursePurchaseProps) {
  const [isPurchasing, setIsPurchasing] = useState(false)
  const [userBalance, setUserBalance] = useState(initialBalance)
  const [hasAccess, setHasAccess] = useState(initialAccess)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  // Check access and balance on mount
  useEffect(() => {
    checkAccessAndBalance()
  }, [courseId])

  const checkAccessAndBalance = async () => {
    setIsLoading(true)
    try {
      const [balance, access] = await Promise.all([
        purchaseService.getUserBalance(),
        purchaseService.checkAccess(courseId, "course"),
      ])
      setUserBalance(balance)
      setHasAccess(access)
    } catch (error) {
      console.error("Error checking access and balance:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePurchase = async () => {
    setIsPurchasing(true)
    try {
      const purchaseItem: PurchaseItem = {
        id: courseId,
        name: courseTitle,
        price: price,
        type: "course",
      }

      const result = await purchaseService.purchaseItem(purchaseItem)

      if (result.success) {
        toast({
          title: "Purchase Successful!",
          description: result.message,
        })

        if (result.newBalance !== undefined) {
          setUserBalance(result.newBalance)
        }

        setHasAccess(true)
        onSuccess?.()
      } else {
        toast({
          title: "Purchase Failed",
          description: result.message,
          variant: "destructive",
        })
      }
    } catch (error: any) {
      console.error("Purchase error:", error)
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsPurchasing(false)
    }
  }

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center">
          <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    )
  }

  if (hasAccess) {
    return (
      <Card className={`border-green-200 bg-green-50 dark:bg-green-950/20 ${className}`}>
        <CardContent className="p-6 text-center">
          <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
          <h3 className="font-semibold text-green-800 dark:text-green-200 mb-2">Course Purchased!</h3>
          <p className="text-sm text-green-700 dark:text-green-300">You have full access to this course.</p>
        </CardContent>
      </Card>
    )
  }

  const canAfford = userBalance >= price
  const remainingCoins = userBalance - price

  return (
    <Card className={className}>
      <CardContent className="p-6 space-y-4">
        {/* Price Display */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Coins className="h-6 w-6 text-yellow-600" />
            <span className="text-3xl font-bold">{price.toLocaleString()}</span>
            <span className="text-muted-foreground">coins</span>
          </div>
          <p className="text-sm text-muted-foreground">One-time purchase, lifetime access</p>
        </div>

        {/* Balance Info */}
        <div className="space-y-2 p-3 bg-muted/30 rounded-lg">
          <div className="flex justify-between text-sm">
            <span>Your Balance:</span>
            <span className="font-medium flex items-center gap-1">
              <Coins className="h-3 w-3 text-yellow-600" />
              {userBalance.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Course Price:</span>
            <span className="font-medium text-red-600 flex items-center gap-1">
              <Coins className="h-3 w-3 text-yellow-600" />-{price.toLocaleString()}
            </span>
          </div>
          <div className="border-t pt-2 flex justify-between font-semibold">
            <span>After Purchase:</span>
            <span className={`flex items-center gap-1 ${canAfford ? "text-green-600" : "text-red-600"}`}>
              <Coins className="h-3 w-3 text-yellow-600" />
              {remainingCoins.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Warning if insufficient funds */}
        {!canAfford && (
          <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300 rounded-lg">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">You need {(price - userBalance).toLocaleString()} more coins</span>
          </div>
        )}

        {/* Purchase Button */}
        <Button onClick={handlePurchase} disabled={isPurchasing || !canAfford} className="w-full" size="lg">
          {isPurchasing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <BookOpen className="mr-2 h-4 w-4" />
              Purchase Course
            </>
          )}
        </Button>

        {/* Features */}
        <div className="text-sm space-y-2 pt-2 border-t">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span>Full lifetime access</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span>Access on mobile and desktop</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span>Premium course materials</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
