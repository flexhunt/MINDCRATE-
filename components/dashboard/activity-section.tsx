import { LiveActivityFeed } from "@/components/activity/live-activity-feed"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function ActivitySection() {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Live Activity</CardTitle>
        <CardDescription>See what's happening in the community right now</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <LiveActivityFeed />
      </CardContent>
    </Card>
  )
}
