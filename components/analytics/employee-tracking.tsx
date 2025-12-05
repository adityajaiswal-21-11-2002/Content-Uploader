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
  const [error, setError] = useState<string | null>(null)
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
    setError(null)
    try {
      // Fetch daily data
      const dailyResponse = await fetch(`/api/analytics/daily?days=${selectedDays}&employeeId=${selectedEmployee}`)
      if (dailyResponse.ok) {
        const daily = await dailyResponse.json()
        setDailyData(daily)
        console.log("Daily data loaded:", daily)
      } else {
        console.error("Failed to fetch daily data:", dailyResponse.status, dailyResponse.statusText)
      }

      // Fetch weekly data
      const weeklyResponse = await fetch(`/api/analytics/weekly?weeks=${selectedWeeks}&employeeId=${selectedEmployee}`)
      if (weeklyResponse.ok) {
        const weekly = await weeklyResponse.json()
        setWeeklyData(weekly)
        console.log("Weekly data loaded:", weekly)
      } else {
        console.error("Failed to fetch weekly data:", weeklyResponse.status, weeklyResponse.statusText)
      }

      // Fetch monthly data for multiple months
      const monthlyPromises = []
      const now = new Date()
      for (let i = 0; i < selectedMonths; i++) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
        monthlyPromises.push(
          fetch(`/api/analytics/monthly?employeeId=${selectedEmployee}&month=${monthStr}`)
            .then(async (r) => {
              if (r.ok) {
                const data = await r.json()
                console.log(`Monthly data for ${monthStr}:`, data)
                return data
              } else {
                console.error(`Failed to fetch monthly data for ${monthStr}:`, r.status, r.statusText)
                return null
              }
            })
            .catch((error) => {
              console.error(`Error fetching monthly data for ${monthStr}:`, error)
              return null
            })
        )
      }

      const monthlyResults = await Promise.all(monthlyPromises)
      const monthlyDataArray = monthlyResults
        .filter((result) => result && result.data)
        .map((result) => result.data?.[0] || null)
        .filter((item) => item !== null)
        .reverse() // Show oldest to newest
      setMonthlyData(monthlyDataArray)
      console.log("Monthly data array:", monthlyDataArray)
    } catch (error) {
      console.error("Error fetching tracking data:", error)
      setError("Failed to load tracking data. Please try again.")
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

  if (error) {
    return (
      <div className="text-center py-8 text-destructive">
        <p className="text-lg font-semibold mb-2">Error Loading Employee Tracking</p>
        <p>{error}</p>
        <button
          onClick={() => selectedEmployee && fetchData()}
          className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          Try Again
        </button>
      </div>
    )
  }

  // Prepare daily chart data
  const dailyChartData = dailyData?.data?.map((item: any) => ({
    date: item.date,
    dateLabel: item.date ? new Date(item.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "Unknown",
    youtube: (item.employee_youtube || 0) + (item.employee_youtube_extra || 0),
    instagram: (item.employee_instagram || 0) + (item.employee_instagram_extra || 0),
    total: (item.employee_youtube || 0) + (item.employee_instagram || 0) + (item.employee_youtube_extra || 0) + (item.employee_instagram_extra || 0),
  })) || []

  // Prepare weekly chart data
  const weeklyChartData = weeklyData?.data?.flatMap((week: any) => {
    if (!week?.employees) return []
    const empData = week.employees.find((e: any) => e.employee_id === selectedEmployee)
    if (!empData) return []
    return [{
      week: week.weekLabel || "Unknown Week",
      weekStart: week.weekStart,
      youtube: (empData.youtube_uploads || 0) + (empData.youtube_extra || 0),
      instagram: (empData.instagram_uploads || 0) + (empData.instagram_extra || 0),
      total: empData.total_uploads || 0,
    }]
  }) || []

  // Prepare monthly chart data
  const monthlyChartData = monthlyData?.map((item: any) => ({
    month: item.month || "Unknown",
    monthLabel: item.month
      ? new Date(item.month + "-01").toLocaleDateString("en-US", { month: "short", year: "numeric" })
      : "Unknown",
    youtube: item.total_youtube || 0,
    instagram: item.total_instagram || 0,
    total: item.total_uploads || 0,
  })) || []

  const selectedEmployeeName = employees.find((e) => e.id === selectedEmployee)?.name || "Employee"

  // Check if we have any data to display
  const hasData = dailyData || weeklyData || (monthlyData && monthlyData.length > 0)
  if (!hasData && !loading && !error) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p className="text-lg font-semibold mb-2">No Data Available</p>
        <p>Unable to load employee tracking data. Please check your connection and try again.</p>
        <button
          onClick={() => {
            if (selectedEmployee) fetchData()
            else fetchEmployees()
          }}
          className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          Retry
        </button>
      </div>
    )
  }

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

      {selectedEmployee && dailyData && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total YouTube</p>
                    <p className="text-2xl font-bold">{dailyData.summary?.total_youtube_uploads || 0}</p>
                    <p className="text-xs text-muted-foreground">
                      Extras: +{dailyData.summary?.extra_youtube_uploads || 0}
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
                    <p className="text-2xl font-bold">{dailyData.summary?.total_instagram_uploads || 0}</p>
                    <p className="text-xs text-muted-foreground">
                      Extras: +{dailyData.summary?.extra_instagram_uploads || 0}
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
                    <p className="text-2xl font-bold">{dailyData.summary?.total_uploads || 0}</p>
                    <p className="text-xs text-muted-foreground">
                      Extras overall: +
                      {(dailyData.summary?.extra_youtube_uploads || 0) + (dailyData.summary?.extra_instagram_uploads || 0)}
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
                    <p className="text-lg font-bold">{dailyData.summary?.total_days || 0} days</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
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
              {dailyChartData.length > 0 ? (
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
              ) : (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    <p>No daily data available for the selected period.</p>
                  </CardContent>
                </Card>
              )}

              {/* Daily Bar Chart */}
              {dailyChartData.length > 0 ? (
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
              ) : (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    <p>No daily breakdown data available.</p>
                  </CardContent>
                </Card>
              )}
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
              {weeklyChartData.length > 0 ? (
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
              ) : (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    <p>No weekly data available for the selected period.</p>
                  </CardContent>
                </Card>
              )}

              {/* Weekly Line Chart */}
              {weeklyChartData.length > 0 ? (
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
              ) : (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    <p>No weekly trend data available.</p>
                  </CardContent>
                </Card>
              )}
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

