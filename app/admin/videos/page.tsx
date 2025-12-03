"use client"

import UploadedVideosTable from "@/components/admin/uploaded-videos-table"
import { ResponsiveNavLayout } from "@/components/responsive-nav-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Calendar, Award, BarChart3, Video } from "lucide-react"

export default function UploadedVideosPage() {
  const navItems = [
    {
      title: "Daily Compliance",
      url: "/admin",
      icon: FileText,
    },
    {
      title: "Weekly Compliance",
      url: "/admin/weekly",
      icon: Calendar,
    },
    {
      title: "Monthly Awards",
      url: "/admin/monthly",
      icon: Award,
    },
    {
      title: "Analytics",
      url: "/admin/analytics",
      icon: BarChart3,
    },
    {
      title: "Uploaded Videos",
      url: "/admin/videos",
      icon: Video,
    },
  ]

  return (
    <ResponsiveNavLayout
      navItems={navItems}
      showBackToMain={true}
      title="Uploaded Videos"
      subtitle="View all uploaded videos with links"
    >
      <Card>
        <CardHeader>
          <CardTitle>Uploaded Videos</CardTitle>
          <CardDescription>View all uploaded videos with links for each employee</CardDescription>
        </CardHeader>
        <CardContent>
          <UploadedVideosTable />
        </CardContent>
      </Card>
    </ResponsiveNavLayout>
  )
}
