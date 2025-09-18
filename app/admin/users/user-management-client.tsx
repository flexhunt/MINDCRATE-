"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ChevronDown,
  Search,
  Trash2,
  MoreVertical,
  UserX,
  RefreshCw,
  Clock,
  Calendar,
  Filter,
  UserCheck,
  Shield,
  Eye,
} from "lucide-react"
import { deleteUser } from "./actions"
import { formatDistanceToNow } from "date-fns"

type User = {
  id: string
  email: string
  created_at: string
  last_sign_in_at: string | null
  user_metadata: {
    name?: string
    avatar_url?: string
  }
  app_metadata: {
    provider?: string
    providers?: string[]
  }
}

type SortField = "created_at" | "last_sign_in_at" | "email"
type SortOrder = "asc" | "desc"

export default function UserManagementClient() {
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortField, setSortField] = useState<SortField>("created_at")
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc")
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [activeTab, setActiveTab] = useState("all")

  const supabase = createClient()

  useEffect(() => {
    fetchUsers()
  }, [])

  useEffect(() => {
    let result = [...users]

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (user) =>
          user.email?.toLowerCase().includes(query) ||
          user.user_metadata?.name?.toLowerCase().includes(query) ||
          user.id.toLowerCase().includes(query),
      )
    }

    // Filter by tab
    if (activeTab === "recent") {
      const oneWeekAgo = new Date()
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
      result = result.filter((user) => new Date(user.created_at) >= oneWeekAgo)
    } else if (activeTab === "inactive") {
      const threeMonthsAgo = new Date()
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
      result = result.filter((user) => !user.last_sign_in_at || new Date(user.last_sign_in_at) <= threeMonthsAgo)
    }

    // Sort users
    result.sort((a, b) => {
      if (sortField === "email") {
        return sortOrder === "asc" ? a.email.localeCompare(b.email) : b.email.localeCompare(a.email)
      } else {
        const dateA = new Date(a[sortField] || 0).getTime()
        const dateB = new Date(b[sortField] || 0).getTime()
        return sortOrder === "asc" ? dateA - dateB : dateB - dateA
      }
    })

    setFilteredUsers(result)
  }, [users, searchQuery, sortField, sortOrder, activeTab])

  const fetchUsers = async () => {
    setIsLoading(true)
    try {
      // Get users from profiles table instead of auth admin
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select(`
    id,
    email,
    username,
    name,
    avatar_url,
    created_at,
    updated_at
  `)
        .order("created_at", { ascending: false })

      if (error) {
        throw error
      }

      // Transform to match User type
      const transformedUsers =
        profiles?.map((profile) => ({
          id: profile.id,
          email: profile.email || "No email",
          created_at: profile.created_at,
          last_sign_in_at: profile.updated_at, // Use updated_at as proxy for last activity
          user_metadata: {
            name: profile.name || profile.username,
            avatar_url: profile.avatar_url,
          },
          app_metadata: {
            provider: "email",
            providers: ["email"],
          },
        })) || []

      setUsers(transformedUsers)
    } catch (error) {
      console.error("Error fetching users:", error)
      // Use console.log instead of toast for now
      console.log("Error fetching users. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    setIsDeleting(true)
    try {
      const result = await deleteUser(userId)

      if (result.success) {
        setUsers(users.filter((user) => user.id !== userId))
        console.log("User deleted successfully")
      } else {
        throw new Error(result.error || "Failed to delete user")
      }
    } catch (error) {
      console.error("Error deleting user:", error)
      console.error("Error deleting user:", error)
    } finally {
      setIsDeleting(false)
      setSelectedUser(null)
    }
  }

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortOrder("desc")
    }
  }

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return null
    return sortOrder === "asc" ? "↑" : "↓"
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never"
    return formatDistanceToNow(new Date(dateString), { addSuffix: true })
  }

  const getProviderBadge = (user: User) => {
    const providers = user.app_metadata?.providers || []
    const provider = user.app_metadata?.provider || "email"

    const getColor = (provider: string) => {
      switch (provider) {
        case "google":
          return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
        case "github":
          return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
        case "twitter":
          return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
        case "facebook":
          return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300"
        default:
          return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      }
    }

    return (
      <div className="flex flex-wrap gap-1">
        {providers.length > 0 ? (
          providers.map((p) => (
            <Badge key={p} className={getColor(p)} variant="outline">
              {p}
            </Badge>
          ))
        ) : (
          <Badge className={getColor(provider)} variant="outline">
            {provider}
          </Badge>
        )}
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">Manage users, view activity, and perform administrative actions</p>
        </div>
        <Button onClick={fetchUsers} disabled={isLoading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>{filteredUsers.length} users found</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by email, name or ID..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Filter className="mr-2 h-4 w-4" />
                  Sort
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[200px]">
                <DropdownMenuLabel>Sort by</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => toggleSort("created_at")}>
                  <Calendar className="mr-2 h-4 w-4" />
                  Sign Up Date {getSortIcon("created_at")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => toggleSort("last_sign_in_at")}>
                  <Clock className="mr-2 h-4 w-4" />
                  Last Login {getSortIcon("last_sign_in_at")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => toggleSort("email")}>
                  <UserCheck className="mr-2 h-4 w-4" />
                  Email {getSortIcon("email")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="all">All Users</TabsTrigger>
              <TabsTrigger value="recent">Recent Signups</TabsTrigger>
              <TabsTrigger value="inactive">Inactive Users</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[250px]">User</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead className="cursor-pointer" onClick={() => toggleSort("created_at")}>
                    Signup Date {getSortIcon("created_at")}
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => toggleSort("last_sign_in_at")}>
                    Last Login {getSortIcon("last_sign_in_at")}
                  </TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      Loading users...
                    </TableCell>
                  </TableRow>
                ) : filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      No users found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <span className="font-medium">{user.user_metadata?.name || "Unnamed User"}</span>
                          <span className="text-sm text-muted-foreground">{user.email}</span>
                          <span className="text-xs text-muted-foreground truncate max-w-[200px]" title={user.id}>
                            ID: {user.id}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{getProviderBadge(user)}</TableCell>
                      <TableCell>{formatDate(user.created_at)}</TableCell>
                      <TableCell>{formatDate(user.last_sign_in_at)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                              <span className="sr-only">Open menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-600 focus:text-red-600"
                              onClick={() => setSelectedUser(user)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete User
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Eye className="mr-2 h-4 w-4" />
                              View Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Shield className="mr-2 h-4 w-4" />
                              Make Admin
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {filteredUsers.length} of {users.length} users
          </div>
        </CardFooter>
      </Card>

      <AlertDialog open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center text-red-600">
              <UserX className="mr-2 h-5 w-5" />
              Delete User Account
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the user account for{" "}
              <span className="font-semibold">{selectedUser?.email}</span> and all associated data.
              <ul className="mt-2 list-disc list-inside">
                <li>Profile information</li>
                <li>Messages and chat history</li>
                <li>Course progress and quiz results</li>
                <li>All other user-related data</li>
              </ul>
              <div className="mt-2 text-red-600 font-semibold">This action cannot be undone.</div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
              onClick={() => selectedUser && handleDeleteUser(selectedUser.id)}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete User"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
