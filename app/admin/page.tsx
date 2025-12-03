"use client"

import { useEffect, useState } from "react"
import type { Employee } from "@/lib/types"
import DailyComplianceTable from "@/components/admin/daily-compliance-table"
import WeeklyComplianceTable from "@/components/admin/weekly-compliance-table"
import MonthlyLeaderboard from "@/components/monthly-leaderboard"
import AnalyticsDashboard from "@/components/analytics/analytics-dashboard"
import UploadedVideosTable from "@/components/admin/uploaded-videos-table"
import { ResponsiveNavLayout } from "@/components/responsive-nav-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LoadingLottie } from "@/components/ui/loading-lottie"
import { FileText, Calendar, Award, BarChart3, Video, Home } from "lucide-react"

export default function AdminDashboardPage() {
  const [complianceData, setComplianceData] = useState<any[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [empResponse, complianceResponse] = await Promise.all([fetch("/api/employees"), fetch("/api/compliance")])

        if (!empResponse.ok || !complianceResponse.ok) {
          console.error("API Error: Failed to fetch data")
          setEmployees([])
          setComplianceData([])
          setLoading(false)
          return
        }

        const empData = await empResponse.json()
        const complData = await complianceResponse.json()

        setEmployees(Array.isArray(empData) ? empData : [])
        setComplianceData(Array.isArray(complData) ? complData : [])
      } catch (error) {
        console.error("Error fetching data:", error)
        setEmployees([])
        setComplianceData([])
      } finally {
        setLoading(false)
      }
    }

    fetchData()
    const interval = setInterval(fetchData, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingLottie message="Loading admin dashboard..." />
      </div>
    )
  }

  const navItems = [
    {
      title: "Daily Compliance",
      url: "/admin",
      icon: FileText,
    },
    {
      title: "Weekly Compliance",
      url: "/admin/weekly",
      icon: Calendar,
    },
    {
      title: "Monthly Awards",
      url: "/admin/monthly",
      icon: Award,
    },
    {
      title: "Analytics",
      url: "/admin/analytics",
      icon: BarChart3,
    },
    {
      title: "Uploaded Videos",
      url: "/admin/videos",
      icon: Video,
    },
  ]

  const headerContent = employees.length === 0 && !loading ? (
    <div className="mb-6 p-4 bg-yellow-100 border border-yellow-400 text-yellow-800 rounded-lg dark:bg-yellow-900 dark:border-yellow-600 dark:text-yellow-200">
      <p className="font-semibold">Database Not Configured</p>
      <p className="text-sm mt-1">
        Please set up your DATABASE_URL environment variable in the Vercel dashboard to use this application.
      </p>
    </div>
  ) : null

  return (
    <ResponsiveNavLayout
      navItems={navItems}
      headerContent={headerContent}
      showBackToMain={true}
      title="Admin Dashboard"
      subtitle="Manage compliance and topics"
    >
      <Card>
        <CardHeader>
          <CardTitle>Daily Compliance Status</CardTitle>
          <CardDescription>Today's upload status for all employees</CardDescription>
        </CardHeader>
        <CardContent>
          <DailyComplianceTable complianceData={complianceData} />
        </CardContent>
      </Card>
    </ResponsiveNavLayout>
  )
}
