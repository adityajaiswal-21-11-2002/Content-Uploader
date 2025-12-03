"use client"

import MonthlyLeaderboard from "@/components/monthly-leaderboard"
import { ResponsiveNavLayout } from "@/components/responsive-nav-layout"
import { Users, Trophy, BarChart3 } from "lucide-react"

export default function LeaderboardPage() {
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
      title="Monthly Leaderboard"
      subtitle="Top performers and monthly statistics"
    >
      <MonthlyLeaderboard />
    </ResponsiveNavLayout>
  )
}
