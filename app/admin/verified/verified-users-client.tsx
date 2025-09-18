"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import VerifiedBadge from "@/components/ui/verified-badge"
import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow } from "date-fns"
import { CheckCircle, Database } from "lucide-react"

interface VerifiedUser {
  id: string
  username?: string
  name?: string
  email?: string
  avatar_url?: string
  verified: boolean
  verified_at: string
  verified_by: string
  verified_by_name?: string
}

interface VerifiedUsersClientProps {
  initialUsers: VerifiedUser[]
}

export default function VerifiedUsersClient({ initialUsers }: VerifiedUsersClientProps) {
  const [users, setUsers] = useState<VerifiedUser[]>(initialUsers)
  const supabase = createClient()

  useEffect(() => {
    // Subscribe to changes in verified users
    const channel = supabase
      .channel("verified-users-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "profiles",
          filter: "verified=eq.true",
        },
        () => {
          // Refresh the verified users list
          refreshUsers()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const refreshUsers = async () => {
    const { data } = await supabase.from("verified_users").select("*").order("verified_at", { ascending: false })

    if (data) {
      setUsers(data)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-blue-500" />
            Verified Users ({users.length})
          </CardTitle>
          <CardDescription>
            Users with verified badges. Manage verification status from Supabase admin panel.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No verified users yet.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Verified</TableHead>
                  <TableHead>Verified At</TableHead>
                  <TableHead>Verified By</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.avatar_url || ""} alt={user.name || "User"} />
                          <AvatarFallback>{(user.name || user.username || "U").charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-1">
                            <span className="font-medium">{user.name || user.username || "Anonymous"}</span>
                            <VerifiedBadge verified={user.verified} size="sm" />
                          </div>
                          {user.username && <div className="text-sm text-muted-foreground">@{user.username}</div>}
                          <div className="text-xs text-muted-foreground">{user.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Verified
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.verified_at
                        ? formatDistanceToNow(new Date(user.verified_at), { addSuffix: true })
                        : "Unknown"}
                    </TableCell>
                    <TableCell>{user.verified_by_name || "System"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Supabase Management
          </CardTitle>
          <CardDescription>Use these SQL functions in Supabase to manage verified badges:</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-medium mb-2">Verify a User:</h4>
            <code className="text-sm">SELECT verify_user('user_id_here', 'admin_user_id_here');</code>
          </div>

          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-medium mb-2">Unverify a User:</h4>
            <code className="text-sm">SELECT unverify_user('user_id_here', 'admin_user_id_here');</code>
          </div>

          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-medium mb-2">View All Verified Users:</h4>
            <code className="text-sm">SELECT * FROM verified_users ORDER BY verified_at DESC;</code>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
