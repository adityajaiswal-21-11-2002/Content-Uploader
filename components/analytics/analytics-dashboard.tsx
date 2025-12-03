"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import MonthlyAnalytics from "./monthly-analytics"
import DailyAnalytics from "./daily-analytics"
import EmployeeTracking from "./employee-tracking"
import AllEmployeesOverview from "./all-employees-overview"

export default function AnalyticsDashboard() {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">All Employees</TabsTrigger>
          <TabsTrigger value="daily">Daily Analytics</TabsTrigger>
          <TabsTrigger value="monthly">Monthly Analytics</TabsTrigger>
          <TabsTrigger value="tracking">Employee Tracking</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <AllEmployeesOverview />
        </TabsContent>

        <TabsContent value="daily">
          <DailyAnalytics />
        </TabsContent>

        <TabsContent value="monthly">
          <MonthlyAnalytics />
        </TabsContent>

        <TabsContent value="tracking">
          <EmployeeTracking />
        </TabsContent>
      </Tabs>
    </div>
  )
}

