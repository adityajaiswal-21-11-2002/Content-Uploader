"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import MonthlyAnalytics from "./monthly-analytics"
import DailyAnalytics from "./daily-analytics"
import EmployeeTracking from "./employee-tracking"
import AllEmployeesOverview from "./all-employees-overview"
import DailyLinksTable from "./daily-links-table"

export default function AnalyticsDashboard() {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">All Employees</TabsTrigger>
          <TabsTrigger value="daily">Daily Analytics</TabsTrigger>
          <TabsTrigger value="monthly">Monthly Analytics</TabsTrigger>
          <TabsTrigger value="links">Daily Links</TabsTrigger>
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

        <TabsContent value="links">
          <DailyLinksTable />
        </TabsContent>

        <TabsContent value="tracking">
          <EmployeeTracking />
        </TabsContent>
      </Tabs>
    </div>
  )
}

