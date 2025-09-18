"use client"

import type { User } from "@supabase/supabase-js"
import SidebarLayout from "@/components/layout/sidebar-layout"
import ProtectedRoute from "@/components/auth/protected-route"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileDown, Package, ArrowLeft, ExternalLink, Calendar } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"

interface DownloadItem {
  id: string
  download_url: string
  purchased_at: string
  items: {
    id: string
    name: string
    description: string
    image_url?: string
  }
}

interface DownloadsClientProps {
  user: User
  profile: any
  downloads: DownloadItem[]
}

export default function DownloadsClient({ user, profile, downloads }: DownloadsClientProps) {
  return (
    <ProtectedRoute>
      <SidebarLayout user={user} profile={profile} currentPath="/downloads">
        <div className="container mx-auto p-4 md:p-6 lg:p-8">
          <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" asChild className="mb-2">
                  <Link href="/dashboard">
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Back to Dashboard
                  </Link>
                </Button>
              </div>
              <h1 className="text-3xl font-bold gradient-heading">My Downloads</h1>
              <p className="mt-2 text-muted-foreground">Access your purchased digital products</p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Your Digital Products</CardTitle>
            </CardHeader>
            <CardContent>
              {downloads.length === 0 ? (
                <div className="rounded-lg border p-8 text-center">
                  <FileDown className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h2 className="text-xl font-semibold mb-2">No downloads available</h2>
                  <p className="text-muted-foreground mb-4">You haven't purchased any digital products yet</p>
                  <Button asChild>
                    <Link href="/shop">Browse Shop</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {downloads.map((download) => (
                    <div key={download.id} className="rounded-lg border p-4">
                      <div className="flex flex-col md:flex-row md:items-center gap-4">
                        <div className="flex items-center gap-3">
                          {download.items.image_url ? (
                            <img
                              src={download.items.image_url || "/placeholder.svg"}
                              alt={download.items.name}
                              className="h-16 w-16 rounded-md object-cover"
                            />
                          ) : (
                            <div className="h-16 w-16 rounded-md bg-muted flex items-center justify-center">
                              <Package className="h-8 w-8 text-muted-foreground" />
                            </div>
                          )}
                          <div>
                            <h3 className="font-medium">{download.items.name}</h3>
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              {download.items.description || "No description"}
                            </p>
                            <p className="text-xs text-muted-foreground flex items-center mt-1">
                              <Calendar className="h-3 w-3 mr-1" />
                              Purchased on {format(new Date(download.purchased_at), "MMM d, yyyy")}
                            </p>
                          </div>
                        </div>

                        <div className="md:ml-auto">
                          <Button asChild>
                            <a href={download.download_url} target="_blank" rel="noopener noreferrer">
                              <FileDown className="h-4 w-4 mr-2" />
                              Download
                              <ExternalLink className="h-3 w-3 ml-1" />
                            </a>
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </SidebarLayout>
    </ProtectedRoute>
  )
}
