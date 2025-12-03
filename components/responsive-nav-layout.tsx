"use client"

import React, { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MobileBottomNav } from "@/components/mobile-bottom-nav"
import {
  Users,
  Trophy,
  BarChart3,
  Settings,
  Home,
  FileText,
  Video,
  Calendar,
  Award,
  CheckCircle2,
  AlertCircle,
  Clock
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
    <>
    <SidebarProvider>
      <div className="mobile-bottom-nav-spacing sidebar-layout">
        {/* Desktop Sidebar */}
        <div className="sidebar-desktop">
              <SidebarHeader className="p-4">
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton size="lg" asChild>
                      <Link href="/">
                        <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                          <BarChart3 className="size-4" />
                        </div>
                        <div className="grid flex-1 text-left text-sm leading-tight">
                          <span className="truncate font-semibold">{title}</span>
                          <span className="truncate text-xs text-sidebar-foreground/70">{subtitle}</span>
                        </div>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarHeader>

              <SidebarContent className="flex-1 px-2">
                <SidebarGroup>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {navItems.map((item) => (
                        <SidebarMenuItem key={item.title}>
                          <SidebarMenuButton
                            asChild
                            isActive={pathname === item.url}
                          >
                            <Link href={item.url} className="w-full">
                              <item.icon className="size-4" />
                              <span>{item.title}</span>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>

                {stats && (
                  <SidebarGroup>
                    <SidebarGroupContent>
                      <div className="px-2 py-1">
                        <div className="text-xs font-medium text-sidebar-foreground/70 mb-2">
                          Today's Status
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="size-3 text-green-500" />
                              <span className="text-xs">Compliant</span>
                            </div>
                            <Badge variant="secondary" className="text-xs">
                              {stats.compliant}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <AlertCircle className="size-3 text-red-500" />
                              <span className="text-xs">Not Compliant</span>
                            </div>
                            <Badge variant="secondary" className="text-xs">
                              {stats.nonCompliant}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Users className="size-3 text-blue-500" />
                              <span className="text-xs">Total</span>
                            </div>
                            <Badge variant="secondary" className="text-xs">
                              {stats.total}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </SidebarGroupContent>
                  </SidebarGroup>
                )}
              </SidebarContent>

              <SidebarFooter className="p-4">
                {showBackToMain && (
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild>
                        <Link href="/">
                          <Home className="size-4" />
                          <span>Back to Main</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </SidebarMenu>
                )}
                {footerContent}
              </SidebarFooter>
            </div>
          </div>

          {/* Main Content */}
          <div className="main-content">
            <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4 md:px-6">
              <div className="flex items-center gap-2">
                {activeItem.icon && <activeItem.icon className="size-4" />}
                <span className="font-semibold fluid-text-base">{activeItem.title}</span>
              </div>
            </header>

            <main className="flex-1 p-4 md:p-6">
              {headerContent}
              <div className="space-y-6">
                {children}
              </div>
            </main>
          </div>
      </div>
    </SidebarProvider>

    <MobileBottomNav navItems={navItems} />
    </>
  )
}
