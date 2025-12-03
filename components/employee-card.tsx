"use client"

import type { Employee, DailyUpload, WeeklyStat } from "@/lib/types"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatDateISO, getRequiredQuota } from "@/lib/helpers"
import { CheckCircle2, Circle, AlertCircle, Youtube, Instagram, TrendingUp } from "lucide-react"
import { Spinner } from "@/components/ui/spinner"

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
        className={`
          modern-card interactive-card hover-lift cursor-pointer animate-fade-in
          ${!todayCompliant
            ? "border-red-300/50 dark:border-red-700/50 bg-red-50/30 dark:bg-red-950/30"
            : "border-border/50 hover:border-primary/30"
          }
          container-query
        `}
      >
        <CardHeader className="cq-p-fluid-md">
          <div className="flex items-start justify-between">
            <div className="flex-1 space-y-1">
              <CardTitle className="fluid-text-lg font-semibold text-foreground">
                {employee.name}
              </CardTitle>
              <CardDescription className="fluid-text-sm text-muted-foreground">
                {employee.role === "coder" ? "Coder" : "Peeper"} • {employee.email}
              </CardDescription>
            </div>
            {todayCompliant ? (
              <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-sm animate-scale-in focus-ring touch-target">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                <span className="hidden sm:inline">Today OK</span>
                <span className="sm:hidden">✓</span>
              </Badge>
            ) : (
              <Badge variant="destructive" className="shadow-sm animate-bounce-gentle focus-ring touch-target">
                <AlertCircle className="w-3 h-3 mr-1" />
                <span className="hidden sm:inline">Missed</span>
                <span className="sm:hidden">!</span>
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4 cq-p-fluid-md">
          {loading ? (
            <div className="flex items-center gap-3 text-sm text-muted-foreground animate-pulse">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground"></div>
              <span className="fluid-text-sm">Loading data...</span>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                <p className="fluid-text-sm font-semibold text-foreground/90 tracking-wide uppercase">
                  Today's Status
                </p>
                <div className="space-y-2 cq-grid-cols-1 cq-grid-cols-2">
                  {isInstaRequired && (
                    <div className={`
                      flex items-center justify-between p-3 rounded-lg transition-all duration-200
                      ${todayInstaDone
                        ? "bg-green-50 dark:bg-green-950/30 border border-green-200/50 dark:border-green-800/50"
                        : "bg-red-50 dark:bg-red-950/30 border border-red-200/50 dark:border-red-800/50"
                      }
                      hover:shadow-sm
                    `}>
                      <div className="flex items-center gap-3">
                        <div className={`
                          p-2 rounded-full transition-colors duration-200
                          ${todayInstaDone
                            ? "bg-pink-100 dark:bg-pink-900/30"
                            : "bg-gray-100 dark:bg-gray-800/30"
                          }
                        `}>
                          <Instagram className={`w-4 h-4 ${todayInstaDone ? "text-pink-600" : "text-pink-400"}`} />
                        </div>
                        <span className="fluid-text-sm font-medium">Instagram</span>
                      </div>
                      <div className="flex-shrink-0">
                        {todayInstaDone ? (
                          <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center animate-scale-in">
                            <CheckCircle2 className="w-3 h-3 text-white" />
                          </div>
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center">
                            <Circle className="w-3 h-3 text-white fill-current" />
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  {isYoutubeRequired && (
                    <div className={`
                      flex items-center justify-between p-3 rounded-lg transition-all duration-200
                      ${todayYoutubeDone
                        ? "bg-red-50 dark:bg-red-950/30 border border-red-200/50 dark:border-red-800/50"
                        : "bg-gray-50 dark:bg-gray-800/30 border border-gray-200/50 dark:border-gray-700/50"
                      }
                      hover:shadow-sm
                    `}>
                      <div className="flex items-center gap-3">
                        <div className={`
                          p-2 rounded-full transition-colors duration-200
                          ${todayYoutubeDone
                            ? "bg-red-100 dark:bg-red-900/30"
                            : "bg-gray-100 dark:bg-gray-800/30"
                          }
                        `}>
                          <Youtube className={`w-4 h-4 ${todayYoutubeDone ? "text-red-600" : "text-red-400"}`} />
                        </div>
                        <span className="fluid-text-sm font-medium">YouTube</span>
                      </div>
                      <div className="flex-shrink-0">
                        {todayYoutubeDone ? (
                          <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center animate-scale-in">
                            <CheckCircle2 className="w-3 h-3 text-white" />
                          </div>
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-gray-400 flex items-center justify-center">
                            <Circle className="w-3 h-3 text-white fill-current" />
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3 border-t border-border/50 pt-4">
                <p className="fluid-text-sm font-semibold text-foreground/90 tracking-wide uppercase">
                  This Week
                </p>
                <div className="grid grid-cols-1 gap-2 cq-grid-cols-2">
                  {isYoutubeRequired && (
                    <div className="flex items-center justify-between p-2 rounded-md bg-gradient-to-r from-red-50 to-red-100/50 dark:from-red-950/30 dark:to-red-900/20 border border-red-200/30 dark:border-red-800/30">
                      <div className="flex items-center gap-2">
                        <Youtube className="w-3 h-3 text-red-500" />
                        <span className="fluid-text-xs text-muted-foreground">YT</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className={`fluid-text-sm font-bold ${
                          weeklyYoutubeCount >= quota.youtube
                            ? "text-green-600 dark:text-green-400"
                            : "text-orange-600 dark:text-orange-400"
                        }`}>
                          {weeklyYoutubeCount}
                        </span>
                        <span className="fluid-text-xs text-muted-foreground">/{quota.youtube}</span>
                        {weeklyYoutubeCount > quota.youtube && (
                          <span className="fluid-text-xs text-green-600 dark:text-green-400 font-medium">
                            +{weeklyYoutubeCount - quota.youtube}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  {isInstaRequired && (
                    <div className="flex items-center justify-between p-2 rounded-md bg-gradient-to-r from-pink-50 to-pink-100/50 dark:from-pink-950/30 dark:to-pink-900/20 border border-pink-200/30 dark:border-pink-800/30">
                      <div className="flex items-center gap-2">
                        <Instagram className="w-3 h-3 text-pink-500" />
                        <span className="fluid-text-xs text-muted-foreground">IG</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className={`fluid-text-sm font-bold ${
                          weeklyInstaCount >= quota.insta
                            ? "text-green-600 dark:text-green-400"
                            : "text-orange-600 dark:text-orange-400"
                        }`}>
                          {weeklyInstaCount}
                        </span>
                        <span className="fluid-text-xs text-muted-foreground">/{quota.insta}</span>
                        {weeklyInstaCount > quota.insta && (
                          <span className="fluid-text-xs text-green-600 dark:text-green-400 font-medium">
                            +{weeklyInstaCount - quota.insta}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {totalMonthlyUploads > 0 && (
                <div className="space-y-3 border-t border-border/50 pt-4">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20 border border-blue-200/30 dark:border-blue-800/30">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-full bg-blue-100 dark:bg-blue-900/30">
                        <TrendingUp className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <span className="fluid-text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          This Month
                        </span>
                        <p className="fluid-text-xs text-muted-foreground">Total uploads</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="fluid-text-lg font-bold text-blue-600 dark:text-blue-400">
                        {totalMonthlyUploads}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
