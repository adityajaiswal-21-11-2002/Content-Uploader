"use client"

import { useEffect, useState } from "react"
import type { Employee } from "@/lib/types"
import DailyComplianceTable from "@/components/admin/daily-compliance-table"
import WeeklyComplianceTable from "@/components/admin/weekly-compliance-table"
import MonthlyLeaderboard from "@/components/monthly-leaderboard"
import AnalyticsDashboard from "@/components/analytics/analytics-dashboard"
import UploadedVideosTable from "@/components/admin/uploaded-videos-table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import { LoadingLottie } from "@/components/ui/loading-lottie"

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

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage compliance and topics for all employees</p>
          </div>
          <Link
            href="/"
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition"
          >
            Back to Main
          </Link>
        </div>

        {employees.length === 0 && !loading && (
          <div className="mb-6 p-4 bg-yellow-100 border border-yellow-400 text-yellow-800 rounded-lg">
            <p className="font-semibold">Database Not Configured</p>
            <p className="text-sm mt-1">
              Please set up your DATABASE_URL environment variable in the Vercel dashboard to use this application.
            </p>
          </div>
        )}

        <Tabs defaultValue="daily" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="daily">Daily Compliance</TabsTrigger>
            <TabsTrigger value="weekly">Weekly Compliance</TabsTrigger>
            <TabsTrigger value="monthly">Monthly Awards</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="videos">Uploaded Videos</TabsTrigger>
          </TabsList>

          <TabsContent value="daily">
            <Card>
              <CardHeader>
                <CardTitle>Daily Compliance Status</CardTitle>
                <CardDescription>Today's upload status for all employees</CardDescription>
              </CardHeader>
              <CardContent>
                <DailyComplianceTable complianceData={complianceData} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="weekly">
            <Card>
              <CardHeader>
                <CardTitle>Weekly Compliance Status</CardTitle>
                <CardDescription>This week's upload counts vs quotas</CardDescription>
              </CardHeader>
              <CardContent>
                <WeeklyComplianceTable employees={employees} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="monthly">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Awards & Leaderboard</CardTitle>
                <CardDescription>Top performers and monthly statistics</CardDescription>
              </CardHeader>
              <CardContent>
                <MonthlyLeaderboard />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <Card>
              <CardHeader>
                <CardTitle>Analytics Dashboard</CardTitle>
                <CardDescription>Charts and graphs for upload analytics</CardDescription>
              </CardHeader>
              <CardContent>
                <AnalyticsDashboard />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="videos">
            <Card>
              <CardHeader>
                <CardTitle>Uploaded Videos</CardTitle>
                <CardDescription>View all uploaded videos with links for each employee</CardDescription>
              </CardHeader>
              <CardContent>
                <UploadedVideosTable />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
