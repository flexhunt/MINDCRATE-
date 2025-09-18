"use client"

import type React from "react"

import { useState } from "react"
import type { User } from "@supabase/supabase-js"
import AppShell from "@/components/layout/app-shell"
import ProtectedRoute from "@/components/auth/protected-route"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Plus,
  Package,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Loader2,
  ArrowLeft,
  Save,
  X,
  Database,
  ShieldAlert,
  Wrench,
} from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

// Update the ShopItem interface to include download_url
interface ShopItem {
  id: string
  name: string
  description: string
  price: number
  image_url?: string
  download_url?: string
  stock: number
  is_active: boolean
  created_at: string
}

interface AdminClientProps {
  user: User
  profile: any
  items: ShopItem[]
  shopTablesExist?: boolean
  isAdmin?: boolean
}

export default function AdminClient({
  user,
  profile,
  items: initialItems,
  shopTablesExist = true,
  isAdmin = false,
}: AdminClientProps) {
  const [items, setItems] = useState(initialItems)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isInitializing, setIsInitializing] = useState(false)
  const [editingItem, setEditingItem] = useState<Partial<ShopItem> | null>(null)
  const [formData, setFormData] = useState<Partial<ShopItem>>({
    name: "",
    description: "",
    price: 0,
    image_url: "",
    download_url: "",
    stock: 1,
    is_active: true,
  })
  const [isFixingDb, setIsFixingDb] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: name === "price" || name === "stock" ? Number.parseInt(value) || 0 : value,
    }))
  }

  const handleSwitchChange = (checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      is_active: checked,
    }))
  }

  const handleInitializeShop = async () => {
    try {
      setIsInitializing(true)

      const response = await fetch("/api/shop/init", {
        method: "POST",
      })

      const data = await response.json()

      if (!response.ok) {
        toast({
          title: "Error",
          description: data.error || "Failed to initialize shop system",
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Success",
        description: "Shop system initialized successfully. Refreshing page...",
      })

      // Refresh the page after a short delay
      setTimeout(() => {
        window.location.reload()
      }, 1500)
    } catch (error) {
      console.error("Error initializing shop:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsInitializing(false)
    }
  }

  const handleCreateItem = async () => {
    try {
      setIsLoading(true)

      // Validate form
      if (!formData.name || !formData.price) {
        toast({
          title: "Validation Error",
          description: "Name and price are required",
          variant: "destructive",
        })
        return
      }

      // Make sure to include created_by in the request
      const response = await fetch("/api/shop/admin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          created_by: user.id, // Explicitly include the user ID
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        toast({
          title: "Error",
          description: data.error || "Failed to create item",
          variant: "destructive",
        })
        return
      }

      // Add new item to the list
      setItems((prev) => [data.item, ...prev])

      toast({
        title: "Success",
        description: "Item created successfully",
      })

      // Reset form and close dialog
      setFormData({
        name: "",
        description: "",
        price: 0,
        image_url: "",
        download_url: "",
        stock: 1,
        is_active: true,
      })
      setIsDialogOpen(false)
    } catch (error) {
      console.error("Create item error:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateItem = async () => {
    if (!editingItem?.id) return

    try {
      setIsLoading(true)

      // Validate form
      if (!formData.name || !formData.price) {
        toast({
          title: "Validation Error",
          description: "Name and price are required",
          variant: "destructive",
        })
        return
      }

      const response = await fetch("/api/shop/admin", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: editingItem.id,
          ...formData,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        toast({
          title: "Error",
          description: data.error || "Failed to update item",
          variant: "destructive",
        })
        return
      }

      // Update item in the list
      setItems((prev) => prev.map((item) => (item.id === editingItem.id ? data.item : item)))

      toast({
        title: "Success",
        description: "Item updated successfully",
      })

      // Reset form and close dialog
      setEditingItem(null)
      setFormData({
        name: "",
        description: "",
        price: 0,
        image_url: "",
        download_url: "",
        stock: 1,
        is_active: true,
      })
      setIsDialogOpen(false)
    } catch (error) {
      console.error("Update item error:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteItem = async (id: string) => {
    if (!confirm("Are you sure you want to delete this item?")) return

    try {
      setIsLoading(true)

      const response = await fetch(`/api/shop/admin?id=${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const data = await response.json()
        toast({
          title: "Error",
          description: data.error || "Failed to delete item",
          variant: "destructive",
        })
        return
      }

      // Remove item from the list
      setItems((prev) => prev.filter((item) => item.id !== id))

      toast({
        title: "Success",
        description: "Item deleted successfully",
      })
    } catch (error) {
      console.error("Delete item error:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    try {
      setIsLoading(true)

      const response = await fetch("/api/shop/admin", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id,
          is_active: !currentActive,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        toast({
          title: "Error",
          description: data.error || "Failed to update item",
          variant: "destructive",
        })
        return
      }

      // Update item in the list
      setItems((prev) => prev.map((item) => (item.id === id ? data.item : item)))

      toast({
        title: "Success",
        description: `Item ${!currentActive ? "activated" : "deactivated"} successfully`,
      })
    } catch (error) {
      console.error("Toggle active error:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const openEditDialog = (item: ShopItem) => {
    setEditingItem(item)
    setFormData({
      name: item.name,
      description: item.description,
      price: item.price,
      image_url: item.image_url || "",
      download_url: item.download_url || "",
      stock: item.stock,
      is_active: item.is_active,
    })
    setIsDialogOpen(true)
  }

  const handleFixDatabase = async () => {
    try {
      setIsFixingDb(true)

      const response = await fetch("/api/shop/fix-db", {
        method: "POST",
      })

      const data = await response.json()

      if (!response.ok) {
        toast({
          title: "Error",
          description: data.error || "Failed to fix database structure",
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Success",
        description: "Database structure fixed successfully. Refreshing page...",
      })

      // Refresh the page after a short delay
      setTimeout(() => {
        window.location.reload()
      }, 1500)
    } catch (error) {
      console.error("Error fixing database:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsFixingDb(false)
    }
  }

  // If shop tables don't exist, show initialization UI
  if (!shopTablesExist) {
    return (
      <ProtectedRoute>
        <AppShell user={user} profile={profile} currentPath="/shop/admin">
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
                <h1 className="text-3xl font-bold gradient-heading">Shop Admin</h1>
                <p className="mt-2 text-muted-foreground">Manage shop items</p>
              </div>
            </div>

            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Shop System Setup</CardTitle>
                <CardDescription>
                  The shop system tables don't exist yet. You need to initialize them before you can manage items.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Alert className="mb-4">
                  <Database className="h-4 w-4" />
                  <AlertTitle>Database Tables Missing</AlertTitle>
                  <AlertDescription>
                    The required database tables for the shop system haven't been created yet. Click the button below to
                    initialize the shop system.
                  </AlertDescription>
                </Alert>
              </CardContent>
              <CardFooter>
                <Button onClick={handleInitializeShop} disabled={isInitializing}>
                  {isInitializing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Initializing...
                    </>
                  ) : (
                    <>
                      <Database className="mr-2 h-4 w-4" />
                      Initialize Shop System
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </AppShell>
      </ProtectedRoute>
    )
  }

  // If shop tables exist but user is not an admin
  if (!isAdmin) {
    return (
      <ProtectedRoute>
        <AppShell user={user} profile={profile} currentPath="/shop/admin">
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
                <h1 className="text-3xl font-bold gradient-heading">Shop Admin</h1>
                <p className="mt-2 text-muted-foreground">Manage shop items</p>
              </div>
            </div>

            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Access Denied</CardTitle>
                <CardDescription>You don't have admin privileges to manage the shop.</CardDescription>
              </CardHeader>
              <CardContent>
                <Alert variant="destructive" className="mb-4">
                  <ShieldAlert className="h-4 w-4" />
                  <AlertTitle>Admin Access Required</AlertTitle>
                  <AlertDescription>
                    You need admin privileges to access this page. Please contact an administrator if you believe you
                    should have access.
                  </AlertDescription>
                </Alert>
              </CardContent>
              <CardFooter>
                <Button asChild>
                  <Link href="/shop">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Return to Shop
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
        </AppShell>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <AppShell user={user} profile={profile} currentPath="/shop/admin">
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
              <h1 className="text-3xl font-bold gradient-heading">Shop Admin</h1>
              <p className="mt-2 text-muted-foreground">Manage shop items</p>
            </div>

            <Button variant="outline" onClick={handleFixDatabase} disabled={isFixingDb} className="mr-2">
              {isFixingDb ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Fixing...
                </>
              ) : (
                <>
                  <Wrench className="mr-2 h-4 w-4" />
                  Fix Database
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={async () => {
                try {
                  setIsFixingDb(true)
                  const response = await fetch("/api/shop/direct-fix", { method: "POST" })
                  const data = await response.json()

                  if (response.ok) {
                    toast({
                      title: "Migration Created",
                      description: "Database migration created successfully. Please run it in the Supabase SQL editor.",
                    })

                    // Show SQL in a dialog or alert
                    alert(`Please run this SQL in your Supabase SQL editor:\n\n${data.migration}`)
                  } else {
                    toast({
                      title: "Error",
                      description: data.error || "Failed to create migration",
                      variant: "destructive",
                    })
                  }
                } catch (error) {
                  console.error("Error creating migration:", error)
                  toast({
                    title: "Error",
                    description: "An unexpected error occurred",
                    variant: "destructive",
                  })
                } finally {
                  setIsFixingDb(false)
                }
              }}
              disabled={isFixingDb}
              className="mr-2"
            >
              <Database className="mr-2 h-4 w-4" />
              Get SQL Fix
            </Button>
            <Button
              onClick={() => {
                setEditingItem(null)
                setFormData({
                  name: "",
                  description: "",
                  price: 0,
                  image_url: "",
                  download_url: "",
                  stock: 1,
                  is_active: true,
                })
                setIsDialogOpen(true)
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add New Item
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Shop Items</CardTitle>
            </CardHeader>
            <CardContent>
              {items.length === 0 ? (
                <div className="rounded-lg border p-8 text-center">
                  <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h2 className="text-xl font-semibold mb-2">No items available</h2>
                  <p className="text-muted-foreground mb-4">Add your first item to the shop</p>
                  <Button
                    onClick={() => {
                      setEditingItem(null)
                      setFormData({
                        name: "",
                        description: "",
                        price: 0,
                        image_url: "",
                        download_url: "",
                        stock: 1,
                        is_active: true,
                      })
                      setIsDialogOpen(true)
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                </div>
              ) : (
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Stock</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              {item.image_url ? (
                                <img
                                  src={item.image_url || "/placeholder.svg"}
                                  alt={item.name}
                                  className="h-10 w-10 rounded-md object-cover"
                                />
                              ) : (
                                <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center">
                                  <Package className="h-5 w-5 text-muted-foreground" />
                                </div>
                              )}
                              <div>
                                <p className="font-medium">{item.name}</p>
                                <p className="text-xs text-muted-foreground line-clamp-1">
                                  {item.description || "No description"}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{item.price.toLocaleString()} coins</TableCell>
                          <TableCell>
                            {item.stock === 0 ? (
                              <Badge variant="destructive">Out of stock</Badge>
                            ) : item.stock <= 5 ? (
                              <Badge variant="outline" className="text-amber-600 border-amber-600">
                                {item.stock} left
                              </Badge>
                            ) : (
                              item.stock
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant={item.is_active ? "default" : "secondary"}>
                              {item.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => handleToggleActive(item.id, item.is_active)}
                                disabled={isLoading}
                              >
                                {item.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                <span className="sr-only">{item.is_active ? "Deactivate" : "Activate"}</span>
                              </Button>
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => openEditDialog(item)}
                                disabled={isLoading}
                              >
                                <Edit className="h-4 w-4" />
                                <span className="sr-only">Edit</span>
                              </Button>
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => handleDeleteItem(item.id)}
                                disabled={isLoading}
                              >
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Delete</span>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Item form dialog */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>{editingItem ? "Edit Item" : "Add New Item"}</DialogTitle>
                <DialogDescription>
                  {editingItem
                    ? "Update the details of this shop item"
                    : "Fill in the details to create a new shop item"}
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Item name"
                    disabled={isLoading}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Item description"
                    disabled={isLoading}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="price">Price (coins) *</Label>
                    <Input
                      id="price"
                      name="price"
                      type="number"
                      min="1"
                      value={formData.price}
                      onChange={handleInputChange}
                      disabled={isLoading}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="stock">Stock *</Label>
                    <Input
                      id="stock"
                      name="stock"
                      type="number"
                      min="0"
                      value={formData.stock}
                      onChange={handleInputChange}
                      disabled={isLoading}
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="image_url">Image URL</Label>
                  <Input
                    id="image_url"
                    name="image_url"
                    value={formData.image_url}
                    onChange={handleInputChange}
                    placeholder="https://example.com/image.jpg"
                    disabled={isLoading}
                  />
                </div>
                // Then in the form dialog section, add this field:
                <div className="grid gap-2">
                  <Label htmlFor="download_url">Download URL (for digital products)</Label>
                  <Input
                    id="download_url"
                    name="download_url"
                    value={formData.download_url || ""}
                    onChange={handleInputChange}
                    placeholder="https://example.com/files/product.pdf"
                    disabled={isLoading}
                  />
                  <p className="text-xs text-muted-foreground">
                    Leave empty for physical products. For digital products, enter the URL to the downloadable file.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={handleSwitchChange}
                    disabled={isLoading}
                  />
                  <Label htmlFor="is_active">Active (visible in shop)</Label>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isLoading}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button onClick={editingItem ? handleUpdateItem : handleCreateItem} disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {editingItem ? "Updating..." : "Creating..."}
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      {editingItem ? "Update Item" : "Create Item"}
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </AppShell>
    </ProtectedRoute>
  )
}
