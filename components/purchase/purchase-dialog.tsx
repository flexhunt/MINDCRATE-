"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Loader2, Coins, ShoppingCart, BookOpen, AlertCircle, CheckCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { purchaseService, type PurchaseItem } from "@/lib/purchase/purchase-service"

interface PurchaseDialogProps {
  item: PurchaseItem | null
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function PurchaseDialog({ item, isOpen, onClose, onSuccess }: PurchaseDialogProps) {
  const [isPurchasing, setIsPurchasing] = useState(false)
  const [userBalance, setUserBalance] = useState(0)
  const [hasAccess, setHasAccess] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    if (isOpen && item) {
      loadUserData()
    }
  }, [isOpen, item])

  const loadUserData = async () => {
    if (!item) return

    setIsLoading(true)
    try {
      console.log("Loading user data for item:", item.id, item.type)

      const [balance, access] = await Promise.all([
        purchaseService.getUserBalance(),
        purchaseService.checkAccess(item.id, item.type),
      ])

      console.log("User balance:", balance)
      console.log("Has access:", access)

      setUserBalance(balance)
      setHasAccess(access)
    } catch (error) {
      console.error("Error loading user data:", error)
      toast({
        title: "Error",
        description: "Failed to load user data",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handlePurchase = async () => {
    if (!item) return

    console.log("Starting purchase for:", item.name, "Price:", item.price, "User balance:", userBalance)

    setIsPurchasing(true)
    try {
      const result = await purchaseService.purchaseItem(item)

      console.log("Purchase result:", result)

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

        setTimeout(() => {
          onClose()
        }, 2000)
      } else {
        console.error("Purchase failed:", result.message)
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

  if (!item) return null

  const canAfford = userBalance >= item.price
  const isOutOfStock = item.type === "item" && item.stock === 0
  const Icon = item.type === "course" ? BookOpen : ShoppingCart

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-3">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Icon className="h-5 w-5 flex-shrink-0" />
            <span className="truncate">{hasAccess ? "Already Purchased" : "Confirm Purchase"}</span>
          </DialogTitle>
          <DialogDescription className="text-sm">
            {hasAccess
              ? `You already have access to this ${item.type}.`
              : `Purchase this ${item.type} using your coins.`}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <div className="space-y-4 py-2">
            {/* Item Details */}
            <div className="flex gap-3 p-3 border rounded-lg bg-muted/30">
              {item.image_url ? (
                <img
                  src={item.image_url || "/placeholder.svg"}
                  alt={item.name}
                  className="w-12 h-12 object-cover rounded-md flex-shrink-0"
                />
              ) : (
                <div className="w-12 h-12 bg-muted rounded-md flex items-center justify-center flex-shrink-0">
                  <Icon className="h-6 w-6 text-muted-foreground" />
                </div>
              )}

              <div className="flex-1 min-w-0 space-y-1">
                <h3 className="font-semibold text-sm truncate">{item.name}</h3>
                {item.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{item.description}</p>
                )}
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="flex items-center gap-1 text-xs">
                    <Coins className="h-3 w-3 text-yellow-500" />
                    {item.price.toLocaleString()} coins
                  </Badge>
                  {item.type === "item" && item.stock !== undefined && (
                    <Badge variant={item.stock > 0 ? "default" : "destructive"} className="text-xs">
                      {item.stock > 0 ? `${item.stock} left` : "Out of stock"}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Balance & Cost Breakdown */}
            {!hasAccess && (
              <div className="space-y-2 p-3 bg-muted/20 rounded-lg">
                <div className="flex justify-between text-sm">
                  <span>Your Balance:</span>
                  <span className="font-medium flex items-center gap-1">
                    <Coins className="h-3 w-3 text-yellow-500" />
                    {userBalance.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Cost:</span>
                  <span className="font-medium text-red-600 flex items-center gap-1">
                    <Coins className="h-3 w-3 text-yellow-500" />-{item.price.toLocaleString()}
                  </span>
                </div>
                <div className="border-t pt-2 flex justify-between font-semibold text-sm">
                  <span>After Purchase:</span>
                  <span className={`flex items-center gap-1 ${canAfford ? "text-green-600" : "text-red-600"}`}>
                    <Coins className="h-3 w-3 text-yellow-500" />
                    {(userBalance - item.price).toLocaleString()}
                  </span>
                </div>
              </div>
            )}

            {/* Status Messages */}
            {hasAccess && (
              <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-300 rounded-lg">
                <CheckCircle className="h-4 w-4 flex-shrink-0" />
                <span className="text-sm">You already own this {item.type}</span>
              </div>
            )}

            {!hasAccess && !canAfford && (
              <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300 rounded-lg">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span className="text-sm">You need {(item.price - userBalance).toLocaleString()} more coins</span>
              </div>
            )}

            {!hasAccess && isOutOfStock && (
              <div className="flex items-center gap-2 p-3 bg-orange-50 dark:bg-orange-950/20 text-orange-700 dark:text-orange-300 rounded-lg">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span className="text-sm">This item is currently out of stock</span>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="flex-col sm:flex-row gap-2 pt-2">
          <Button variant="outline" onClick={onClose} disabled={isPurchasing} className="w-full sm:w-auto">
            {hasAccess ? "Close" : "Cancel"}
          </Button>

          {!hasAccess && (
            <Button
              onClick={handlePurchase}
              disabled={isPurchasing || !canAfford || isOutOfStock || isLoading}
              className="w-full sm:w-auto"
            >
              {isPurchasing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Icon className="mr-2 h-4 w-4" />
                  Purchase for {item.price.toLocaleString()} coins
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
