"use client"

import { getRequiredQuota } from "@/lib/helpers"
import { CheckCircle2, Circle, AlertCircle } from "lucide-react"

export default function DailyComplianceTable({ complianceData }: any) {
  if (!Array.isArray(complianceData) || complianceData.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No compliance data available. Please ensure the database is configured.</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-3 px-4 font-semibold text-foreground">Employee</th>
            <th className="text-left py-3 px-4 font-semibold text-foreground">Instagram</th>
            <th className="text-left py-3 px-4 font-semibold text-foreground">YouTube</th>
            <th className="text-left py-3 px-4 font-semibold text-foreground">Status</th>
          </tr>
        </thead>
        <tbody>
          {complianceData.map((data: any) => {
            const quota = getRequiredQuota(data.employee.role)
            const instaRequired = quota.insta > 0
            const youtubeRequired = quota.youtube > 0

            const instaStatus = data.dailyUpload?.insta_done ? "done" : "pending"
            const youtubeStatus = data.dailyUpload?.youtube_done ? "done" : "pending"

            const requiredInstaOk = !instaRequired || instaStatus === "done"
            const requiredYoutubeOk = !youtubeRequired || youtubeStatus === "done"
            const isOk = requiredInstaOk && requiredYoutubeOk

            return (
              <tr key={data.employee.id} className="border-b border-border hover:bg-muted/50">
                <td className="py-3 px-4 font-medium text-foreground">{data.employee.name}</td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    {instaStatus === "done" ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    ) : instaRequired ? (
                      <Circle className="w-5 h-5 text-red-500" />
                    ) : (
                      <Circle className="w-5 h-5 text-gray-400" />
                    )}
                    <span className="text-xs text-muted-foreground">
                      {instaRequired ? (instaStatus === "done" ? "Done" : "Pending") : "Optional"}
                    </span>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    {youtubeStatus === "done" ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    ) : youtubeRequired ? (
                      <Circle className="w-5 h-5 text-red-500" />
                    ) : (
                      <Circle className="w-5 h-5 text-gray-400" />
                    )}
                    <span className="text-xs text-muted-foreground">
                      {youtubeRequired ? (youtubeStatus === "done" ? "Done" : "Pending") : "Optional"}
                    </span>
                  </div>
                </td>
                <td className="py-3 px-4">
                  {isOk ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold">
                      <CheckCircle2 className="w-4 h-4" /> Compliant
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-100 text-red-700 text-xs font-semibold">
                      <AlertCircle className="w-4 h-4" /> Missed
                    </span>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
