"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Bar, BarChart, Line, LineChart, XAxis, YAxis, CartesianGrid, Legend, Area, AreaChart } from "recharts"
import { Youtube, Instagram, TrendingUp } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { LoadingLottie } from "@/components/ui/loading-lottie"

interface DailyAnalyticsProps {
  employeeId?: number
  days?: number
}

export default function DailyAnalytics({ employeeId, days = 30 }: DailyAnalyticsProps) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selectedDays, setSelectedDays] = useState(days)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const url = `/api/analytics/daily?days=${selectedDays}${employeeId ? `&employeeId=${employeeId}` : ""}`
        const response = await fetch(url)
        if (response.ok) {
          const result = await response.json()
          setData(result)
        }
      } catch (error) {
        console.error("Error fetching daily analytics:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [employeeId, selectedDays])

  if (loading) {
    return <LoadingLottie message="Loading daily analytics..." />
  }

  if (!data || !data.data || data.data.length === 0) {
    return <div className="text-center py-8 text-muted-foreground">No data available.</div>
  }

  // Format dates for display and expose extra upload fields
  const chartData = data.data.map((item: any) => {
    const youtubeExtra = item.youtube_extra || 0
    const instagramExtra = item.instagram_extra || 0
    const youtubeMandatory =
      item.youtube_mandatory !== undefined ? item.youtube_mandatory : Math.max(0, (item.youtube || 0) - youtubeExtra)
    const instagramMandatory =
      item.instagram_mandatory !== undefined
        ? item.instagram_mandatory
        : Math.max(0, (item.instagram || 0) - instagramExtra)

    return {
      ...item,
      dateLabel: new Date(item.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      youtube_mandatory: youtubeMandatory,
      youtube_extra: youtubeExtra,
      instagram_mandatory: instagramMandatory,
      instagram_extra: instagramExtra,
    }
  })

  const chartConfig = {
    youtube: {
      label: "YouTube",
      color: "#ef4444",
    },
    instagram: {
      label: "Instagram",
      color: "#ec4899",
    },
    total: {
      label: "Total",
      color: "#3b82f6",
    },
    youtube_mandatory: {
      label: "YouTube (Daily)",
      color: "#ef4444",
    },
    youtube_extra: {
      label: "YouTube Extra",
      color: "#fb923c",
    },
    instagram_mandatory: {
      label: "Instagram (Daily)",
      color: "#ec4899",
    },
    instagram_extra: {
      label: "Instagram Extra",
      color: "#f9a8d4",
    },
    employees_uploaded_yt: {
      label: "Uploaded YT",
      color: "#22c55e",
    },
    employees_missed_yt: {
      label: "Missed YT",
      color: "#ef4444",
    },
    employees_uploaded_ig: {
      label: "Uploaded IG",
      color: "#22c55e",
    },
    employees_missed_ig: {
      label: "Missed IG",
      color: "#ef4444",
    },
    employee_youtube: {
      label: "Personal YouTube",
      color: "#ef4444",
    },
    employee_youtube_extra: {
      label: "Personal YouTube Extra",
      color: "#fb923c",
    },
    employee_instagram: {
      label: "Personal Instagram",
      color: "#ec4899",
    },
    employee_instagram_extra: {
      label: "Personal Instagram Extra",
      color: "#f9a8d4",
    },
  }

  return (
    <div className="space-y-6">
      {/* Days Selector */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Select value={selectedDays.toString()} onValueChange={(v) => setSelectedDays(Number.parseInt(v))}>
          <SelectTrigger className="w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="14">Last 14 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="60">Last 60 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
        <div className="text-sm text-muted-foreground">
          {data.summary.total_days} days • Avg: {data.summary.avg_youtube_per_day.toFixed(1)} YT, {data.summary.avg_instagram_per_day.toFixed(1)} IG per day
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total YouTube</p>
                <p className="text-2xl font-bold">{data.summary.total_youtube_uploads}</p>
                <p className="text-xs text-muted-foreground">
                  Avg: {data.summary.avg_youtube_per_day.toFixed(1)}/day
                </p>
                <p className="text-xs text-muted-foreground">
                  Extras: +{data.summary.extra_youtube_uploads || 0}
                </p>
              </div>
              <Youtube className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Instagram</p>
                <p className="text-2xl font-bold">{data.summary.total_instagram_uploads}</p>
                <p className="text-xs text-muted-foreground">
                  Avg: {data.summary.avg_instagram_per_day.toFixed(1)}/day
                </p>
                <p className="text-xs text-muted-foreground">
                  Extras: +{data.summary.extra_instagram_uploads || 0}
                </p>
              </div>
              <Instagram className="w-8 h-8 text-pink-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Uploads</p>
                <p className="text-2xl font-bold">{data.summary.total_uploads}</p>
                <p className="text-xs text-muted-foreground">
                  Extras overall: +
                  {(data.summary.extra_youtube_uploads || 0) + (data.summary.extra_instagram_uploads || 0)}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Period</p>
                <p className="text-lg font-bold">{data.summary.total_days} days</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <p className="text-xs text-muted-foreground">
        All counts include both mandatory uploads and any extra videos.
      </p>

      {/* Daily Uploads Line Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Uploads Trend</CardTitle>
          <CardDescription>Uploads per day over time</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[260px] sm:h-[360px] lg:h-[420px]">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="dateLabel"
                angle={-45}
                textAnchor="end"
                height={100}
                tick={{ fontSize: 10 }}
                interval="preserveStartEnd"
              />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Legend />
              <Line type="monotone" dataKey="youtube" stroke="#ef4444" name="YouTube" strokeWidth={2} />
              <Line type="monotone" dataKey="instagram" stroke="#ec4899" name="Instagram" strokeWidth={2} />
              <Line type="monotone" dataKey="total" stroke="#3b82f6" name="Total" strokeWidth={2} />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Daily Uploads Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Uploads Breakdown</CardTitle>
          <CardDescription>YouTube and Instagram uploads by day</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[260px] sm:h-[360px] lg:h-[420px]">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="dateLabel"
                angle={-45}
                textAnchor="end"
                height={100}
                tick={{ fontSize: 10 }}
                interval="preserveStartEnd"
              />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Legend />
              <Bar dataKey="youtube_mandatory" stackId="youtube" fill="#ef4444" name="YouTube (Daily)" />
              <Bar dataKey="youtube_extra" stackId="youtube" fill="#fb923c" name="YouTube Extra" />
              <Bar dataKey="instagram_mandatory" stackId="instagram" fill="#ec4899" name="Instagram (Daily)" />
              <Bar dataKey="instagram_extra" stackId="instagram" fill="#f9a8d4" name="Instagram Extra" />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Who Uploaded vs Who Didn't - YouTube */}
      {!employeeId && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Daily YouTube Compliance</CardTitle>
              <CardDescription>Number of employees who uploaded vs missed YouTube videos each day</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[260px] sm:h-[360px] lg:h-[420px]">
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="dateLabel"
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    tick={{ fontSize: 10 }}
                    interval="preserveStartEnd"
                  />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="employees_uploaded_yt"
                    stackId="1"
                    stroke="#22c55e"
                    fill="#22c55e"
                    name="Uploaded YT"
                  />
                  <Area
                    type="monotone"
                    dataKey="employees_missed_yt"
                    stackId="1"
                    stroke="#ef4444"
                    fill="#ef4444"
                    name="Missed YT"
                  />
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Who Uploaded vs Who Didn't - Instagram */}
          <Card>
            <CardHeader>
              <CardTitle>Daily Instagram Compliance</CardTitle>
              <CardDescription>Number of employees who uploaded vs missed Instagram posts each day</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[260px] sm:h-[360px] lg:h-[420px]">
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="dateLabel"
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    tick={{ fontSize: 10 }}
                    interval="preserveStartEnd"
                  />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="employees_uploaded_ig"
                    stackId="2"
                    stroke="#22c55e"
                    fill="#22c55e"
                    name="Uploaded IG"
                  />
                  <Area
                    type="monotone"
                    dataKey="employees_missed_ig"
                    stackId="2"
                    stroke="#ef4444"
                    fill="#ef4444"
                    name="Missed IG"
                  />
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </>
      )}

      {/* Employee-specific chart */}
      {employeeId && (
        <Card>
          <CardHeader>
            <CardTitle>Your Daily Upload Status</CardTitle>
            <CardDescription>Your upload activity over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[220px] sm:h-[300px] lg:h-[360px]">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="dateLabel"
                  angle={-45}
                  textAnchor="end"
                  height={100}
                  tick={{ fontSize: 10 }}
                  interval="preserveStartEnd"
                />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend />
                <Bar dataKey="employee_youtube" stackId="employee_youtube" fill="#ef4444" name="YouTube Uploaded" />
                <Bar
                  dataKey="employee_youtube_extra"
                  stackId="employee_youtube"
                  fill="#fb923c"
                  name="YouTube Extra"
                />
                <Bar
                  dataKey="employee_instagram"
                  stackId="employee_instagram"
                  fill="#ec4899"
                  name="Instagram Uploaded"
                />
                <Bar
                  dataKey="employee_instagram_extra"
                  stackId="employee_instagram"
                  fill="#f9a8d4"
                  name="Instagram Extra"
                />
              </BarChart>
            </ChartContainer>
            <p className="text-xs text-muted-foreground mt-3">
              Extras this period: +{chartData.reduce((sum, d) => sum + (d.employee_youtube_extra || 0) + (d.employee_instagram_extra || 0), 0)}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

