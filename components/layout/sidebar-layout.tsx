"use client"

import type React from "react"
import { useState, memo } from "react"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  Home,
  BookOpen,
  Award,
  ShoppingCart,
  MessageSquare,
  User,
  LogOut,
  Menu,
  X,
  GraduationCap,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import CoinBalance from "@/components/coins/coin-balance"
import { ThemeSwitcher } from "@/components/theme/theme-switcher"
import SignOutButton from "@/components/auth/sign-out-button"
import { useNavigation } from "@/components/providers/navigation-provider"
import { usePageLoaded } from "@/hooks/use-page-loaded"
import { useLayoutMode } from "@/hooks/use-layout-mode"
import NavigationBar from "./navigation-bar"

// Memoized navigation item to prevent unnecessary re-renders
const NavItem = memo(
  ({
    href,
    icon: Icon,
    label,
    isActive,
    onClick,
    showLabel = true,
    isMini = false,
  }: {
    href: string
    icon: React.ElementType
    label: string
    isActive: boolean
    onClick?: () => void
    showLabel?: boolean
    isMini?: boolean
  }) => {
    const { navigateTo, isNavigating } = useNavigation()

    const handleClick = (e: React.MouseEvent) => {
      e.preventDefault()

      if (onClick) {
        onClick()
      }

      // Use navigateTo from context with fallback
      if (!isNavigating && !isActive) {
        try {
          navigateTo(href)
        } catch (error) {
          // Fallback to direct navigation if context fails
          console.warn("Navigation context failed, using fallback", error)
          if (typeof window !== "undefined") {
            window.location.href = href
          }
        }
      }
    }

    return (
      <button
        className={cn(
          "flex items-center gap-3 rounded-md text-sm font-medium transition-colors w-full text-left",
          isActive ? "bg-primary/10 text-primary" : isMini ? "text-foreground hover:bg-muted" : "hover:bg-muted",
          "active:scale-95 transition-transform duration-100",
          isNavigating && "pointer-events-none opacity-50",
          isMini ? "justify-center p-3" : "px-3 py-2",
        )}
        onClick={handleClick}
        title={!showLabel ? label : undefined}
        disabled={isNavigating}
      >
        <Icon
          className={cn(
            isMini ? "h-7 w-7" : "h-5 w-5",
            isActive && "text-primary",
            isNavigating && "animate-spin-slow",
          )}
        />
        {showLabel && <span>{label}</span>}
      </button>
    )
  },
)
NavItem.displayName = "NavItem"

interface SidebarLayoutProps {
  children: React.ReactNode
  user: any
  profile?: any
  currentPath?: string
  extraHeaderContent?: React.ReactNode
}

export default function SidebarLayout({
  children,
  user,
  profile,
  currentPath = "",
  extraHeaderContent,
}: SidebarLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const pathname = usePathname()
  const { isNavigating } = useNavigation()
  const isPageLoaded = usePageLoaded()
  const { layoutMode } = useLayoutMode()

  // Ensure we have valid profile data
  const safeProfile = profile || {
    name: user?.email?.split("@")[0] || "User",
    username: "user",
    avatar_url: null,
  }

  const navigationItems = [
    { label: "Dashboard", href: "/dashboard", icon: Home },
    { label: "Articles", href: "/articles", icon: BookOpen },
    { label: "Courses", href: "/courses", icon: GraduationCap },
    { label: "Quiz", href: "/quiz", icon: Award },
    { label: "Shop", href: "/shop", icon: ShoppingCart },
    { label: "Chat", href: "/chat", icon: MessageSquare },
    { label: "Profile", href: "/profile", icon: User },
  ]

  // Close mobile menu when navigating
  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false)
  }

  // Toggle sidebar
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }

  // Debug log to check layout mode
  console.log("Current layout mode:", layoutMode)

  // If navigation bar mode is selected, use navigation bar layout
  if (layoutMode === "navbar") {
    return (
      <div className="flex flex-col h-screen overflow-hidden">
        <NavigationBar user={user} profile={profile} />
        <main
          className={cn(
            "flex-1 overflow-auto pb-16 lg:pb-0",
            "px-0 lg:px-4",
            (isNavigating || !isPageLoaded) && "blur-sm",
          )}
        >
          <div className="w-full max-w-full overflow-x-hidden">{children}</div>
        </main>
      </div>
    )
  }

  // Sidebar mode - original sidebar layout
  return (
    <div className="flex flex-col h-screen">
      {/* Mobile header */}
      <header className="sticky top-0 z-50 flex h-16 items-center border-b bg-background px-4 lg:hidden">
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="mr-2 bg-transparent" disabled={isNavigating}>
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[280px] p-0">
            <div className="flex h-full flex-col">
              <div className="flex items-center justify-between border-b p-4">
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={safeProfile?.avatar_url || ""} alt={safeProfile?.name || "User"} />
                    <AvatarFallback>{(safeProfile?.name || user?.email || "U").charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{safeProfile?.name || user?.email}</span>
                    <span className="text-xs text-muted-foreground">@{safeProfile?.username || "user"}</span>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={closeMobileMenu}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <div className="flex items-center justify-between border-b p-4">
                <CoinBalance userId={user.id} />
                <ThemeSwitcher />
              </div>
              <nav className="flex-1 overflow-auto p-4">
                <div className="flex flex-col gap-1">
                  {navigationItems.map((item) => (
                    <NavItem
                      key={item.href}
                      href={item.href}
                      icon={item.icon}
                      label={item.label}
                      isActive={pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))}
                      onClick={closeMobileMenu}
                    />
                  ))}
                </div>
              </nav>
              <div className="border-t p-4">
                <SignOutButton className="w-full justify-start gap-2">
                  <LogOut className="h-5 w-5" />
                  Sign out
                </SignOutButton>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        <div className="flex-1">
          <h1 className="text-xl font-semibold">
            {navigationItems.find(
              (item) => item.href === pathname || (item.href !== "/" && pathname.startsWith(item.href)),
            )?.label || "Dashboard"}
          </h1>
        </div>

        <div className="flex items-center gap-4">
          {extraHeaderContent}
          <ThemeSwitcher className="hidden sm:flex" />
          <Avatar className="h-8 w-8">
            <AvatarImage src={safeProfile?.avatar_url || ""} alt={safeProfile?.name || "User"} />
            <AvatarFallback>{(safeProfile?.name || user?.email || "U").charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
        </div>
      </header>

      {/* Desktop layout */}
      <div className="hidden lg:flex flex-col h-full">
        {/* Desktop header */}
        <header className="flex h-16 items-center border-b bg-background px-4 z-50">
          <Button
            variant="outline"
            size="icon"
            className="mr-2 bg-transparent"
            onClick={toggleSidebar}
            disabled={isNavigating}
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle menu</span>
          </Button>

          <div className="flex-1">
            <h1 className="text-xl font-semibold">
              {navigationItems.find(
                (item) => item.href === pathname || (item.href !== "/" && pathname.startsWith(item.href)),
              )?.label || "Dashboard"}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            {extraHeaderContent}
            <ThemeSwitcher />
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={safeProfile?.avatar_url || ""} alt={safeProfile?.name || "User"} />
                <AvatarFallback>{(safeProfile?.name || user?.email || "U").charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="text-sm font-medium">{safeProfile?.name || user?.email}</span>
                <span className="text-xs text-muted-foreground">@{safeProfile?.username || "user"}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Desktop content with sidebar */}
        <div className="flex flex-1 overflow-hidden">
          {/* Full sidebar */}
          <aside
            className={cn(
              "w-64 border-r bg-background transition-all duration-300 ease-in-out flex flex-col",
              isSidebarOpen ? "block" : "hidden",
            )}
          >
            <div className="flex flex-col h-full">
              <div className="flex-1 overflow-y-auto">
                <nav className="p-4">
                  <div className="flex flex-col gap-1">
                    {navigationItems.map((item) => (
                      <NavItem
                        key={item.href}
                        href={item.href}
                        icon={item.icon}
                        label={item.label}
                        isActive={pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))}
                      />
                    ))}
                  </div>
                </nav>
              </div>
              <div className="border-t p-4 mt-auto">
                <SignOutButton className="w-full justify-start gap-2">
                  <LogOut className="h-5 w-5" />
                  Sign out
                </SignOutButton>
              </div>
            </div>
          </aside>

          {/* Mini sidebar */}
          <aside
            className={cn("w-20 border-r bg-background shadow-md flex flex-col", isSidebarOpen ? "hidden" : "block")}
          >
            <div className="flex flex-col h-full">
              <div className="flex-1 overflow-y-auto">
                <nav className="p-2 pt-4">
                  <div className="flex flex-col gap-2">
                    {navigationItems.map((item) => (
                      <NavItem
                        key={item.href}
                        href={item.href}
                        icon={item.icon}
                        label={item.label}
                        isActive={pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))}
                        showLabel={false}
                        isMini={true}
                      />
                    ))}
                  </div>
                </nav>
              </div>
              <div className="border-t p-2 mt-auto">
                <Button variant="ghost" size="icon" className="w-full h-12 text-foreground" asChild>
                  <SignOutButton>
                    <LogOut className="h-7 w-7" />
                  </SignOutButton>
                </Button>
              </div>
            </div>
          </aside>

          {/* Toggle button for desktop sidebar */}
          <button
            className={cn(
              "absolute z-50 rounded-full bg-primary p-1.5 text-primary-foreground shadow-md transition-all duration-300",
              isSidebarOpen ? "left-[248px] top-20" : "left-[64px] top-20",
            )}
            onClick={toggleSidebar}
          >
            {isSidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>

          {/* Main content */}
          <main className={cn("flex-1 overflow-auto", (isNavigating || !isPageLoaded) && "blur-sm")}>{children}</main>
        </div>
      </div>

      {/* Mobile content */}
      <main
        className={cn("flex-1 overflow-auto lg:hidden", "pb-16 px-0", (isNavigating || !isPageLoaded) && "blur-sm")}
      >
        <div className="w-full max-w-full overflow-x-hidden">{children}</div>
      </main>
    </div>
  )
}
