"use client"

import { useEffect, useState } from "react"
import type { DailyUploadRecord } from "@/lib/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Youtube, Instagram, CheckCircle2, Circle, Calendar } from "lucide-react"
import { formatDateISO } from "@/lib/helpers"

interface DailyTrackingCalendarProps {
  employeeId: number
  days?: number // Number of days to show (default: 30)
}

export default function DailyTrackingCalendar({ employeeId, days = 30 }: DailyTrackingCalendarProps) {
  const [records, setRecords] = useState<DailyUploadRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/daily-uploads/employee/${employeeId}?days=${days}`)
        if (!response.ok) {
          throw new Error("Failed to fetch daily records")
        }
        const data = await response.json()
        setRecords(data.records || [])
      } catch (err) {
        console.error("Error fetching daily records:", err)
        setError("Failed to load daily tracking data")
      } finally {
        setLoading(false)
      }
    }

    fetchRecords()
  }, [employeeId, days])

  // Generate date range
  const today = new Date()
  const dateRange: string[] = []
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    dateRange.push(formatDateISO(date))
  }

  // Create a map for quick lookup
  const recordsMap = new Map<string, DailyUploadRecord>()
  records.forEach((record) => {
    recordsMap.set(record.date, record)
  })

  // Format date for display
  const formatDateDisplay = (dateStr: string) => {
    const date = new Date(dateStr + "T00:00:00")
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  }

  const formatDateFull = (dateStr: string) => {
    const date = new Date(dateStr + "T00:00:00")
    return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Daily Upload Tracking
          </CardTitle>
          <CardDescription>Last {days} days</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading daily records...</p>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Daily Upload Tracking
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">{error}</p>
        </CardContent>
      </Card>
    )
  }

  // Calculate statistics
  const totalDays = dateRange.length
  const youtubeDays = records.filter((r) => r.youtube_done).length
  const instaDays = records.filter((r) => r.insta_done).length
  const bothDays = records.filter((r) => r.youtube_done && r.insta_done).length

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Daily Upload Tracking
        </CardTitle>
        <CardDescription>
          Last {days} days • {youtubeDays} YouTube • {instaDays} Instagram • {bothDays} Both
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Statistics Summary */}
          <div className="grid grid-cols-3 gap-2 p-3 bg-accent/10 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">{youtubeDays}</div>
              <div className="text-xs text-muted-foreground">YouTube</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">{instaDays}</div>
              <div className="text-xs text-muted-foreground">Instagram</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">{bothDays}</div>
              <div className="text-xs text-muted-foreground">Both</div>
            </div>
          </div>

          {/* Daily Records Table */}
          <div className="border rounded-lg overflow-hidden">
            <div className="max-h-[400px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-accent/50 sticky top-0">
                  <tr>
                    <th className="text-left p-2 font-semibold text-foreground">Date</th>
                    <th className="text-center p-2 font-semibold text-foreground">YouTube</th>
                    <th className="text-center p-2 font-semibold text-foreground">Instagram</th>
                    <th className="text-center p-2 font-semibold text-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {dateRange.map((dateStr, idx) => {
                    const record = recordsMap.get(dateStr)
                    const isToday = dateStr === formatDateISO(new Date())
                    const youtubeDone = record?.youtube_done || false
                    const instaDone = record?.insta_done || false

                    return (
                      <tr
                        key={dateStr}
                        className={`border-b border-border/40 ${
                          isToday ? "bg-accent/20 font-medium" : ""
                        } ${idx % 2 === 0 ? "bg-background" : "bg-accent/5"}`}
                      >
                        <td className="p-2">
                          <div className="flex flex-col">
                            <span className="text-foreground">{formatDateDisplay(dateStr)}</span>
                            {isToday && <span className="text-xs text-muted-foreground">Today</span>}
                          </div>
                        </td>
                        <td className="p-2 text-center">
                          <div className="flex flex-col items-center gap-1">
                            {youtubeDone ? (
                              <CheckCircle2 className="w-4 h-4 text-green-500" />
                            ) : (
                              <Circle className="w-4 h-4 text-muted-foreground" />
                            )}
                            {youtubeDone && record?.youtube_video_link && (
                              <a
                                href={record.youtube_video_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-blue-500 hover:underline"
                                onClick={(e) => e.stopPropagation()}
                              >
                                View Link
                              </a>
                            )}
                          </div>
                        </td>
                        <td className="p-2 text-center">
                          <div className="flex flex-col items-center gap-1">
                            {instaDone ? (
                              <CheckCircle2 className="w-4 h-4 text-green-500" />
                            ) : (
                              <Circle className="w-4 h-4 text-muted-foreground" />
                            )}
                            {instaDone && record?.instagram_video_link && (
                              <a
                                href={record.instagram_video_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-blue-500 hover:underline"
                                onClick={(e) => e.stopPropagation()}
                              >
                                View Link
                              </a>
                            )}
                          </div>
                        </td>
                        <td className="p-2 text-center">
                          <div className="flex items-center justify-center gap-1">
                            {youtubeDone && instaDone ? (
                              <span className="text-xs text-green-600 font-medium">Complete</span>
                            ) : youtubeDone || instaDone ? (
                              <span className="text-xs text-yellow-600 font-medium">Partial</span>
                            ) : (
                              <span className="text-xs text-muted-foreground">Pending</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2">
            <div className="flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-green-500" />
              <span>Uploaded</span>
            </div>
            <div className="flex items-center gap-1">
              <Circle className="w-3 h-3 text-muted-foreground" />
              <span>Not Uploaded</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

