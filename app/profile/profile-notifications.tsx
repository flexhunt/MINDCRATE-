"use client"

import dynamic from "next/dynamic"

// Dynamic import to avoid SSR issues
const PushSetup = dynamic(() => import("@/components/PushSetup").then((mod) => ({ default: mod.PushSetup })), {
  ssr: false,
  loading: () => <div className="animate-pulse bg-gray-200 h-32 rounded-lg"></div>,
})

export function ProfileNotifications() {
  return (
    <div className="mt-6 p-4 border rounded-lg">
      <h2 className="text-lg font-semibold mb-2">📱 Notification Settings</h2>
      <PushSetup />
    </div>
  )
}
