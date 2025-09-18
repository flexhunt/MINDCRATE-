"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Send,
  Clock,
  History,
  Settings,
  FileText,
  Bell,
  CheckCircle,
  XCircle,
  Calendar,
  Save,
  Trash2,
  Eye,
  Info,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

type NotificationTemplate = {
  id: string
  name: string
  title: string
  body: string
  icon?: string
  url?: string
  image?: string
}

type ScheduledNotification = {
  id: string
  title: string
  body: string
  scheduled_for: string
  status: string
  created_at: string
}

type NotificationLog = {
  id: string
  title: string
  body: string
  sent_count: number
  failed_count: number
  total_count: number
  created_at: string
}

const iconOptions = [
  { value: "/notification-icon.png", label: "Mindcrate Icon", icon: "🧠" },
  { value: "/logo.png", label: "Logo", icon: "🏠" },
  { value: "/notification-icon.png", label: "Notification", icon: "🔔" },
]

export default function FreshBroadcastPage() {
  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")
  const [url, setUrl] = useState("")
  const [image, setImage] = useState("")
  const [icon, setIcon] = useState("/notification-icon.png")
  const [isLoading, setIsLoading] = useState(false)
  const [templates, setTemplates] = useState<NotificationTemplate[]>([])
  const [scheduled, setScheduled] = useState<ScheduledNotification[]>([])
  const [logs, setLogs] = useState<NotificationLog[]>([])
  const [scheduledDate, setScheduledDate] = useState("")
  const [scheduledTime, setScheduledTime] = useState("")
  const [templateName, setTemplateName] = useState("")
  const [showPreview, setShowPreview] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadTemplates()
    loadScheduled()
    loadLogs()
  }, [])

  const loadTemplates = async () => {
    try {
      const response = await fetch("/api/broadcast/templates")
      if (response.ok) {
        const data = await response.json()
        setTemplates(data.templates || [])
      }
    } catch (error) {
      console.error("Failed to load templates:", error)
    }
  }

  const loadScheduled = async () => {
    try {
      const response = await fetch("/api/broadcast/scheduled")
      if (response.ok) {
        const data = await response.json()
        setScheduled(data.scheduled || [])
      }
    } catch (error) {
      console.error("Failed to load scheduled:", error)
    }
  }

  const loadLogs = async () => {
    try {
      const response = await fetch("/api/broadcast/logs")
      if (response.ok) {
        const data = await response.json()
        setLogs(data.logs || [])
      }
    } catch (error) {
      console.error("Failed to load logs:", error)
    }
  }

  const sendNotification = async () => {
    if (!title || !body) {
      toast({
        title: "Missing Information",
        description: "Please fill in title and body",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch("/api/broadcast/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, body, url, image, icon }),
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Broadcast Sent! 🚀",
          description: result.message,
        })
        setTitle("")
        setBody("")
        setUrl("")
        setImage("")
        loadLogs()
      } else {
        throw new Error(result.error || "Failed to send")
      }
    } catch (error) {
      console.error("Send error:", error)
      toast({
        title: "Send Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const scheduleNotification = async () => {
    if (!title || !body || !scheduledDate || !scheduledTime) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields including date and time",
        variant: "destructive",
      })
      return
    }

    const scheduledFor = new Date(`${scheduledDate}T${scheduledTime}`)
    if (scheduledFor <= new Date()) {
      toast({
        title: "Invalid Date",
        description: "Please select a future date and time",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch("/api/broadcast/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          body,
          url,
          image,
          icon,
          scheduled_for: scheduledFor.toISOString(),
        }),
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Notification Scheduled! ⏰",
          description: `Will be sent on ${scheduledFor.toLocaleString()}`,
        })
        setTitle("")
        setBody("")
        setUrl("")
        setImage("")
        setScheduledDate("")
        setScheduledTime("")
        loadScheduled()
      } else {
        throw new Error(result.error || "Failed to schedule")
      }
    } catch (error) {
      console.error("Schedule error:", error)
      toast({
        title: "Schedule Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const saveTemplate = async () => {
    if (!templateName || !title || !body) {
      toast({
        title: "Missing Information",
        description: "Please fill in template name, title, and body",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch("/api/broadcast/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: templateName,
          title,
          body,
          url,
          image,
          icon,
        }),
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Template Saved! 💾",
          description: `Template "${templateName}" has been saved`,
        })
        setTemplateName("")
        loadTemplates()
      } else {
        throw new Error(result.error || "Failed to save template")
      }
    } catch (error) {
      console.error("Save template error:", error)
      toast({
        title: "Save Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      })
    }
  }

  const useTemplate = useCallback(
    (template: NotificationTemplate) => {
      setTitle(template.title)
      setBody(template.body)
      setUrl(template.url || "")
      setImage(template.image || "")
      setIcon(template.icon || "/notification-icon.png")
      toast({
        title: "Template Loaded 📋",
        description: `Using template: ${template.name}`,
      })
    },
    [toast, setTitle, setBody, setUrl, setImage, setIcon],
  )

  const showNotificationPreview = () => {
    if (!title || !body) {
      toast({
        title: "Missing Information",
        description: "Please fill in title and body to preview",
        variant: "destructive",
      })
      return
    }

    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(title, {
        body,
        icon: `https://mindcrate.vercel.app${icon}`,
        badge: "https://mindcrate.vercel.app/notification-icon.png",
        image: image ? `https://mindcrate.vercel.app${image}` : undefined,
      })
      toast({
        title: "Preview Shown 👀",
        description: "Check your notifications!",
      })
    } else {
      toast({
        title: "Preview Unavailable",
        description: "Please enable notifications to see preview",
        variant: "destructive",
      })
    }
  }

  const TemplateItem = ({ template }: { template: NotificationTemplate }) => {
    const handleUseTemplate = () => {
      useTemplate(template)
    }

    return (
      <div className="border rounded-lg p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h4 className="font-medium">{template.name}</h4>
            <p className="text-sm text-muted-foreground mt-1">{template.title}</p>
            <p className="text-xs text-muted-foreground mt-1">{template.body}</p>
            {template.url && (
              <Badge variant="outline" className="mt-2 text-xs">
                {template.url}
              </Badge>
            )}
          </div>
          <div className="flex gap-2">
            <Button onClick={handleUseTemplate} size="sm" variant="outline">
              Use Template
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">🧠 Mindcrate Broadcast Center</h1>
        <p className="text-muted-foreground">
          Send, schedule, and manage push notifications with the new Mindcrate icon
        </p>
      </div>

      <Tabs defaultValue="compose" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="compose" className="flex items-center gap-2">
            <Send className="h-4 w-4" />
            Compose
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="scheduled" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Scheduled
          </TabsTrigger>
          <TabsTrigger value="logs" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Logs
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="compose">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Compose Notification
                </CardTitle>
                <CardDescription>Create and send a push notification with the new Mindcrate icon</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Notification title"
                    maxLength={50}
                  />
                  <p className="text-xs text-muted-foreground mt-1">{title.length}/50 characters</p>
                </div>

                <div>
                  <Label htmlFor="body">Message *</Label>
                  <Textarea
                    id="body"
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="Notification message"
                    rows={3}
                    maxLength={200}
                  />
                  <p className="text-xs text-muted-foreground mt-1">{body.length}/200 characters</p>
                </div>

                <div>
                  <Label htmlFor="icon">Icon</Label>
                  <Select value={icon} onValueChange={setIcon}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {iconOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center gap-2">
                            <span>{option.icon}</span>
                            <span>{option.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="url">Action URL (optional)</Label>
                  <Input
                    id="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="/dashboard or https://example.com"
                  />
                </div>

                <div>
                  <Label htmlFor="image">Image URL (optional)</Label>
                  <Input
                    id="image"
                    value={image}
                    onChange={(e) => setImage(e.target.value)}
                    placeholder="/images/banner.jpg"
                  />
                </div>

                <div className="flex gap-2">
                  <Button onClick={sendNotification} disabled={isLoading} className="flex-1">
                    <Send className="h-4 w-4 mr-2" />
                    {isLoading ? "Sending..." : "Send Now"}
                  </Button>
                  <Button onClick={showNotificationPreview} variant="outline">
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-medium mb-2">Schedule for Later</h4>
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <div>
                      <Label htmlFor="date">Date</Label>
                      <Input
                        id="date"
                        type="date"
                        value={scheduledDate}
                        onChange={(e) => setScheduledDate(e.target.value)}
                        min={new Date().toISOString().split("T")[0]}
                      />
                    </div>
                    <div>
                      <Label htmlFor="time">Time</Label>
                      <Input
                        id="time"
                        type="time"
                        value={scheduledTime}
                        onChange={(e) => setScheduledTime(e.target.value)}
                      />
                    </div>
                  </div>
                  <Button onClick={scheduleNotification} disabled={isLoading} variant="outline" className="w-full">
                    <Clock className="h-4 w-4 mr-2" />
                    Schedule Notification
                  </Button>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-medium mb-2">Save as Template</h4>
                  <div className="flex gap-2">
                    <Input
                      value={templateName}
                      onChange={(e) => setTemplateName(e.target.value)}
                      placeholder="Template name"
                    />
                    <Button onClick={saveTemplate} variant="outline">
                      <Save className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Preview</CardTitle>
                <CardDescription>How your notification will look with the Mindcrate icon</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-900">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded bg-white border flex items-center justify-center">
                      <img
                        src="/notification-icon.png"
                        alt="Mindcrate Icon"
                        className="w-6 h-6"
                        onError={(e) => {
                          e.currentTarget.style.display = "none"
                          e.currentTarget.nextElementSibling!.textContent = "🧠"
                        }}
                      />
                      <span className="hidden">🧠</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{title || "Notification Title"}</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        {body || "Notification message will appear here"}
                      </p>
                      {image && (
                        <div className="mt-2 w-full h-24 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-500">
                          Image: {image}
                        </div>
                      )}
                      {url && (
                        <div className="mt-2">
                          <Badge variant="outline" className="text-xs">
                            Action: {url}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="templates">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Notification Templates
              </CardTitle>
              <CardDescription>Saved templates for quick notifications</CardDescription>
            </CardHeader>
            <CardContent>
              {templates.length === 0 ? (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    No templates saved yet. Create a notification and save it as a template.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="grid gap-4">
                  {templates.map((template) => (
                    <TemplateItem key={template.id} template={template} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scheduled">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Scheduled Notifications
              </CardTitle>
              <CardDescription>Notifications scheduled for future delivery</CardDescription>
            </CardHeader>
            <CardContent>
              {scheduled.length === 0 ? (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>No scheduled notifications. Schedule one from the compose tab.</AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-4">
                  {scheduled.map((item) => (
                    <div key={item.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium">{item.title}</h4>
                          <p className="text-sm text-muted-foreground">{item.body}</p>
                          <div className="flex items-center gap-4 mt-2">
                            <Badge variant={item.status === "pending" ? "default" : "secondary"}>{item.status}</Badge>
                            <span className="text-xs text-muted-foreground">
                              <Calendar className="h-3 w-3 inline mr-1" />
                              {new Date(item.scheduled_for).toLocaleString()}
                            </span>
                          </div>
                        </div>
                        <Button size="sm" variant="outline">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Broadcast History
              </CardTitle>
              <CardDescription>History of sent notifications</CardDescription>
            </CardHeader>
            <CardContent>
              {logs.length === 0 ? (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>No broadcasts sent yet. Send your first notification!</AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-4">
                  {logs.map((log) => (
                    <div key={log.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium">{log.title}</h4>
                          <p className="text-sm text-muted-foreground">{log.body}</p>
                          <div className="flex items-center gap-4 mt-2">
                            <div className="flex items-center gap-1">
                              <CheckCircle className="h-4 w-4 text-green-600" />
                              <span className="text-sm">{log.sent_count} sent</span>
                            </div>
                            {log.failed_count > 0 && (
                              <div className="flex items-center gap-1">
                                <XCircle className="h-4 w-4 text-red-600" />
                                <span className="text-sm">{log.failed_count} failed</span>
                              </div>
                            )}
                            <span className="text-xs text-muted-foreground">
                              {new Date(log.created_at).toLocaleString()}
                            </span>
                          </div>
                        </div>
                        <Badge variant="outline">{log.total_count} total</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  System Statistics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{templates.length}</div>
                    <div className="text-sm text-muted-foreground">Templates</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{scheduled.length}</div>
                    <div className="text-sm text-muted-foreground">Scheduled</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{logs.length}</div>
                    <div className="text-sm text-muted-foreground">Sent</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {logs.reduce((sum, log) => sum + log.sent_count, 0)}
                    </div>
                    <div className="text-sm text-muted-foreground">Total Delivered</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Notification Icon</CardTitle>
                <CardDescription>Now using the new Mindcrate brain + cube icon</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <img
                    src="/notification-icon.png"
                    alt="Mindcrate Notification Icon"
                    className="w-16 h-16 border rounded-lg p-2 bg-white"
                  />
                  <div>
                    <h4 className="font-medium">Brain + Cube Design</h4>
                    <p className="text-sm text-muted-foreground">
                      Perfect representation of learning and knowledge platform
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
