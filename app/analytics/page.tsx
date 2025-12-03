"use client"

import AnalyticsDashboard from "@/components/analytics/analytics-dashboard"
import { ResponsiveNavLayout } from "@/components/responsive-nav-layout"
import { Users, Trophy, BarChart3 } from "lucide-react"

export default function AnalyticsPage() {
  const navItems = [
    {
      title: "All Employees",
      url: "/",
      icon: Users,
    },
    {
      title: "Monthly Leaderboard",
      url: "/leaderboard",
      icon: Trophy,
    },
    {
      title: "Analytics",
      url: "/analytics",
      icon: BarChart3,
    },
  ]

  return (
    <ResponsiveNavLayout
      navItems={navItems}
      title="Analytics Dashboard"
      subtitle="Charts and graphs for upload analytics"
    >
      <AnalyticsDashboard />
    </ResponsiveNavLayout>
  )
}
