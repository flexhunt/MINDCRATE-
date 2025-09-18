const CACHE_NAME = "mindcrate-v2.2.0" // Updated version
const STATIC_CACHE = "mindcrate-static-v2.2.0" // Updated version
const DYNAMIC_CACHE = "mindcrate-dynamic-v2.2.0" // Updated version
const IMAGE_CACHE = "mindcrate-images-v2.2.0" // Updated version

// Files to cache immediately
const STATIC_FILES = [
  "/",
  "/dashboard",
  "/courses",
  "/chat",
  "/challenges",
  "/quiz",
  "/offline.html",
  "/logo.png",
  "/notification-icon.png",
  "/manifest.json",
]

// API routes to cache
const API_CACHE_PATTERNS = [/^\/api\/dashboard\/stats/, /^\/api\/courses/, /^\/api\/quiz/, /^\/api\/challenges/]

console.log("🔧 Enhanced Service Worker Loading... v2.2.0")

// Install event - cache static files
self.addEventListener("install", (event) => {
  console.log("📦 Service Worker Installing... v2.2.0")

  event.waitUntil(
    Promise.all([
      // Cache static files
      caches
        .open(STATIC_CACHE)
        .then((cache) => {
          console.log("💾 Caching static files...")
          return cache.addAll(STATIC_FILES.map((url) => new Request(url, { cache: "reload" })))
        }),
      // Skip waiting to activate immediately for updates
      self.skipWaiting(),
    ]),
  )
})

// Activate event - clean old caches and take control immediately
self.addEventListener("activate", (event) => {
  console.log("✅ Service Worker Activated v2.2.0")

  event.waitUntil(
    Promise.all([
      // Clean old caches
      caches
        .keys()
        .then((cacheNames) => {
          return Promise.all(
            cacheNames.map((cacheName) => {
              if (
                cacheName !== CACHE_NAME &&
                cacheName !== STATIC_CACHE &&
                cacheName !== DYNAMIC_CACHE &&
                cacheName !== IMAGE_CACHE
              ) {
                console.log("🗑️ Deleting old cache:", cacheName)
                return caches.delete(cacheName)
              }
            }),
          )
        }),
      // Take control immediately - this forces refresh of all tabs
      self.clients.claim(),
      // Notify all clients about the update
      self.clients
        .matchAll()
        .then((clients) => {
          clients.forEach((client) => {
            client.postMessage({
              type: "SW_UPDATED",
              version: "2.2.0",
              message: "App updated! Please refresh to see changes.",
            })
          })
        }),
    ]),
  )
})

// Fetch event - handle requests with less aggressive caching for development
self.addEventListener("fetch", (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== "GET") return

  // Skip chrome-extension and other non-http requests
  if (!url.protocol.startsWith("http")) return

  event.respondWith(handleFetch(request))
})

async function handleFetch(request) {
  const url = new URL(request.url)

  try {
    // Handle different types of requests with less aggressive caching
    if (url.pathname.startsWith("/api/")) {
      return handleApiRequest(request)
    } else if (url.pathname.match(/\.(png|jpg|jpeg|gif|webp|svg|ico)$/)) {
      return handleImageRequest(request)
    } else if (url.pathname.startsWith("/_next/") || url.pathname.includes(".js") || url.pathname.includes(".css")) {
      return handleAssetRequest(request)
    } else {
      return handlePageRequest(request)
    }
  } catch (error) {
    console.error("❌ Fetch error:", error)
    return handleOfflineRequest(request)
  }
}

// Handle API requests - Always try network first, minimal caching
async function handleApiRequest(request) {
  try {
    // Always try network first for API requests
    const response = await fetch(request)
    return response
  } catch (error) {
    // Only use cache as last resort for specific APIs
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      console.log("📱 Serving API from cache (offline):", request.url)
      return cachedResponse
    }
    throw error
  }
}

// Handle static assets - Network first with cache fallback
async function handleAssetRequest(request) {
  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(STATIC_CACHE)
      cache.put(request, response.clone())
    }
    return response
  } catch (error) {
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }
    throw error
  }
}

// Handle page requests - Network first, cache fallback
async function handlePageRequest(request) {
  try {
    // Always try network first for pages
    const response = await fetch(request)
    if (response.ok) {
      // Only cache successful responses
      const cache = await caches.open(DYNAMIC_CACHE)
      cache.put(request, response.clone())
    }
    return response
  } catch (error) {
    // Use cache only when offline
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      console.log("📱 Serving page from cache (offline):", request.url)
      return cachedResponse
    }
    throw error
  }
}

// Handle image requests - Cache first for performance
async function handleImageRequest(request) {
  const cachedResponse = await caches.match(request)
  if (cachedResponse) {
    return cachedResponse
  }

  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(IMAGE_CACHE)
      cache.put(request, response.clone())
    }
    return response
  } catch (error) {
    return new Response("", { status: 404 })
  }
}

// Handle offline requests
async function handleOfflineRequest(request) {
  const cachedResponse = await caches.match(request)
  if (cachedResponse) {
    return cachedResponse
  }

  // For navigation requests, return offline page
  if (request.mode === "navigate") {
    const offlinePage = await caches.match("/offline.html")
    if (offlinePage) {
      return offlinePage
    }
  }

  return new Response("Offline - Please check your connection", {
    status: 503,
    statusText: "Service Unavailable",
    headers: { "Content-Type": "text/plain" },
  })
}

// Handle push notifications
self.addEventListener("push", (event) => {
  console.log("📨 Push received:", event)

  if (!event.data) {
    console.log("❌ No push data")
    return
  }

  try {
    const data = event.data.json()
    console.log("📋 Push data:", data)

    const siteUrl = "https://mindcrate.vercel.app"

    const options = {
      body: data.body,
      icon: data.icon || `${siteUrl}/notification-icon.png`,
      badge: data.badge || `${siteUrl}/notification-icon.png`,
      image: data.image,
      data: data.data || {},
      actions: data.actions || [
        { action: "open", title: "Open App", icon: `${siteUrl}/logo.png` },
        { action: "dismiss", title: "Dismiss", icon: `${siteUrl}/logo.png` },
      ],
      requireInteraction: true,
      silent: false,
      tag: data.tag || "mindcrate-notification",
      renotify: true,
      vibrate: [200, 100, 200, 100, 200],
      timestamp: Date.now(),
      urgency: "high",
      priority: "high",
    }

    const notificationPromise = self.registration.showNotification(data.title, options)

    const clientsPromise = self.clients.matchAll({ includeUncontrolled: true }).then((clients) => {
      clients.forEach((client) => {
        try {
          client.postMessage({
            type: "PUSH_RECEIVED",
            data: data,
            timestamp: Date.now(),
          })
        } catch (error) {
          console.log("⚠️ Could not message client:", error)
        }
      })
    })

    event.waitUntil(Promise.all([notificationPromise, clientsPromise]))
  } catch (error) {
    console.error("❌ Push event error:", error)
  }
})

// Enhanced notification click handling
self.addEventListener("notificationclick", (event) => {
  console.log("🖱️ Notification clicked:", event)
  event.notification.close()

  if (event.action === "dismiss") {
    return
  }

  const urlToOpen = event.notification.data?.url || "/"
  const fullUrl = urlToOpen.startsWith("http") ? urlToOpen : `https://mindcrate.vercel.app${urlToOpen}`

  const openPromise = self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
    for (const client of clientList) {
      if (client.url.includes("mindcrate") && "focus" in client) {
        return client.focus().then(() => {
          if (event.notification.data?.url) {
            client.postMessage({
              type: "NAVIGATE_TO",
              url: event.notification.data.url,
            })
          }
        })
      }
    }

    if (self.clients.openWindow) {
      return self.clients.openWindow(fullUrl)
    }
  })

  event.waitUntil(openPromise)
})

// Handle app updates and messages
self.addEventListener("message", (event) => {
  console.log("💬 Message received:", event.data)

  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting()
  }

  if (event.data && event.data.type === "GET_VERSION") {
    event.ports[0].postMessage({ version: "2.2.0" })
  }

  // Force update - clear all caches and reload
  if (event.data && event.data.type === "FORCE_UPDATE") {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            console.log("🗑️ Force deleting cache:", cacheName)
            return caches.delete(cacheName)
          }),
        ).then(() => {
          // Notify client that caches are cleared
          event.ports[0]?.postMessage({ success: true })
        })
      }),
    )
  }
})

console.log("🚀 Enhanced Service Worker Loaded - Version 2.2.0 (Development Friendly)")
