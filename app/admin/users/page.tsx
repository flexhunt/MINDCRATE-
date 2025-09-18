import type { Metadata } from "next"
import UserManagementClient from "./user-management-client"

export const metadata: Metadata = {
  title: "User Management",
  description: "Manage users, view activity, and perform administrative actions",
}

export default function UserManagementPage() {
  return <UserManagementClient />
}
