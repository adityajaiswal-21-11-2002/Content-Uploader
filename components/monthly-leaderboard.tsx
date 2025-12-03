"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Trophy, Medal, Award, Youtube, Instagram, TrendingUp } from "lucide-react"
import { LoadingLottie } from "@/components/ui/loading-lottie"

interface MonthlyStat {
  employee_id: number
  employee_name: string
  employee_role: string
  employee_email: string
  month: string
  total_youtube: number
  total_instagram: number
  total_uploads: number
  days_with_both: number
  required_instagram: number
  required_youtube: number
  insta_compliant: boolean
  youtube_compliant: boolean
  fully_compliant: boolean
  insta_extra: number
  youtube_extra: number
}

interface MonthlyLeaderboardProps {
  month?: string
}

export default function MonthlyLeaderboard({ month }: MonthlyLeaderboardProps) {
  const [stats, setStats] = useState<MonthlyStat[]>([])
  const [loading, setLoading] = useState(true)
  const [monthData, setMonthData] = useState<string>("")

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const url = month ? `/api/monthly-stats?month=${month}` : "/api/monthly-stats"
        const response = await fetch(url)
        if (response.ok) {
          const data = await response.json()
          setStats(data.stats || [])
          setMonthData(data.month || "")
        }
      } catch (error) {
        console.error("Error fetching monthly stats:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
    // Refresh every 5 minutes
    const interval = setInterval(fetchStats, 300000)
    return () => clearInterval(interval)
  }, [month])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Monthly Leaderboard</CardTitle>
          <CardDescription>Preparing stats...</CardDescription>
        </CardHeader>
        <CardContent>
          <LoadingLottie message="Loading monthly leaderboard..." />
        </CardContent>
      </Card>
    )
  }

  if (stats.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Monthly Leaderboard</CardTitle>
          <CardDescription>No data available for this month</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const getRankIcon = (index: number) => {
    if (index === 0) return <Trophy className="w-5 h-5 text-yellow-500" />
    if (index === 1) return <Medal className="w-5 h-5 text-gray-400" />
    if (index === 2) return <Award className="w-5 h-5 text-amber-600" />
    return null
  }

  const getRankBadge = (index: number) => {
    if (index === 0) return <Badge className="bg-yellow-500">🥇 1st</Badge>
    if (index === 1) return <Badge className="bg-gray-400">🥈 2nd</Badge>
    if (index === 2) return <Badge className="bg-amber-600">🥉 3rd</Badge>
    return <Badge variant="outline">#{index + 1}</Badge>
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Monthly Leaderboard
            </CardTitle>
            <CardDescription>
              {monthData
                ? `Statistics for ${new Date(monthData + "-01").toLocaleDateString("en-US", { month: "long", year: "numeric" })}`
                : "Current month statistics"}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {stats.map((stat, index) => (
            <div
              key={stat.employee_id}
              className={`p-4 rounded-lg border ${
                index < 3 ? "bg-accent/50 border-primary/20" : "bg-background border-border"
              }`}
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted shrink-0">
                    {getRankIcon(index) || (
                      <span className="text-sm font-semibold text-muted-foreground">#{index + 1}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-foreground">{stat.employee_name}</h3>
                      {getRankBadge(index)}
                      {stat.fully_compliant && (
                        <Badge variant="outline" className="text-green-600 border-green-600">
                          ✓ Compliant
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mb-2 capitalize">{stat.employee_role}</p>
                    <div className="flex flex-wrap gap-4 text-sm">
                      <div className="flex items-center gap-1.5">
                        <Youtube className="w-4 h-4 text-red-500" />
                        <span className="font-medium">{stat.total_youtube}</span>
                        <span className="text-muted-foreground">YT</span>
                        {stat.youtube_extra > 0 && (
                          <span className="text-xs text-green-600">(+{stat.youtube_extra})</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Instagram className="w-4 h-4 text-pink-500" />
                        <span className="font-medium">{stat.total_instagram}</span>
                        <span className="text-muted-foreground">IG</span>
                        {stat.insta_extra > 0 && (
                          <span className="text-xs text-green-600">(+{stat.insta_extra})</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <TrendingUp className="w-4 h-4 text-blue-500" />
                        <span className="font-semibold text-foreground">{stat.total_uploads}</span>
                        <span className="text-muted-foreground">Total</span>
                      </div>
                    </div>
                    {stat.days_with_both > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {stat.days_with_both} day{stat.days_with_both !== 1 ? "s" : ""} with both platforms
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-left md:text-right shrink-0">
                  {!stat.fully_compliant && (
                    <div className="space-y-1">
                      {!stat.insta_compliant && (
                        <Badge variant="destructive" className="text-xs">
                          IG: {stat.total_instagram}/{stat.required_instagram}
                        </Badge>
                      )}
                      {!stat.youtube_compliant && (
                        <Badge variant="destructive" className="text-xs">
                          YT: {stat.total_youtube}/{stat.required_youtube}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 p-3 bg-muted/50 rounded-lg text-xs text-muted-foreground">
          <p className="font-semibold mb-1">Requirements:</p>
          <ul className="list-disc list-inside space-y-0.5">
            <li>Instagram: 1 post per day (mandatory)</li>
            <li>YouTube: 3 videos per week (mandatory)</li>
            <li>Extra uploads are tracked and displayed</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}

