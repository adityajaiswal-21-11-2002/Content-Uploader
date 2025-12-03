"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Bar, BarChart, Line, LineChart, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer, Cell } from "recharts"
import { Youtube, Instagram, TrendingUp } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface MonthlyAnalyticsProps {
  employeeId?: number
  month?: string
}

export default function MonthlyAnalytics({ employeeId, month }: MonthlyAnalyticsProps) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState(month || "")

  useEffect(() => {
    const fetchData = async () => {
      try {
        const url = `/api/analytics/monthly${employeeId ? `?employeeId=${employeeId}` : ""}${selectedMonth ? `&month=${selectedMonth}` : ""}`
        const response = await fetch(url)
        if (response.ok) {
          const result = await response.json()
          setData(result)
        }
      } catch (error) {
        console.error("Error fetching monthly analytics:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [employeeId, selectedMonth])

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Loading analytics...</div>
  }

  if (!data || !data.data || data.data.length === 0) {
    return <div className="text-center py-8 text-muted-foreground">No data available for this month.</div>
  }

  // Prepare data for charts
  const barChartData = data.data.map((item: any) => ({
    name: item.employee_name.length > 15 ? item.employee_name.substring(0, 15) + "..." : item.employee_name,
    fullName: item.employee_name,
    YouTube: item.youtube_uploads,
    Instagram: item.instagram_uploads,
    Total: item.total_uploads,
    "Required YT": item.required_youtube,
    "Required IG": item.required_instagram,
  }))

  const comparisonData = data.data.map((item: any) => ({
    name: item.employee_name.length > 15 ? item.employee_name.substring(0, 15) + "..." : item.employee_name,
    fullName: item.employee_name,
    "Uploaded YT": item.youtube_uploads,
    "Missed YT": Math.max(0, item.required_youtube - item.youtube_uploads),
    "Uploaded IG": item.instagram_uploads,
    "Missed IG": Math.max(0, item.required_instagram - item.instagram_uploads),
    compliant: item.insta_compliant && item.youtube_compliant,
  }))

  const chartConfig = {
    YouTube: {
      label: "YouTube",
      color: "#ef4444",
    },
    Instagram: {
      label: "Instagram",
      color: "#ec4899",
    },
    Total: {
      label: "Total",
      color: "#3b82f6",
    },
    "Required YT": {
      label: "Required YouTube",
      color: "#fbbf24",
    },
    "Required IG": {
      label: "Required Instagram",
      color: "#f472b6",
    },
    "Uploaded YT": {
      label: "Uploaded YouTube",
      color: "#22c55e",
    },
    "Missed YT": {
      label: "Missed YouTube",
      color: "#ef4444",
    },
    "Uploaded IG": {
      label: "Uploaded Instagram",
      color: "#22c55e",
    },
    "Missed IG": {
      label: "Missed Instagram",
      color: "#ef4444",
    },
  }

  // Generate month options (last 6 months)
  const monthOptions = []
  const now = new Date()
  for (let i = 0; i < 6; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
    const monthLabel = date.toLocaleDateString("en-US", { month: "long", year: "numeric" })
    monthOptions.push({ value: monthStr, label: monthLabel })
  }

  return (
    <div className="space-y-6">
      {/* Month Selector */}
      <div className="flex items-center gap-2">
        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select month" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Current Month</SelectItem>
            {monthOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="text-sm text-muted-foreground">
          {data.summary.total_employees} employees • {data.summary.compliant_employees} compliant
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
              </div>
              <TrendingUp className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Compliant</p>
                <p className="text-2xl font-bold">{data.summary.compliant_employees}</p>
                <p className="text-xs text-muted-foreground">
                  / {data.summary.total_employees} employees
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Total Uploads Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Uploads by Employee</CardTitle>
          <CardDescription>Total uploads for {data.month}</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[400px]">
            <BarChart data={barChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="name"
                angle={-45}
                textAnchor="end"
                height={100}
                tick={{ fontSize: 12 }}
              />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Legend />
              <Bar dataKey="YouTube" fill="#ef4444" />
              <Bar dataKey="Instagram" fill="#ec4899" />
              <Bar dataKey="Total" fill="#3b82f6" />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Uploaded vs Missed Comparison Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Uploaded vs Missed - YouTube</CardTitle>
          <CardDescription>Who uploaded and who missed YouTube videos</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[400px]">
            <BarChart data={comparisonData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 12 }} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Legend />
              <Bar dataKey="Uploaded YT" stackId="a" fill="#22c55e" />
              <Bar dataKey="Missed YT" stackId="a" fill="#ef4444" />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Uploaded vs Missed Instagram */}
      <Card>
        <CardHeader>
          <CardTitle>Uploaded vs Missed - Instagram</CardTitle>
          <CardDescription>Who uploaded and who missed Instagram posts</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[400px]">
            <BarChart data={comparisonData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 12 }} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Legend />
              <Bar dataKey="Uploaded IG" stackId="b" fill="#22c55e" />
              <Bar dataKey="Missed IG" stackId="b" fill="#ef4444" />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Compliance Status Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Compliance Status</CardTitle>
          <CardDescription>Employees meeting requirements vs not meeting</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px]">
            <BarChart data={comparisonData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="name"
                angle={-45}
                textAnchor="end"
                height={100}
                tick={{ fontSize: 12 }}
              />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Legend />
              <Bar dataKey="Uploaded YT" fill="#22c55e" />
              <Bar dataKey="Uploaded IG" fill="#22c55e" />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )
}

