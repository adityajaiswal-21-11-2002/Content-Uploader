"use client"

import React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { MobileBottomNav } from "@/components/mobile-bottom-nav"
import {
  Users,
  Trophy,
  BarChart3,
  Home,
  FileText,
  Video,
  Calendar,
  Award
} from "lucide-react"

interface NavItem {
  title: string
  url: string
  icon: React.ComponentType<{ className?: string }>
  isActive?: boolean
}

interface ResponsiveNavLayoutProps {
  children: React.ReactNode
  navItems: NavItem[]
  headerContent?: React.ReactNode
  footerContent?: React.ReactNode
  stats?: {
    compliant: number
    nonCompliant: number
    total: number
  }
  showBackToMain?: boolean
  title?: string
  subtitle?: string
}

export function ResponsiveNavLayout({
  children,
  navItems,
  headerContent,
  footerContent,
  stats,
  showBackToMain = false,
  title = "Content Upload Tracker",
  subtitle = "Track daily and weekly uploads for Instagram and YouTube"
}: ResponsiveNavLayoutProps) {
  const pathname = usePathname()
  const activeItem = navItems.find(item => item.url === pathname) || navItems[0]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background px-4 py-3 md:px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold">{title}</h1>
            <span className="text-sm text-muted-foreground hidden sm:inline">{subtitle}</span>
          </div>
          {headerContent}
        </div>
      </header>

      {/* Navigation - Desktop */}
      <nav className="hidden md:flex border-b bg-background px-4 py-2 md:px-6">
        <div className="flex gap-6">
          {navItems.map((item) => (
            <Link
              key={item.title}
              href={item.url}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                pathname === item.url
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
            >
              <item.icon className="size-4" />
              {item.title}
            </Link>
          ))}
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-6">
        {children}
      </main>

      {/* Mobile Navigation */}
      <MobileBottomNav navItems={navItems} />
    </div>
  )
}