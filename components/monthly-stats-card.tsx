"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Youtube, Instagram, TrendingUp, CheckCircle2, AlertCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"

interface MonthlyStatsCardProps {
  employeeId: number
}

interface MonthlyStat {
  employee_id: number
  total_youtube: number
  total_instagram: number
  total_uploads: number
  required_instagram: number
  required_youtube: number
  insta_compliant: boolean
  youtube_compliant: boolean
  fully_compliant: boolean
  insta_extra: number
  youtube_extra: number
}

export default function MonthlyStatsCard({ employeeId }: MonthlyStatsCardProps) {
  const [stats, setStats] = useState<MonthlyStat | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch("/api/monthly-stats")
        if (response.ok) {
          const data = await response.json()
          const employeeStat = data.stats?.find((s: any) => s.employee_id === employeeId)
          setStats(employeeStat || null)
        }
      } catch (error) {
        console.error("Error fetching monthly stats:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
    const interval = setInterval(fetchStats, 300000) // Refresh every 5 minutes
    return () => clearInterval(interval)
  }, [employeeId])

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Spinner />
        <span>Loading monthly statistics...</span>
      </div>
    )
  }

  if (!stats) {
    return <p className="text-sm text-muted-foreground">No monthly data available yet.</p>
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 rounded-lg bg-accent/50">
          <div className="flex items-center gap-2 mb-2">
            <Youtube className="w-4 h-4 text-red-500" />
            <span className="text-sm font-medium text-muted-foreground">YouTube</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{stats.total_youtube}</p>
          <p className="text-xs text-muted-foreground">
            Required: {stats.required_youtube}
            {stats.youtube_extra > 0 && (
              <span className="text-green-600 ml-1">(+{stats.youtube_extra} extra)</span>
            )}
          </p>
          {stats.youtube_compliant ? (
            <Badge variant="outline" className="mt-2 text-green-600 border-green-600">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Compliant
            </Badge>
          ) : (
            <Badge variant="destructive" className="mt-2">
              <AlertCircle className="w-3 h-3 mr-1" />
              Missing {stats.required_youtube - stats.total_youtube}
            </Badge>
          )}
        </div>

        <div className="p-4 rounded-lg bg-accent/50">
          <div className="flex items-center gap-2 mb-2">
            <Instagram className="w-4 h-4 text-pink-500" />
            <span className="text-sm font-medium text-muted-foreground">Instagram</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{stats.total_instagram}</p>
          <p className="text-xs text-muted-foreground">
            Required: {stats.required_instagram}
            {stats.insta_extra > 0 && (
              <span className="text-green-600 ml-1">(+{stats.insta_extra} extra)</span>
            )}
          </p>
          {stats.insta_compliant ? (
            <Badge variant="outline" className="mt-2 text-green-600 border-green-600">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Compliant
            </Badge>
          ) : (
            <Badge variant="destructive" className="mt-2">
              <AlertCircle className="w-3 h-3 mr-1" />
              Missing {stats.required_instagram - stats.total_instagram}
            </Badge>
          )}
        </div>

        <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-blue-500" />
            <span className="text-sm font-medium text-muted-foreground">Total</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{stats.total_uploads}</p>
          <p className="text-xs text-muted-foreground">All uploads this month</p>
          {stats.fully_compliant ? (
            <Badge className="mt-2 bg-green-500 text-white">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Fully Compliant
            </Badge>
          ) : (
            <Badge variant="destructive" className="mt-2">
              <AlertCircle className="w-3 h-3 mr-1" />
              Needs Attention
            </Badge>
          )}
        </div>
      </div>

      <div className="p-3 bg-muted/50 rounded-lg text-xs text-muted-foreground">
        <p className="font-semibold mb-1">Monthly Requirements:</p>
        <ul className="list-disc list-inside space-y-0.5">
          <li>Instagram: 1 post per day (mandatory)</li>
          <li>YouTube: 3 videos per week (mandatory)</li>
          <li>Extra uploads beyond requirements are tracked and count toward monthly leaderboard</li>
        </ul>
      </div>
    </div>
  )
}

