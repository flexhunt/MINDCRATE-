"use client"
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
  GraduationCap,
  ChevronDown,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import CoinBalance from "@/components/coins/coin-balance"
import { ThemeSwitcher } from "@/components/theme/theme-switcher"
import SignOutButton from "@/components/auth/sign-out-button"
import { useNavigation } from "@/components/providers/navigation-provider"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import InstagramBottomNav from "./instagram-bottom-nav"
import { ViewToggle } from "./view-toggle"

interface NavigationBarProps {
  user: any
  profile?: any
}

export default function NavigationBar({ user, profile }: NavigationBarProps) {
  const pathname = usePathname()
  const { navigateTo, isNavigating } = useNavigation()

  // Ensure we have valid profile data
  const safeProfile = profile || {
    name: user?.email?.split("@")[0] || "User",
    username: "user",
    avatar_url: null,
  }

  const navigationItems = [
    { label: "Dashboard", href: "/dashboard", icon: Home },
    { label: "Articles", href: "/articles", icon: BookOpen, highlight: true },
    { label: "Courses", href: "/courses", icon: GraduationCap },
    { label: "Quiz", href: "/quiz", icon: Award },
    { label: "Chat", href: "/chat", icon: MessageSquare },
    { label: "Shop", href: "/shop", icon: ShoppingCart },
  ]

  const moreItems = [{ label: "Profile", href: "/profile", icon: User }]

  const handleNavigation = (href: string) => {
    if (!isNavigating && pathname !== href) {
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
    <>
      <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center">
          {/* Logo */}
          <div className="mr-6 flex items-center space-x-2">
            <img src="/logo.png" alt="Mindcrate" className="h-8 w-8" />
            <span className="hidden font-bold sm:inline-block">Mindcrate</span>
          </div>

          {/* Main Navigation - Hidden on mobile */}
          <div className="hidden md:flex md:flex-1 md:items-center md:space-x-1">
            {navigationItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))
              return (
                <Button
                  key={item.href}
                  variant={isActive ? "secondary" : "ghost"}
                  size="sm"
                  className={cn(
                    "h-9 px-3",
                    isActive && "bg-muted font-medium",
                    item.highlight && !isActive && "text-primary font-medium",
                    isNavigating && "pointer-events-none opacity-50",
                  )}
                  onClick={() => handleNavigation(item.href)}
                >
                  <item.icon className={cn("mr-2 h-4 w-4", item.highlight && !isActive && "text-primary")} />
                  {item.label}
                </Button>
              )
            })}

            {/* More dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-9 px-3">
                  More
                  <ChevronDown className="ml-1 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                {moreItems.map((item) => (
                  <DropdownMenuItem key={item.href} onClick={() => handleNavigation(item.href)}>
                    <item.icon className="mr-2 h-4 w-4" />
                    {item.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Mobile Navigation - Dropdown */}
          <div className="flex md:hidden flex-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-9 px-3">
                  Menu
                  <ChevronDown className="ml-1 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                {navigationItems.map((item) => (
                  <DropdownMenuItem
                    key={item.href}
                    onClick={() => handleNavigation(item.href)}
                    className={item.highlight ? "text-primary font-medium" : ""}
                  >
                    <item.icon className={cn("mr-2 h-4 w-4", item.highlight && "text-primary")} />
                    {item.label}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                {moreItems.map((item) => (
                  <DropdownMenuItem key={item.href} onClick={() => handleNavigation(item.href)}>
                    <item.icon className="mr-2 h-4 w-4" />
                    {item.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            {/* Coin Balance */}
            <CoinBalance userId={user.id} />

            {/* View Toggle */}
            <ViewToggle />

            {/* Theme Switcher */}
            <ThemeSwitcher />

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={safeProfile?.avatar_url || ""} alt={safeProfile?.name || "User"} />
                    <AvatarFallback>{(safeProfile?.name || user?.email || "U").charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    <p className="font-medium">{safeProfile?.name || user?.email}</p>
                    <p className="w-[200px] truncate text-sm text-muted-foreground">
                      @{safeProfile?.username || "user"}
                    </p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleNavigation("/profile")}>
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <SignOutButton className="w-full justify-start">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </SignOutButton>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </nav>

      {/* Instagram-style bottom navigation for mobile */}
      <InstagramBottomNav />
    </>
  )
}
