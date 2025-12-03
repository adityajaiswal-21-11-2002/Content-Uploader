"use client"

import { useEffect, useState } from "react"
import type { Employee, WeeklyStat } from "@/lib/types"
import { getRequiredQuota, getWeekStartDate, formatDateISO } from "@/lib/helpers"

interface WeeklyProgressProps {
  employee: Employee
}

export default function WeeklyProgress({ employee }: WeeklyProgressProps) {
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStat | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/uploads/week-summary")
        if (response.ok) {
          const data = await response.json()
          const employeeSummary = data.summary?.find((s: any) => s.employee_id === employee.id)
          if (employeeSummary) {
            setWeeklyStats({
              id: employee.id,
              employee_id: employee.id,
              week_start_date: data.week_start,
              insta_count: employeeSummary.insta_uploaded,
              youtube_count: employeeSummary.yt_uploaded,
            })
          }
        }
      } catch (error) {
        console.error("Error fetching weekly stats:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [employee.id])

  const quota = getRequiredQuota(employee.role)
  const youtubeCount = weeklyStats?.youtube_count || 0
  const instaCount = weeklyStats?.insta_count || 0

  const youtubeProgress = quota.youtube > 0 ? Math.min(youtubeCount / quota.youtube, 1) : 0
  const instaProgress = quota.insta > 0 ? Math.min(instaCount / quota.insta, 1) : 0

  // Calculate days into week and days left (Monday start)
  const today = new Date()
  const weekStart = getWeekStartDate(today)
  const dayOfWeek = today.getDay()
  const daysIntoWeek = dayOfWeek === 0 ? 6 : dayOfWeek - 1 // 0 = Monday, 6 = Sunday
  const daysLeft = Math.max(0, 6 - daysIntoWeek)

  let overallStatus: "on_track" | "behind" | "at_risk" = "on_track"
  if (youtubeCount >= quota.youtube && instaCount >= quota.insta) {
    overallStatus = "on_track"
  } else if (daysLeft === 0) {
    overallStatus = "at_risk"
  } else {
    // Simple heuristic: if they've done less than half of required uploads by mid-week, mark as behind
    const halfwayPoint = 3
    const totalRequired = quota.youtube + quota.insta
    const totalDone = youtubeCount + instaCount
    overallStatus = totalDone >= totalRequired / 2 || daysIntoWeek < halfwayPoint ? "on_track" : "behind"
  }

  return (
    <div className="space-y-6">
      {/* Summary header */}
      <div className="flex items-center justify-between text-sm">
        <div className="space-y-1">
          <p className="text-muted-foreground">
            Week of {formatDateISO(weekStart)} • {daysLeft} day{daysLeft !== 1 ? "s" : ""} left
          </p>
          <p className="text-xs text-muted-foreground">
            This week: <span className="font-semibold">{youtubeCount}</span> / {quota.youtube} YouTube,{" "}
            <span className="font-semibold">{instaCount}</span> / {quota.insta} Instagram
          </p>
        </div>
        <span
          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
            overallStatus === "on_track"
              ? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300"
              : overallStatus === "behind"
                ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300"
                : "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
          }`}
        >
          {overallStatus === "on_track"
            ? "On track"
            : overallStatus === "behind"
              ? "Slightly behind"
              : "At risk this week"}
        </span>
      </div>
      {quota.youtube > 0 && (
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-semibold text-foreground">YouTube Videos</span>
            <span
              className={`text-sm font-semibold ${youtubeCount >= quota.youtube ? "text-green-600" : "text-orange-600"}`}
            >
              {youtubeCount} / {quota.youtube}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all ${youtubeCount >= quota.youtube ? "bg-green-500" : "bg-orange-500"}`}
              style={{ width: `${youtubeProgress * 100}%` }}
            />
          </div>
          {!loading && (
            <div className="mt-2 flex gap-1">
              {Array.from({ length: quota.youtube }).map((_, i) => (
                <div key={i} className={`w-2 h-2 rounded-full ${i < youtubeCount ? "bg-green-500" : "bg-gray-300"}`} />
              ))}
            </div>
          )}
        </div>
      )}

      {quota.insta > 0 && (
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-semibold text-foreground">Instagram Posts</span>
            <span
              className={`text-sm font-semibold ${instaCount >= quota.insta ? "text-green-600" : "text-orange-600"}`}
            >
              {instaCount} / {quota.insta}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all ${instaCount >= quota.insta ? "bg-green-500" : "bg-orange-500"}`}
              style={{ width: `${instaProgress * 100}%` }}
            />
          </div>
          {!loading && (
            <div className="mt-2 flex gap-1 flex-wrap">
              {Array.from({ length: quota.insta }).map((_, i) => (
                <div key={i} className={`w-2 h-2 rounded-full ${i < instaCount ? "bg-green-500" : "bg-gray-300"}`} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
