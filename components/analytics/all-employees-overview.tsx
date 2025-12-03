"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Bar, BarChart, Line, LineChart, XAxis, YAxis, CartesianGrid, Legend } from "recharts"
import { Youtube, Instagram, Users, TrendingUp } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { LoadingLottie } from "@/components/ui/loading-lottie"

interface AllEmployeesOverviewProps {
  view?: "daily" | "weekly" | "monthly"
}

export default function AllEmployeesOverview({ view = "daily" }: AllEmployeesOverviewProps) {
  const [employees, setEmployees] = useState<any[]>([])
  const [dailyData, setDailyData] = useState<any>(null)
  const [weeklyData, setWeeklyData] = useState<any>(null)
  const [monthlyData, setMonthlyData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selectedDays, setSelectedDays] = useState(30)
  const [selectedWeeks, setSelectedWeeks] = useState(8)
  // Use a non-empty sentinel value for the "current month" option so that
  // the underlying Select implementation never receives an empty string.
  const [selectedMonth, setSelectedMonth] = useState("current")

  useEffect(() => {
    fetchData()
  }, [selectedDays, selectedWeeks, selectedMonth])

  const fetchData = async () => {
    setLoading(true)
    try {
      // Fetch employees
      const empResponse = await fetch("/api/employees")
      if (empResponse.ok) {
        const empData = await empResponse.json()
        setEmployees(empData)
      }

      // Fetch daily data for all employees
      const dailyResponse = await fetch(`/api/analytics/employees-daily?days=${selectedDays}`)
      if (dailyResponse.ok) {
        const daily = await dailyResponse.json()
        setDailyData(daily)
      }

      // Fetch weekly data for all employees
      const weeklyResponse = await fetch(`/api/analytics/employees-weekly?weeks=${selectedWeeks}`)
      if (weeklyResponse.ok) {
        const weekly = await weeklyResponse.json()
        setWeeklyData(weekly)
      }

      // Fetch monthly data
      const monthParam =
        selectedMonth && selectedMonth !== "current" ? `?month=${selectedMonth}` : ""
      const monthlyUrl = `/api/analytics/monthly${monthParam}`
      const monthlyResponse = await fetch(monthlyUrl)
      if (monthlyResponse.ok) {
        const monthly = await monthlyResponse.json()
        setMonthlyData(monthly)
      }
    } catch (error) {
      console.error("Error fetching overview data:", error)
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
    return <LoadingLottie message="Loading employee overview..." />
  }

  // Prepare daily comparison data
  const dailyComparisonData = dailyData?.employees?.map((emp: any) => ({
    name: emp.employee_name.length > 15 ? emp.employee_name.substring(0, 15) + "..." : emp.employee_name,
    fullName: emp.employee_name,
    youtube: emp.youtube_uploads || 0,
    instagram: emp.instagram_uploads || 0,
    total: emp.total_uploads || 0,
    avgPerDay: emp.avg_per_day || "0",
  })) || []

  // Prepare weekly comparison data
  const weeklyComparisonData = weeklyData?.employees?.map((emp: any) => ({
    name: emp.employee_name.length > 15 ? emp.employee_name.substring(0, 15) + "..." : emp.employee_name,
    fullName: emp.employee_name,
    youtube: emp.youtube_uploads || 0,
    instagram: emp.instagram_uploads || 0,
    total: emp.total_uploads || 0,
    avgPerWeek: emp.avg_per_week || "0",
  })) || []

  // Prepare monthly comparison data
  const monthlyComparisonData = monthlyData?.data?.map((item: any) => ({
    name: item.employee_name.length > 15 ? item.employee_name.substring(0, 15) + "..." : item.employee_name,
    fullName: item.employee_name,
    youtube: item.total_youtube || 0,
    instagram: item.total_instagram || 0,
    total: item.total_uploads || 0,
    compliant: item.fully_compliant,
  })) || []

  return (
    <div className="space-y-6">
      <Tabs defaultValue={view} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="daily">Daily Overview</TabsTrigger>
          <TabsTrigger value="weekly">Weekly Overview</TabsTrigger>
          <TabsTrigger value="monthly">Monthly Overview</TabsTrigger>
        </TabsList>

        {/* Daily Overview */}
        <TabsContent value="daily">
          <div className="space-y-6">
            <div className="flex items-center gap-4">
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
                Showing all {employees.length} employees
              </div>
            </div>

            {/* Daily Comparison Chart */}
            <Card>
              <CardHeader>
                <CardTitle>All Employees - Daily Upload Comparison</CardTitle>
                <CardDescription>Total uploads per employee over the selected period</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[500px]">
                  <BarChart data={dailyComparisonData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 12 }} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend />
                    <Bar dataKey="youtube" fill="#ef4444" name="YouTube" />
                    <Bar dataKey="instagram" fill="#ec4899" name="Instagram" />
                    <Bar dataKey="total" fill="#3b82f6" name="Total" />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Daily Table */}
            <Card>
              <CardHeader>
                <CardTitle>Daily Upload Summary</CardTitle>
                <CardDescription>Detailed breakdown for each employee</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left py-3 px-4 font-semibold text-foreground">Employee</th>
                        <th className="text-center py-3 px-4 font-semibold text-foreground">
                          <Youtube className="w-4 h-4 inline text-red-500 mr-1" />
                          YouTube
                        </th>
                        <th className="text-center py-3 px-4 font-semibold text-foreground">
                          <Instagram className="w-4 h-4 inline text-pink-500 mr-1" />
                          Instagram
                        </th>
                        <th className="text-center py-3 px-4 font-semibold text-foreground">
                          <TrendingUp className="w-4 h-4 inline text-blue-500 mr-1" />
                          Total
                        </th>
                        <th className="text-center py-3 px-4 font-semibold text-foreground">Avg/Day</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dailyComparisonData.map((emp, idx) => {
                        return (
                          <tr key={idx} className="border-b border-border hover:bg-muted/50">
                            <td className="py-3 px-4 font-medium text-foreground">{emp.fullName}</td>
                            <td className="py-3 px-4 text-center">
                              <span className="font-semibold text-red-500">{emp.youtube}</span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className="font-semibold text-pink-500">{emp.instagram}</span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className="font-bold text-foreground">{emp.total}</span>
                            </td>
                            <td className="py-3 px-4 text-center text-muted-foreground">{emp.avgPerDay}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Weekly Overview */}
        <TabsContent value="weekly">
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <Select value={selectedWeeks.toString()} onValueChange={(v) => setSelectedWeeks(Number.parseInt(v))}>
                <SelectTrigger className="w-[150px]">
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
                Showing all {employees.length} employees
              </div>
            </div>

            {/* Weekly Comparison Chart */}
            <Card>
              <CardHeader>
                <CardTitle>All Employees - Weekly Upload Comparison</CardTitle>
                <CardDescription>Total uploads per employee over the selected weeks</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[500px]">
                  <BarChart data={weeklyComparisonData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 12 }} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend />
                    <Bar dataKey="youtube" fill="#ef4444" name="YouTube" />
                    <Bar dataKey="instagram" fill="#ec4899" name="Instagram" />
                    <Bar dataKey="total" fill="#3b82f6" name="Total" />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Weekly Table */}
            <Card>
              <CardHeader>
                <CardTitle>Weekly Upload Summary</CardTitle>
                <CardDescription>Detailed breakdown for each employee</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left py-3 px-4 font-semibold text-foreground">Employee</th>
                        <th className="text-center py-3 px-4 font-semibold text-foreground">
                          <Youtube className="w-4 h-4 inline text-red-500 mr-1" />
                          YouTube
                        </th>
                        <th className="text-center py-3 px-4 font-semibold text-foreground">
                          <Instagram className="w-4 h-4 inline text-pink-500 mr-1" />
                          Instagram
                        </th>
                        <th className="text-center py-3 px-4 font-semibold text-foreground">
                          <TrendingUp className="w-4 h-4 inline text-blue-500 mr-1" />
                          Total
                        </th>
                        <th className="text-center py-3 px-4 font-semibold text-foreground">Avg/Week</th>
                      </tr>
                    </thead>
                    <tbody>
                      {weeklyComparisonData.map((emp, idx) => (
                        <tr key={idx} className="border-b border-border hover:bg-muted/50">
                          <td className="py-3 px-4 font-medium text-foreground">{emp.fullName}</td>
                          <td className="py-3 px-4 text-center">
                            <span className="font-semibold text-red-500">{emp.youtube}</span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="font-semibold text-pink-500">{emp.instagram}</span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="font-bold text-foreground">{emp.total}</span>
                          </td>
                          <td className="py-3 px-4 text-center text-muted-foreground">{emp.avgPerWeek}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Monthly Overview */}
        <TabsContent value="monthly">
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select month" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="current">Current Month</SelectItem>
                  {Array.from({ length: 6 }, (_, i) => {
                    const date = new Date()
                    date.setMonth(date.getMonth() - i)
                    const monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
                    const monthLabel = date.toLocaleDateString("en-US", { month: "long", year: "numeric" })
                    return (
                      <SelectItem key={monthStr} value={monthStr}>
                        {monthLabel}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
              <div className="text-sm text-muted-foreground">
                Showing all {employees.length} employees
              </div>
            </div>

            {/* Monthly Comparison Chart */}
            <Card>
              <CardHeader>
                <CardTitle>All Employees - Monthly Upload Comparison</CardTitle>
                <CardDescription>Total uploads per employee for the selected month</CardDescription>
              </CardHeader>
              <CardContent>
                {monthlyComparisonData.length > 0 ? (
                  <ChartContainer config={chartConfig} className="h-[500px]">
                    <BarChart data={monthlyComparisonData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 12 }} />
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

            {/* Monthly Table */}
            <Card>
              <CardHeader>
                <CardTitle>Monthly Upload Summary</CardTitle>
                <CardDescription>Detailed breakdown with compliance status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left py-3 px-4 font-semibold text-foreground">Employee</th>
                        <th className="text-center py-3 px-4 font-semibold text-foreground">
                          <Youtube className="w-4 h-4 inline text-red-500 mr-1" />
                          YouTube
                        </th>
                        <th className="text-center py-3 px-4 font-semibold text-foreground">
                          <Instagram className="w-4 h-4 inline text-pink-500 mr-1" />
                          Instagram
                        </th>
                        <th className="text-center py-3 px-4 font-semibold text-foreground">
                          <TrendingUp className="w-4 h-4 inline text-blue-500 mr-1" />
                          Total
                        </th>
                        <th className="text-center py-3 px-4 font-semibold text-foreground">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {monthlyComparisonData.map((emp, idx) => {
                        const monthlyItem = monthlyData?.data?.find((e: any) => e.employee_name === emp.fullName)
                        return (
                          <tr key={idx} className="border-b border-border hover:bg-muted/50">
                            <td className="py-3 px-4 font-medium text-foreground">{emp.fullName}</td>
                            <td className="py-3 px-4 text-center">
                              <span className="font-semibold text-red-500">{emp.youtube}</span>
                              {monthlyItem && (
                                <span className="text-xs text-muted-foreground block">
                                  Req: {monthlyItem.required_youtube}
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className="font-semibold text-pink-500">{emp.instagram}</span>
                              {monthlyItem && (
                                <span className="text-xs text-muted-foreground block">
                                  Req: {monthlyItem.required_instagram}
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className="font-bold text-foreground">{emp.total}</span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              {monthlyItem?.fully_compliant ? (
                                <Badge className="bg-green-500">Compliant</Badge>
                              ) : (
                                <Badge variant="destructive">Non-Compliant</Badge>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

