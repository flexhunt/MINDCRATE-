"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ShoppingCart, BookOpen, CheckCircle } from "lucide-react"
import { PurchaseDialog } from "./purchase-dialog"
import type { PurchaseItem } from "@/lib/purchase/purchase-service"
import { cn } from "@/lib/utils"

interface PurchaseButtonProps {
  item: PurchaseItem
  userBalance: number
  hasAccess?: boolean
  onSuccess?: () => void
  className?: string
  children?: React.ReactNode
}

export function PurchaseButton({
  item,
  userBalance,
  hasAccess = false,
  onSuccess,
  className,
  children,
}: PurchaseButtonProps) {
  const [showDialog, setShowDialog] = useState(false)

  const canAfford = userBalance >= item.price
  const isOutOfStock = item.type === "item" && item.stock === 0
  const Icon = item.type === "course" ? BookOpen : ShoppingCart

  const handleClick = () => {
    setShowDialog(true)
  }

  const getButtonText = () => {
    if (children) return children
    if (hasAccess) return "Already Owned"
    if (isOutOfStock) return "Out of Stock"
    if (!canAfford) return `Need ${(item.price - userBalance).toLocaleString()} more coins`
    return `Purchase for ${item.price.toLocaleString()} coins`
  }

  const getButtonVariant = () => {
    if (hasAccess) return "outline"
    if (isOutOfStock || !canAfford) return "secondary"
    return "default"
  }

  return (
    <>
      <Button
        onClick={handleClick}
        disabled={hasAccess || isOutOfStock}
        variant={getButtonVariant()}
        className={cn("flex items-center gap-2", className)}
      >
        {hasAccess ? <CheckCircle className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
        {getButtonText()}
      </Button>

      <PurchaseDialog
        item={item}
        isOpen={showDialog}
        onClose={() => setShowDialog(false)}
        onSuccess={() => {
          onSuccess?.()
          setShowDialog(false)
        }}
      />
    </>
  )
}
