"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Coins, Package, Plus, Edit, RefreshCw, Search, Grid, List } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { PurchaseButton } from "@/components/purchase/purchase-button"
import type { PurchaseItem } from "@/lib/purchase/purchase-service"

interface Item {
  id: string
  name: string
  description: string | null
  price: number
  image_url: string | null
  stock: number
  is_active: boolean
  created_at: string
}

interface ShopClientProps {
  user: any
  profile: any
  items: Item[]
  isAdmin: boolean
  coinBalance: number
}

export default function ShopClient({
  user,
  profile,
  items: initialItems,
  isAdmin,
  coinBalance: initialCoinBalance,
}: ShopClientProps) {
  const [items, setItems] = useState<Item[]>(initialItems || [])
  const [coinBalance, setCoinBalance] = useState(initialCoinBalance || 0)
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const { toast } = useToast()
  const supabase = createClient()

  // Filter items based on search
  const filteredItems = items.filter(
    (item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase())),
  )

  // Refresh data
  const refreshData = async () => {
    setLoading(true)
    try {
      const [itemsResponse, balanceResponse] = await Promise.all([
        // Use correct table name: items
        supabase
          .from("items")
          .select("*")
          .eq("is_active", true)
          .order("created_at", { ascending: false }),
        supabase.from("user_coins").select("balance").eq("user_id", user?.id).single(),
      ])

      if (itemsResponse.data) setItems(itemsResponse.data)
      if (balanceResponse.data) setCoinBalance(balanceResponse.data.balance || 0)
    } catch (error) {
      console.error("Error refreshing data:", error)
      toast({
        title: "Error",
        description: "Failed to refresh data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Convert item to purchase item
  const toPurchaseItem = (item: Item): PurchaseItem => ({
    id: item.id,
    name: item.name,
    price: item.price,
    type: "item",
    image_url: item.image_url || undefined,
    description: item.description || undefined,
    stock: item.stock,
  })

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">Shop</h1>
          <p className="text-muted-foreground mt-1">Purchase items with your coins</p>
        </div>

        <div className="flex items-center gap-4">
          {/* Coin Balance */}
          <Card className="bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 border-yellow-200 dark:border-yellow-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                <div>
                  <p className="text-sm text-muted-foreground">Balance</p>
                  <p className="text-xl font-bold text-yellow-700 dark:text-yellow-300">
                    {coinBalance.toLocaleString()}
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={refreshData} disabled={loading}>
                  <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Admin Controls */}
          {isAdmin && (
            <Button asChild variant="outline">
              <Link href="/shop/admin">
                <Edit className="w-4 h-4 mr-2" />
                Manage
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Search and View Controls */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex gap-2">
          <Button variant={viewMode === "grid" ? "default" : "outline"} size="sm" onClick={() => setViewMode("grid")}>
            <Grid className="w-4 h-4" />
          </Button>
          <Button variant={viewMode === "list" ? "default" : "outline"} size="sm" onClick={() => setViewMode("list")}>
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Items Display */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="w-full h-48 bg-muted rounded-md"></div>
                <div className="h-4 bg-muted rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-3 bg-muted rounded w-full mb-2"></div>
                <div className="h-3 bg-muted rounded w-2/3"></div>
              </CardContent>
              <CardFooter>
                <div className="h-10 bg-muted rounded w-full"></div>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">{searchQuery ? "No items found" : "No Items Available"}</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery ? `No items match "${searchQuery}"` : "There are currently no items in the shop."}
            </p>
            {isAdmin && !searchQuery && (
              <Button asChild>
                <Link href="/shop/admin">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Items
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div
          className={
            viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" : "space-y-4"
          }
        >
          {filteredItems.map((item) => (
            <Card
              key={item.id}
              className={`overflow-hidden hover:shadow-lg transition-shadow ${
                viewMode === "list" ? "flex flex-row" : ""
              }`}
            >
              <div className={viewMode === "list" ? "w-48 flex-shrink-0" : ""}>
                {item.image_url ? (
                  <img
                    src={item.image_url || "/placeholder.svg"}
                    alt={item.name}
                    className={`object-cover ${viewMode === "list" ? "w-full h-full" : "w-full h-48"}`}
                  />
                ) : (
                  <div
                    className={`bg-muted flex items-center justify-center ${
                      viewMode === "list" ? "w-full h-full" : "w-full h-48"
                    }`}
                  >
                    <Package className="w-12 h-12 text-muted-foreground" />
                  </div>
                )}
              </div>

              <div className="flex-1 flex flex-col">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start gap-2">
                    <h3 className="font-semibold text-lg line-clamp-1">{item.name}</h3>
                    <Badge variant={item.stock > 0 ? "default" : "secondary"}>
                      {item.stock > 0 ? `${item.stock} left` : "Out of stock"}
                    </Badge>
                  </div>
                  {item.description && <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>}
                </CardHeader>

                <CardContent className="pb-3 flex-1">
                  <div className="flex items-center gap-1">
                    <Coins className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                    <span className="font-bold text-lg">{item.price.toLocaleString()}</span>
                    <span className="text-sm text-muted-foreground">coins</span>
                  </div>
                </CardContent>

                <CardFooter className="pt-0">
                  <PurchaseButton
                    item={toPurchaseItem(item)}
                    userBalance={coinBalance}
                    onSuccess={refreshData}
                    className="w-full"
                  />
                </CardFooter>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Quick Actions */}
      <div className="mt-12 text-center">
        <h2 className="text-xl font-semibold mb-4">Need More Coins?</h2>
        <div className="flex flex-wrap justify-center gap-4">
          <Button asChild variant="outline">
            <Link href="/earn-coins">
              <Coins className="w-4 h-4 mr-2" />
              Earn Coins
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/quiz">
              <Package className="w-4 h-4 mr-2" />
              Take Quiz
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
