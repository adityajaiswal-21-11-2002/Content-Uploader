"use client"

import { useEffect, useState } from "react"
import type { Employee } from "@/lib/types"
import EmployeeCard from "@/components/employee-card"
import MonthlyLeaderboard from "@/components/monthly-leaderboard"
import AnalyticsDashboard from "@/components/analytics/analytics-dashboard"
import { ResponsiveNavLayout } from "@/components/responsive-nav-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, CheckCircle2, Clock, Users, Trophy, BarChart3 } from "lucide-react"
import { formatDateISO } from "@/lib/helpers"
import { LoadingLottie } from "@/components/ui/loading-lottie"
import { SkeletonStatsGrid, SkeletonEmployeeCard } from "@/components/ui/skeleton-loading"
import Link from "next/link"
import { Button } from "@/components/ui/button"

interface ComplianceSummary {
  employee_id: number
  today_compliant: boolean
  weekly_compliant: boolean
  total_uploads_this_month: number
}

export default function HomePage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [complianceSummary, setComplianceSummary] = useState<ComplianceSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [empResponse, complianceResponse, monthlyResponse] = await Promise.all([
          fetch("/api/employees"),
          fetch("/api/compliance"),
          fetch("/api/monthly-stats"),
        ])

        if (empResponse.ok) {
          const empData = await empResponse.json()
          if (Array.isArray(empData)) {
            setEmployees(empData)
          } else if (empData.error) {
            setError(empData.error)
          }
        }

        if (complianceResponse.ok) {
          const complianceData = await complianceResponse.json()
          if (Array.isArray(complianceData)) {
            const summary = complianceData.map((data: any) => ({
              employee_id: data.employee.id,
              today_compliant: data.dailyCompliant || false,
              weekly_compliant: data.weeklyCompliant || false,
            }))
            setComplianceSummary(summary)
          }
        }

        if (monthlyResponse.ok) {
          const monthlyData = await monthlyResponse.json()
          if (monthlyData.stats) {
            // Merge monthly stats into compliance summary
            setComplianceSummary((prev) =>
              prev.map((item) => {
                const monthlyStat = monthlyData.stats.find(
                  (s: any) => s.employee_id === item.employee_id,
                )
                return {
                  ...item,
                  total_uploads_this_month: monthlyStat?.total_uploads || 0,
                }
              }),
            )
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error)
        setError("Failed to load data")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
    const interval = setInterval(fetchData, 60000) // Refresh every minute
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <ResponsiveNavLayout
        navItems={[
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
        ]}
        title="Content Upload Tracker"
        subtitle="Track daily and weekly uploads"
      >
        <div className="space-y-6 animate-fade-in">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <h1 className="fluid-text-2xl font-bold">Content Upload Tracker</h1>
              <p className="fluid-text-sm text-muted-foreground">
                Track daily and weekly uploads • 1 Instagram/day • 3 YouTube/week
              </p>
            </div>
            <Button asChild>
              <Link href="/admin">Admin Dashboard</Link>
            </Button>
          </div>

          <Card className="modern-card-gradient animate-slide-up">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Today's Status ({formatDateISO(new Date())})
              </CardTitle>
              <CardDescription>Daily compliance overview</CardDescription>
            </CardHeader>
            <CardContent>
              <SkeletonStatsGrid />
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonEmployeeCard key={i} className="animate-fade-in" style={{ animationDelay: `${i * 0.1}s` }} />
            ))}
          </div>
        </div>
      </ResponsiveNavLayout>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-destructive mb-4">{error}</p>
          <p className="text-muted-foreground text-sm">Please check your database configuration.</p>
        </div>
      </div>
    )
  }

  if (employees.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-foreground">No employees found.</p>
        </div>
      </div>
    )
  }

  const today = formatDateISO(new Date())
  const nonCompliantToday = complianceSummary.filter((s) => !s.today_compliant).length
  const compliantToday = complianceSummary.filter((s) => s.today_compliant).length

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

  const stats = {
    compliant: compliantToday,
    nonCompliant: nonCompliantToday,
    total: employees.length,
  }

  const headerContent = (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">Content Upload Tracker</h1>
        <p className="text-sm text-muted-foreground">
          Track daily and weekly uploads • 1 Instagram/day • 3 YouTube/week
        </p>
      </div>
      <Button asChild>
        <Link href="/admin">Admin Dashboard</Link>
      </Button>
    </div>
  )

  return (
    <ResponsiveNavLayout
      navItems={navItems}
      headerContent={headerContent}
      stats={stats}
      title="Content Upload Tracker"
      subtitle="Track daily and weekly uploads"
    >
      <div className="space-y-6">
        {/* Today's Compliance Summary */}
        <Card className="modern-card-gradient elevated-card animate-slide-up">
          <CardHeader className="cq-p-fluid-md">
            <CardTitle className="flex items-center gap-3 fluid-text-lg">
              <div className="p-2 rounded-full bg-primary/10">
                <Clock className="w-5 h-5 text-primary" />
              </div>
              <span>Today's Status ({today})</span>
            </CardTitle>
            <CardDescription className="fluid-text-sm">Daily compliance overview</CardDescription>
          </CardHeader>
          <CardContent className="cq-p-fluid-md">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 cq-grid-cols-3">
              <div className="group p-5 rounded-xl bg-gradient-to-br from-green-50 via-green-100/50 to-emerald-50 dark:from-green-950/50 dark:via-green-900/30 dark:to-emerald-950/50 border border-green-200/50 dark:border-green-800/50 hover:shadow-lg transition-all duration-300 hover-lift">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/30 group-hover:scale-110 transition-transform duration-200">
                    <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <span className="fluid-text-sm font-semibold text-green-900 dark:text-green-100">Compliant</span>
                </div>
                <p className="fluid-text-2xl font-bold text-green-700 dark:text-green-300 mb-1">{compliantToday}</p>
                <p className="fluid-text-xs text-green-600 dark:text-green-400">employees uploaded today</p>
              </div>

              <div className="group p-5 rounded-xl bg-gradient-to-br from-red-50 via-red-100/50 to-rose-50 dark:from-red-950/50 dark:via-red-900/30 dark:to-rose-950/50 border border-red-200/50 dark:border-red-800/50 hover:shadow-lg transition-all duration-300 hover-lift">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-full bg-red-100 dark:bg-red-900/30 group-hover:scale-110 transition-transform duration-200">
                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                  </div>
                  <span className="fluid-text-sm font-semibold text-red-900 dark:text-red-100">Not Compliant</span>
                </div>
                <p className="fluid-text-2xl font-bold text-red-700 dark:text-red-300 mb-1">{nonCompliantToday}</p>
                <p className="fluid-text-xs text-red-600 dark:text-red-400">employees missed today</p>
              </div>

              <div className="group p-5 rounded-xl bg-gradient-to-br from-blue-50 via-blue-100/50 to-indigo-50 dark:from-blue-950/50 dark:via-blue-900/30 dark:to-indigo-950/50 border border-blue-200/50 dark:border-blue-800/50 hover:shadow-lg transition-all duration-300 hover-lift">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30 group-hover:scale-110 transition-transform duration-200">
                    <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="fluid-text-sm font-semibold text-blue-900 dark:text-blue-100">Total Employees</span>
                </div>
                <p className="fluid-text-2xl font-bold text-blue-700 dark:text-blue-300 mb-1">{employees.length}</p>
                <p className="fluid-text-xs text-blue-600 dark:text-blue-400">active team members</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Employee Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 container-query">
          {employees.map((employee, index) => {
            const summary = complianceSummary.find((s) => s.employee_id === employee.id)
            return (
              <div
                key={employee.id}
                className="animate-fade-in"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <EmployeeCard
                  employee={employee}
                  complianceSummary={summary}
                />
              </div>
            )
          })}
        </div>
      </div>
    </ResponsiveNavLayout>
  )
}
