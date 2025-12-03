"use client"

import { useEffect, useState } from "react"
import type { Employee } from "@/lib/types"
import EmployeeCard from "@/components/employee-card"
import MonthlyLeaderboard from "@/components/monthly-leaderboard"
import AnalyticsDashboard from "@/components/analytics/analytics-dashboard"
import Link from "next/link"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, CheckCircle2, Clock } from "lucide-react"
import { formatDateISO } from "@/lib/helpers"
import { LoadingLottie } from "@/components/ui/loading-lottie"

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
      <div className="flex items-center justify-center min-h-screen">
        <LoadingLottie message="Loading employees..." />
      </div>
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

  return (
    <div className="min-h-screen bg-background px-4 py-6 sm:p-6">
      <div className="max-w-7xl mx-auto w-full">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex-1 space-y-2">
            <h1 className="text-4xl font-bold text-foreground mb-2">Content Upload Tracker</h1>
            <p className="text-muted-foreground">
              Track daily and weekly uploads • 1 Instagram/day • 3 YouTube/week
            </p>
          </div>
          <Link
            href="/admin"
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition text-center w-full md:w-auto"
          >
            Admin Dashboard
          </Link>
        </div>

        {/* Today's Compliance Summary */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Today's Status ({today})
            </CardTitle>
            <CardDescription>Daily compliance overview</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <span className="font-semibold text-green-900 dark:text-green-100">Compliant</span>
                </div>
                <p className="text-2xl font-bold text-green-700 dark:text-green-300">{compliantToday}</p>
                <p className="text-xs text-green-600 dark:text-green-400">employees uploaded today</p>
              </div>
              <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800">
                <div className="flex items-center gap-2 mb-1">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <span className="font-semibold text-red-900 dark:text-red-100">Not Compliant</span>
                </div>
                <p className="text-2xl font-bold text-red-700 dark:text-red-300">{nonCompliantToday}</p>
                <p className="text-xs text-red-600 dark:text-red-400">employees missed today</p>
              </div>
              <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-blue-900 dark:text-blue-100">Total Employees</span>
                </div>
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{employees.length}</p>
                <p className="text-xs text-blue-600 dark:text-blue-400">active team members</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="employees" className="space-y-6">
          <TabsList className="flex flex-wrap gap-2 sm:grid sm:grid-cols-3">
            <TabsTrigger value="employees">All Employees</TabsTrigger>
            <TabsTrigger value="leaderboard">Monthly Leaderboard</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="employees">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {employees.map((employee) => {
                const summary = complianceSummary.find((s) => s.employee_id === employee.id)
                return (
                  <EmployeeCard
                    key={employee.id}
                    employee={employee}
                    complianceSummary={summary}
                  />
                )
              })}
            </div>
          </TabsContent>

          <TabsContent value="leaderboard">
            <MonthlyLeaderboard />
          </TabsContent>

          <TabsContent value="analytics">
            <AnalyticsDashboard />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
