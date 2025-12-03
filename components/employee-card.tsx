"use client"

import type { Employee, DailyUpload, WeeklyStat } from "@/lib/types"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatDateISO, getRequiredQuota } from "@/lib/helpers"
import { CheckCircle2, Circle, AlertCircle, Youtube, Instagram, TrendingUp } from "lucide-react"

interface EmployeeCardProps {
  employee: Employee
  complianceSummary?: {
    employee_id: number
    today_compliant: boolean
    weekly_compliant: boolean
    total_uploads_this_month?: number
  }
}

export default function EmployeeCard({ employee, complianceSummary }: EmployeeCardProps) {
  const [dailyUpload, setDailyUpload] = useState<DailyUpload | null>(null)
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStat | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const today = formatDateISO(new Date())
        const dailyResponse = await fetch(`/api/daily-uploads?employeeId=${employee.id}&date=${today}`)
        const dailyData = await dailyResponse.json()
        setDailyUpload(dailyData)

        const weeklyResponse = await fetch(`/api/weekly-stats?employeeId=${employee.id}`)
        const weeklyData = await weeklyResponse.json()
        setWeeklyStats(weeklyData)
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
    const interval = setInterval(fetchData, 60000) // Refresh every minute
    return () => clearInterval(interval)
  }, [employee.id])

  const quota = getRequiredQuota(employee.role, employee)
  const isYoutubeRequired = quota.youtube > 0
  const isInstaRequired = quota.insta > 0

  const todayYoutubeDone = dailyUpload?.youtube_done || false
  const todayInstaDone = dailyUpload?.insta_done || false
  const weeklyYoutubeCount = weeklyStats?.youtube_count || 0
  const weeklyInstaCount = weeklyStats?.insta_count || 0

  const todayCompliant = complianceSummary?.today_compliant ?? (todayInstaDone) // Instagram is mandatory daily
  const weeklyCompliant = complianceSummary?.weekly_compliant ?? false
  const totalMonthlyUploads = complianceSummary?.total_uploads_this_month ?? 0

  return (
    <Link href={`/employee/${employee.id}`}>
      <Card
        className={`hover:shadow-lg transition-shadow cursor-pointer ${
          !todayCompliant ? "border-red-300 dark:border-red-700" : "border-border"
        }`}
      >
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg">{employee.name}</CardTitle>
              <CardDescription>
                {employee.role === "coder" ? "Coder" : "Peeper"} • {employee.email}
              </CardDescription>
            </div>
            {todayCompliant ? (
              <Badge className="bg-green-500 text-white">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Today OK
              </Badge>
            ) : (
              <Badge variant="destructive">
                <AlertCircle className="w-3 h-3 mr-1" />
                Missed
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : (
            <>
              <div className="space-y-2">
                <p className="text-sm font-semibold">Today's Status</p>
                <div className="space-y-2">
                  {isInstaRequired && (
                    <div className="flex items-center justify-between p-2 rounded bg-accent/50">
                      <div className="flex items-center gap-2">
                        <Instagram className="w-4 h-4 text-pink-500" />
                        <span className="text-sm">Instagram</span>
                      </div>
                      {todayInstaDone ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      ) : (
                        <Circle className="w-4 h-4 text-red-500" />
                      )}
                    </div>
                  )}
                  {isYoutubeRequired && (
                    <div className="flex items-center justify-between p-2 rounded bg-accent/50">
                      <div className="flex items-center gap-2">
                        <Youtube className="w-4 h-4 text-red-500" />
                        <span className="text-sm">YouTube</span>
                      </div>
                      {todayYoutubeDone ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      ) : (
                        <Circle className="w-4 h-4 text-gray-300" />
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2 border-t pt-4">
                <p className="text-sm font-semibold">This Week</p>
                <div className="space-y-1 text-xs">
                  {isYoutubeRequired && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">YouTube:</span>
                      <span className={`font-semibold ${weeklyYoutubeCount >= quota.youtube ? "text-green-600" : "text-orange-600"}`}>
                        {weeklyYoutubeCount}/{quota.youtube}
                      </span>
                    </div>
                  )}
                  {isInstaRequired && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Instagram:</span>
                      <span className={`font-semibold ${weeklyInstaCount >= quota.insta ? "text-green-600" : "text-orange-600"}`}>
                        {weeklyInstaCount}/{quota.insta}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {totalMonthlyUploads > 0 && (
                <div className="space-y-2 border-t pt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <TrendingUp className="w-4 h-4 text-blue-500" />
                      <span className="text-xs font-semibold text-muted-foreground">This Month</span>
                    </div>
                    <span className="text-sm font-bold text-foreground">{totalMonthlyUploads}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Total uploads this month</p>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
