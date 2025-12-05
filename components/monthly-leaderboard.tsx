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
  youtube_mandatory?: number
  instagram_mandatory?: number
  youtube_extra: number
  instagram_extra: number
  days_with_both: number
  required_instagram: number
  required_youtube: number
  insta_compliant: boolean
  youtube_compliant: boolean
  fully_compliant: boolean
  insta_extra_count?: number
  youtube_extra_count?: number
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
      <Card className="modern-card animate-fade-in">
        <CardHeader className="cq-p-fluid-md">
          <CardTitle className="fluid-text-lg">Monthly Leaderboard</CardTitle>
          <CardDescription className="fluid-text-sm">Preparing stats...</CardDescription>
        </CardHeader>
        <CardContent className="cq-p-fluid-md">
          <div className="space-y-4">
            <LoadingLottie message="Loading monthly leaderboard..." />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (stats.length === 0) {
    return (
      <Card className="modern-card animate-fade-in">
        <CardHeader className="cq-p-fluid-md">
          <CardTitle className="fluid-text-lg">Monthly Leaderboard</CardTitle>
          <CardDescription className="fluid-text-sm">No data available for this month</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const getRankIcon = (index: number) => {
    if (index === 0) return <Trophy className="w-6 h-6 text-yellow-500 drop-shadow-sm" />
    if (index === 1) return <Medal className="w-6 h-6 text-gray-400 drop-shadow-sm" />
    if (index === 2) return <Award className="w-6 h-6 text-amber-600 drop-shadow-sm" />
    return null
  }

  const getRankBadge = (index: number) => {
    if (index === 0) return <Badge className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white shadow-sm animate-bounce-gentle">🥇 1st</Badge>
    if (index === 1) return <Badge className="bg-gradient-to-r from-gray-400 to-gray-500 text-white shadow-sm">🥈 2nd</Badge>
    if (index === 2) return <Badge className="bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-sm">🥉 3rd</Badge>
    return <Badge variant="outline" className="focus-ring">#{index + 1}</Badge>
  }

  return (
    <Card className="modern-card-gradient elevated-card animate-slide-up">
      <CardHeader className="cq-p-fluid-md">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-3 fluid-text-lg">
              <div className="p-2 rounded-full bg-primary/10">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              Monthly Leaderboard
            </CardTitle>
            <CardDescription className="fluid-text-sm">
              {monthData
                ? `Statistics for ${new Date(monthData + "-01").toLocaleDateString("en-US", { month: "long", year: "numeric" })}`
                : "Current month statistics"}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="w-full">
        <div className="space-y-4 w-full">
          {stats.map((stat, index) => (
            <div
              key={stat.employee_id}
              className={`
                p-4 rounded-xl border transition-all duration-300 hover-lift animate-fade-in
                ${index < 3
                  ? "bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 dark:from-primary/10 dark:via-primary/20 dark:to-primary/10 border-primary/30 shadow-md"
                  : "modern-card hover:shadow-lg"
                }
              `}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted shrink-0">
                    {getRankIcon(index) || (
                      <span className="text-sm font-semibold text-muted-foreground">#{index + 1}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <h3 className="fluid-text-base font-semibold text-foreground">{stat.employee_name}</h3>
                      {getRankBadge(index)}
                      {stat.fully_compliant && (
                        <Badge variant="outline" className="text-green-600 border-green-600 focus-ring touch-target">
                          ✓ Compliant
                        </Badge>
                      )}
                    </div>
                    <p className="fluid-text-xs text-muted-foreground mb-3 capitalize font-medium">{stat.employee_role}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 cq-grid-cols-3">
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-red-50/50 dark:bg-red-950/30 border border-red-200/30 dark:border-red-800/30">
                        <div className="p-1.5 rounded-full bg-red-100 dark:bg-red-900/30">
                          <Youtube className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-1">
                              <span className="fluid-text-sm font-bold text-red-700 dark:text-red-300">{stat.total_youtube}</span>
                              <span className="fluid-text-xs text-muted-foreground">YT</span>
                            </div>
                            {stat.youtube_extra > 0 && (
                              <div className="fluid-text-xs text-green-600 dark:text-green-400 font-medium">
                                +{stat.youtube_extra} extra
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 p-2 rounded-lg bg-pink-50/50 dark:bg-pink-950/30 border border-pink-200/30 dark:border-pink-800/30">
                        <div className="p-1.5 rounded-full bg-pink-100 dark:bg-pink-900/30">
                          <Instagram className="w-3.5 h-3.5 text-pink-600 dark:text-pink-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-1">
                              <span className="fluid-text-sm font-bold text-pink-700 dark:text-pink-300">{stat.total_instagram}</span>
                              <span className="fluid-text-xs text-muted-foreground">IG</span>
                            </div>
                            {stat.insta_extra > 0 && (
                              <div className="fluid-text-xs text-green-600 dark:text-green-400 font-medium">
                                +{stat.insta_extra} extra
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 p-2 rounded-lg bg-blue-50/50 dark:bg-blue-950/30 border border-blue-200/30 dark:border-blue-800/30">
                        <div className="p-1.5 rounded-full bg-blue-100 dark:bg-blue-900/30">
                          <TrendingUp className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1">
                            <span className="fluid-text-sm font-bold text-blue-700 dark:text-blue-300">{stat.total_uploads}</span>
                            <span className="fluid-text-xs text-muted-foreground">Total</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    {stat.days_with_both > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {stat.days_with_both} day{stat.days_with_both !== 1 ? "s" : ""} with both platforms
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-left md:text-right shrink-0 cq-text-right">
                  {!stat.fully_compliant && (
                    <div className="space-y-2">
                      {!stat.insta_compliant && (
                        <Badge variant="destructive" className="fluid-text-xs shadow-sm focus-ring touch-target">
                          IG: {stat.total_instagram}/{stat.required_instagram}
                        </Badge>
                      )}
                      {!stat.youtube_compliant && (
                        <Badge variant="destructive" className="fluid-text-xs shadow-sm focus-ring touch-target">
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

        {/* Extra Uploads Summary */}
        {(() => {
          const totalYoutubeExtras = stats.reduce((sum, stat) => sum + stat.youtube_extra, 0)
          const totalInstagramExtras = stats.reduce((sum, stat) => sum + stat.insta_extra, 0)
          const totalExtras = totalYoutubeExtras + totalInstagramExtras

          if (totalExtras > 0) {
            return (
              <div className="mt-6 p-4 bg-gradient-to-r from-green-50 via-green-100/50 to-emerald-50 dark:from-green-950/50 dark:via-green-900/30 dark:to-emerald-950/50 rounded-xl border border-green-200/50 dark:border-green-800/50">
                <p className="fluid-text-sm font-semibold mb-3 text-green-900 dark:text-green-100">🌟 Extra Uploads Summary:</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="flex items-center gap-2">
                    <Youtube className="w-4 h-4 text-red-500" />
                    <span className="fluid-text-sm text-green-800 dark:text-green-200">
                      <strong>{totalYoutubeExtras}</strong> extra YouTube videos
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Instagram className="w-4 h-4 text-pink-500" />
                    <span className="fluid-text-sm text-green-800 dark:text-green-200">
                      <strong>{totalInstagramExtras}</strong> extra Instagram posts
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                    <span className="fluid-text-sm text-green-800 dark:text-green-200">
                      <strong>{totalExtras}</strong> total extra uploads
                    </span>
                  </div>
                </div>
              </div>
            )
          }
          return null
        })()}

        <div className="mt-6 p-4 bg-gradient-to-r from-muted/30 via-muted/50 to-muted/30 dark:from-muted/50 dark:via-muted/70 dark:to-muted/50 rounded-xl border border-border/50">
          <p className="fluid-text-sm font-semibold mb-3 text-foreground/90">📋 Requirements:</p>
          <ul className="space-y-2 fluid-text-xs text-muted-foreground">
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-pink-500"></div>
              <span><strong className="text-pink-600 dark:text-pink-400">Instagram:</strong> 1 post per day (mandatory)</span>
            </li>
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
              <span><strong className="text-red-600 dark:text-red-400">YouTube:</strong> 3 videos per week (mandatory)</span>
            </li>
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
              <span><strong className="text-blue-600 dark:text-blue-400">Extra uploads</strong> are tracked and displayed</span>
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}

