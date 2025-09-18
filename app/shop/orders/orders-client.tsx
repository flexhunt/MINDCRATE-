"use client"

import type { User } from "@supabase/supabase-js"
import AppShell from "@/components/layout/app-shell"
import ProtectedRoute from "@/components/auth/protected-route"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ShoppingBag, Package, ArrowLeft } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { format } from "date-fns"

interface OrderItem {
  id: string
  name: string
  description: string
  image_url?: string
}

interface Order {
  id: string
  price_paid: number
  status: string
  ordered_at: string
  items: OrderItem
}

interface OrdersClientProps {
  user: User
  profile: any
  orders: Order[]
}

export default function OrdersClient({ user, profile, orders }: OrdersClientProps) {
  return (
    <ProtectedRoute>
      <AppShell user={user} profile={profile} currentPath="/shop/orders">
        <div className="container mx-auto p-4 md:p-6 lg:p-8">
          <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" asChild className="mb-2">
                  <Link href="/shop">
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Back to Shop
                  </Link>
                </Button>
              </div>
              <h1 className="text-3xl font-bold gradient-heading">Order History</h1>
              <p className="mt-2 text-muted-foreground">View your purchase history</p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Your Orders</CardTitle>
            </CardHeader>
            <CardContent>
              {orders.length === 0 ? (
                <div className="rounded-lg border p-8 text-center">
                  <ShoppingBag className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h2 className="text-xl font-semibold mb-2">No orders yet</h2>
                  <p className="text-muted-foreground mb-4">You haven't made any purchases yet</p>
                  <Button asChild>
                    <Link href="/shop">Browse Shop</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div key={order.id} className="rounded-lg border p-4">
                      <div className="flex flex-col md:flex-row md:items-center gap-4">
                        <div className="flex items-center gap-3">
                          {order.items.image_url ? (
                            <img
                              src={order.items.image_url || "/placeholder.svg"}
                              alt={order.items.name}
                              className="h-16 w-16 rounded-md object-cover"
                            />
                          ) : (
                            <div className="h-16 w-16 rounded-md bg-muted flex items-center justify-center">
                              <Package className="h-8 w-8 text-muted-foreground" />
                            </div>
                          )}
                          <div>
                            <h3 className="font-medium">{order.items.name}</h3>
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              {order.items.description || "No description"}
                            </p>
                          </div>
                        </div>

                        <div className="md:ml-auto flex flex-col md:flex-row gap-4 md:items-center">
                          <div className="text-sm">
                            <p className="font-medium">{order.price_paid.toLocaleString()} coins</p>
                            <p className="text-muted-foreground">{format(new Date(order.ordered_at), "MMM d, yyyy")}</p>
                          </div>

                          <Badge
                            variant={
                              order.status === "completed"
                                ? "default"
                                : order.status === "pending"
                                  ? "outline"
                                  : "secondary"
                            }
                          >
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </AppShell>
    </ProtectedRoute>
  )
}
