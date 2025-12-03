"use client"

import { getRequiredQuota } from "@/lib/helpers"
import { CheckCircle2, Circle, AlertCircle, Instagram, Youtube } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

export default function DailyComplianceTable({ complianceData }: any) {
  if (!Array.isArray(complianceData) || complianceData.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No compliance data available. Please ensure the database is configured.</p>
      </div>
    )
  }

  return (
    <>
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
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
                      <span className={instaStatus === "done" ? "text-green-700 dark:text-green-300" : instaRequired ? "text-red-700 dark:text-red-300" : "text-muted-foreground"}>
                        {instaRequired ? (instaStatus === "done" ? "Done" : "Pending") : "N/A"}
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
                      <span className={youtubeStatus === "done" ? "text-green-700 dark:text-green-300" : youtubeRequired ? "text-red-700 dark:text-red-300" : "text-muted-foreground"}>
                        {youtubeRequired ? (youtubeStatus === "done" ? "Done" : "Pending") : "N/A"}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                      isOk ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                    }`}>
                      {isOk ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                      {isOk ? "Compliant" : "Not Compliant"}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
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
            <Card key={data.employee.id} className="w-full">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-foreground">{data.employee.name}</h3>
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                    isOk ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                  }`}>
                    {isOk ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                    {isOk ? "OK" : "Missed"}
                  </span>
                </div>

                <div className="space-y-3">
                  {instaRequired && (
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${instaStatus === "done" ? "bg-pink-100 dark:bg-pink-900/30" : "bg-gray-100 dark:bg-gray-800/30"}`}>
                          <Instagram className={`w-4 h-4 ${instaStatus === "done" ? "text-pink-600" : "text-pink-400"}`} />
                        </div>
                        <span className="font-medium">Instagram</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {instaStatus === "done" ? (
                          <CheckCircle2 className="w-5 h-5 text-green-500" />
                        ) : (
                          <Circle className="w-5 h-5 text-red-500" />
                        )}
                        <span className={`text-sm font-medium ${instaStatus === "done" ? "text-green-700 dark:text-green-300" : "text-red-700 dark:text-red-300"}`}>
                          {instaStatus === "done" ? "Done" : "Pending"}
                        </span>
                      </div>
                    </div>
                  )}

                  {youtubeRequired && (
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${youtubeStatus === "done" ? "bg-red-100 dark:bg-red-900/30" : "bg-gray-100 dark:bg-gray-800/30"}`}>
                          <Youtube className={`w-4 h-4 ${youtubeStatus === "done" ? "text-red-600" : "text-red-400"}`} />
                        </div>
                        <span className="font-medium">YouTube</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {youtubeStatus === "done" ? (
                          <CheckCircle2 className="w-5 h-5 text-green-500" />
                        ) : (
                          <Circle className="w-5 h-5 text-red-500" />
                        )}
                        <span className={`text-sm font-medium ${youtubeStatus === "done" ? "text-green-700 dark:text-green-300" : "text-red-700 dark:text-red-300"}`}>
                          {youtubeStatus === "done" ? "Done" : "Pending"}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </>
  )
}
