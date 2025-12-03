"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { useIsMobile } from "@/hooks/use-mobile"
import { useState, useEffect } from "react"

interface NavItem {
  title: string
  url: string
  icon: React.ComponentType<{ className?: string }>
}

interface MobileBottomNavProps {
  navItems: NavItem[]
}

export function MobileBottomNav({ navItems }: MobileBottomNavProps) {
  const pathname = usePathname()
  const isMobile = useIsMobile()
  const [activeIndex, setActiveIndex] = useState(-1)

  useEffect(() => {
    const currentIndex = navItems.findIndex(item => item.url === pathname)
    setActiveIndex(currentIndex)
  }, [pathname, navItems])

  // Simulate haptic feedback for mobile
  const handleTouchStart = () => {
    if (navigator.vibrate) {
      navigator.vibrate(10) // Light haptic feedback
    }
  }

  if (!isMobile) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-t border-border/50 shadow-2xl safe-area-bottom">
      <nav className="flex items-center justify-around px-1 py-1">
        {navItems.map((item, index) => {
          const isActive = pathname === item.url
          return (
            <Link
              key={item.title}
              href={item.url}
              onTouchStart={handleTouchStart}
              className={cn(
                "flex flex-col items-center justify-center px-3 py-3 rounded-xl min-w-0 flex-1 transition-all duration-200 touch-target-large relative overflow-hidden",
                "active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 focus:ring-offset-background",
                isActive
                  ? "bg-gradient-to-t from-primary/20 to-primary/10 text-primary shadow-lg transform scale-105"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50 active:bg-accent"
              )}
              aria-label={item.title}
              role="tab"
              aria-selected={isActive}
            >
              {/* Active indicator */}
              {isActive && (
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-primary rounded-full animate-fade-in" />
              )}

              {/* Icon with animation */}
              <div className={cn(
                "relative mb-1 transition-transform duration-200",
                isActive && "scale-110"
              )}>
                <item.icon className={cn(
                  "h-5 w-5 transition-colors duration-200",
                  isActive ? "drop-shadow-sm" : ""
                )} />
                {isActive && (
                  <div className="absolute inset-0 bg-primary/20 rounded-full blur-sm animate-pulse" />
                )}
              </div>

              {/* Label */}
              <span className={cn(
                "text-xs font-medium truncate transition-all duration-200",
                isActive ? "text-primary font-semibold" : "text-muted-foreground"
              )}>
                {item.title}
              </span>

              {/* Active dot indicator */}
              {isActive && (
                <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-primary rounded-full animate-bounce-gentle" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Safe area padding for devices with notches */}
      <div className="h-safe-area-bottom bg-background/95 backdrop-blur-md" />
    </div>
  )
}
