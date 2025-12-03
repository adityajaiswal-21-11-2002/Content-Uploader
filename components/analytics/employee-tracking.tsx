"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Bar, BarChart, Line, LineChart, XAxis, YAxis, CartesianGrid, Legend } from "recharts"
import { Youtube, Instagram, Users } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LoadingLottie } from "@/components/ui/loading-lottie"

interface EmployeeTrackingProps {
  employeeId?: number
}

export default function EmployeeTracking({ employeeId }: EmployeeTrackingProps) {
  const [employees, setEmployees] = useState<any[]>([])
  const [selectedEmployee, setSelectedEmployee] = useState<number | null>(employeeId || null)
  const [dailyData, setDailyData] = useState<any>(null)
  const [weeklyData, setWeeklyData] = useState<any>(null)
  const [monthlyData, setMonthlyData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDays, setSelectedDays] = useState(30)
  const [selectedWeeks, setSelectedWeeks] = useState(8)
  const [selectedMonths, setSelectedMonths] = useState(6)

  useEffect(() => {
    fetchEmployees()
  }, [])

  useEffect(() => {
    if (selectedEmployee) {
      fetchData()
    }
  }, [selectedEmployee, selectedDays, selectedWeeks, selectedMonths])

  const fetchEmployees = async () => {
    try {
      const response = await fetch("/api/employees")
      if (response.ok) {
        const data = await response.json()
        setEmployees(data)
        if (!selectedEmployee && data.length > 0) {
          setSelectedEmployee(data[0].id)
        }
      }
    } catch (error) {
      console.error("Error fetching employees:", error)
    }
  }

  const fetchData = async () => {
    if (!selectedEmployee) return
    
    setLoading(true)
    try {
      // Fetch daily data
      const dailyResponse = await fetch(`/api/analytics/daily?days=${selectedDays}&employeeId=${selectedEmployee}`)
      if (dailyResponse.ok) {
        const daily = await dailyResponse.json()
        setDailyData(daily)
      }

      // Fetch weekly data
      const weeklyResponse = await fetch(`/api/analytics/weekly?weeks=${selectedWeeks}&employeeId=${selectedEmployee}`)
      if (weeklyResponse.ok) {
        const weekly = await weeklyResponse.json()
        setWeeklyData(weekly)
      }

      // Fetch monthly data for multiple months
      const monthlyPromises = []
      const now = new Date()
      for (let i = 0; i < selectedMonths; i++) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
        monthlyPromises.push(
          fetch(`/api/analytics/monthly?employeeId=${selectedEmployee}&month=${monthStr}`).then((r) => r.json())
        )
      }
      
      const monthlyResults = await Promise.all(monthlyPromises)
      const monthlyDataArray = monthlyResults
        .map((result) => result.data?.[0] || null)
        .filter((item) => item !== null)
        .reverse() // Show oldest to newest
      setMonthlyData(monthlyDataArray)
    } catch (error) {
      console.error("Error fetching tracking data:", error)
    } finally {
      setLoading(false)
    }
  }

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
  }

  if (loading && !dailyData) {
    return <LoadingLottie message="Loading employee tracking..." />
  }

  // Prepare daily chart data
  const dailyChartData = dailyData?.data?.map((item: any) => ({
    date: item.date,
    dateLabel: new Date(item.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    youtube: item.employee_youtube || 0,
    instagram: item.employee_instagram || 0,
    total: (item.employee_youtube || 0) + (item.employee_instagram || 0),
  })) || []

  // Prepare weekly chart data
  const weeklyChartData = weeklyData?.data?.flatMap((week: any) => {
    const empData = week.employees.find((e: any) => e.employee_id === selectedEmployee)
    if (!empData) return []
    return [{
      week: week.weekLabel,
      weekStart: week.weekStart,
      youtube: empData.youtube_uploads,
      instagram: empData.instagram_uploads,
      total: empData.total_uploads,
    }]
  }) || []

  // Prepare monthly chart data
  const monthlyChartData = monthlyData?.map((item: any) => ({
    month: item.month || item.total_youtube || "Unknown",
    monthLabel: item.month
      ? new Date(item.month + "-01").toLocaleDateString("en-US", { month: "short", year: "numeric" })
      : "Unknown",
    youtube: item.total_youtube || 0,
    instagram: item.total_instagram || 0,
    total: item.total_uploads || 0,
  })) || []

  const selectedEmployeeName = employees.find((e) => e.id === selectedEmployee)?.name || "Employee"

  return (
    <div className="space-y-6">
      {/* Employee Selector */}
      {!employeeId && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm font-medium">Select Employee:</span>
              </div>
              <Select
                value={selectedEmployee?.toString() || ""}
                onValueChange={(v) => setSelectedEmployee(Number.parseInt(v))}
              >
                <SelectTrigger className="w-full md:w-[250px]">
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id.toString()}>
                      {emp.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {selectedEmployee && (
        <Tabs defaultValue="daily" className="space-y-6">
          <TabsList className="flex flex-wrap gap-2 sm:grid sm:grid-cols-3">
            <TabsTrigger value="daily">Daily Tracking</TabsTrigger>
            <TabsTrigger value="weekly">Weekly Tracking</TabsTrigger>
            <TabsTrigger value="monthly">Monthly Tracking</TabsTrigger>
          </TabsList>

          {/* Daily Tracking */}
          <TabsContent value="daily">
            <div className="space-y-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Select value={selectedDays.toString()} onValueChange={(v) => setSelectedDays(Number.parseInt(v))}>
                  <SelectTrigger className="w-full sm:w-[150px]">
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
                  Tracking for <span className="font-semibold">{selectedEmployeeName}</span>
                </div>
              </div>

              {/* Daily Line Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Daily Upload Activity</CardTitle>
                  <CardDescription>Daily uploads for {selectedEmployeeName} - Instagram & YouTube</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-[260px] sm:h-[360px] lg:h-[420px]">
                    <LineChart data={dailyChartData}>
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

              {/* Daily Bar Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Daily Upload Breakdown</CardTitle>
                  <CardDescription>YouTube and Instagram uploads by day</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-[260px] sm:h-[360px] lg:h-[420px]">
                    <BarChart data={dailyChartData}>
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
                      <Bar dataKey="youtube" fill="#ef4444" name="YouTube" />
                      <Bar dataKey="instagram" fill="#ec4899" name="Instagram" />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Weekly Tracking */}
          <TabsContent value="weekly">
            <div className="space-y-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Select value={selectedWeeks.toString()} onValueChange={(v) => setSelectedWeeks(Number.parseInt(v))}>
                  <SelectTrigger className="w-full sm:w-[150px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="4">Last 4 weeks</SelectItem>
                    <SelectItem value="8">Last 8 weeks</SelectItem>
                    <SelectItem value="12">Last 12 weeks</SelectItem>
                    <SelectItem value="16">Last 16 weeks</SelectItem>
                  </SelectContent>
                </Select>
                <div className="text-sm text-muted-foreground">
                  Weekly tracking for <span className="font-semibold">{selectedEmployeeName}</span>
                </div>
              </div>

              {/* Weekly Bar Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Weekly Upload Activity</CardTitle>
                  <CardDescription>Weekly uploads for {selectedEmployeeName} - Instagram & YouTube</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-[260px] sm:h-[360px] lg:h-[420px]">
                    <BarChart data={weeklyChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="week"
                        angle={-45}
                        textAnchor="end"
                        height={100}
                        tick={{ fontSize: 10 }}
                      />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Legend />
                      <Bar dataKey="youtube" fill="#ef4444" name="YouTube" />
                      <Bar dataKey="instagram" fill="#ec4899" name="Instagram" />
                      <Bar dataKey="total" fill="#3b82f6" name="Total" />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              {/* Weekly Line Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Weekly Upload Trends</CardTitle>
                  <CardDescription>Trend over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-[260px] sm:h-[360px] lg:h-[420px]">
                    <LineChart data={weeklyChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="week"
                        angle={-45}
                        textAnchor="end"
                        height={100}
                        tick={{ fontSize: 10 }}
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
            </div>
          </TabsContent>

          {/* Monthly Tracking */}
          <TabsContent value="monthly">
            <div className="space-y-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Select value={selectedMonths.toString()} onValueChange={(v) => setSelectedMonths(Number.parseInt(v))}>
                  <SelectTrigger className="w-full sm:w-[150px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">Last 3 months</SelectItem>
                    <SelectItem value="6">Last 6 months</SelectItem>
                    <SelectItem value="12">Last 12 months</SelectItem>
                  </SelectContent>
                </Select>
                <div className="text-sm text-muted-foreground">
                  Monthly tracking for <span className="font-semibold">{selectedEmployeeName}</span>
                </div>
              </div>

              {/* Monthly Bar Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Monthly Upload Activity</CardTitle>
                  <CardDescription>Monthly uploads for {selectedEmployeeName} - Instagram & YouTube</CardDescription>
                </CardHeader>
                <CardContent>
                  {monthlyChartData.length > 0 ? (
                    <ChartContainer config={chartConfig} className="h-[260px] sm:h-[360px] lg:h-[420px]">
                      <BarChart data={monthlyChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="monthLabel"
                          angle={-45}
                          textAnchor="end"
                          height={100}
                          tick={{ fontSize: 10 }}
                        />
                        <YAxis />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Legend />
                        <Bar dataKey="youtube" fill="#ef4444" name="YouTube" />
                        <Bar dataKey="instagram" fill="#ec4899" name="Instagram" />
                        <Bar dataKey="total" fill="#3b82f6" name="Total" />
                      </BarChart>
                    </ChartContainer>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No monthly data available for this period.
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Monthly Line Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Monthly Upload Trends</CardTitle>
                  <CardDescription>Trend over time</CardDescription>
                </CardHeader>
                <CardContent>
                  {monthlyChartData.length > 0 ? (
                    <ChartContainer config={chartConfig} className="h-[260px] sm:h-[360px] lg:h-[420px]">
                      <LineChart data={monthlyChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="monthLabel"
                          angle={-45}
                          textAnchor="end"
                          height={100}
                          tick={{ fontSize: 10 }}
                        />
                        <YAxis />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Legend />
                        <Line type="monotone" dataKey="youtube" stroke="#ef4444" name="YouTube" strokeWidth={2} />
                        <Line type="monotone" dataKey="instagram" stroke="#ec4899" name="Instagram" strokeWidth={2} />
                        <Line type="monotone" dataKey="total" stroke="#3b82f6" name="Total" strokeWidth={2} />
                      </LineChart>
                    </ChartContainer>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No monthly data available for this period.
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}

