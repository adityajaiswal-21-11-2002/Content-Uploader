"use client"

import { useEffect, useState } from "react"
import type { Employee } from "@/lib/types"
import WeeklyComplianceTable from "@/components/admin/weekly-compliance-table"
import { ResponsiveNavLayout } from "@/components/responsive-nav-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LoadingLottie } from "@/components/ui/loading-lottie"
import { FileText, Calendar, Award, BarChart3, Video } from "lucide-react"

export default function WeeklyCompliancePage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const response = await fetch("/api/employees")
        if (response.ok) {
          const empData = await response.json()
          if (Array.isArray(empData)) {
            setEmployees(empData)
          }
        }
      } catch (error) {
        console.error("Error fetching employees:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchEmployees()
  }, [])

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

  if (loading) {
    return (
      <ResponsiveNavLayout navItems={navItems}>
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingLottie message="Loading weekly compliance..." />
        </div>
      </ResponsiveNavLayout>
    )
  }

  return (
    <ResponsiveNavLayout
      navItems={navItems}
      showBackToMain={true}
      title="Weekly Compliance"
      subtitle="This week's upload counts vs quotas"
    >
      <Card>
        <CardHeader>
          <CardTitle>Weekly Compliance Status</CardTitle>
          <CardDescription>This week's upload counts vs quotas</CardDescription>
        </CardHeader>
        <CardContent>
          <WeeklyComplianceTable employees={employees} />
        </CardContent>
      </Card>
    </ResponsiveNavLayout>
  )
}
