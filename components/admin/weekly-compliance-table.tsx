"use client"

import { useState, useEffect } from "react"
import { CheckCircle2, AlertCircle, Mail, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "sonner"
import { LoadingLottie } from "@/components/ui/loading-lottie"

export default function WeeklyComplianceTable({ employees }: { employees: any[] }) {
  const [weekSummary, setWeekSummary] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [sendingAlerts, setSendingAlerts] = useState<Set<number>>(new Set())

  useEffect(() => {
    fetchWeekSummary()
  }, [])

  const fetchWeekSummary = async () => {
    try {
      const response = await fetch("/api/uploads/week-summary")
      if (response.ok) {
        const data = await response.json()
        setWeekSummary(data)
      }
    } catch (error) {
      console.error("Error fetching week summary:", error)
      toast.error("Failed to load weekly summary")
    } finally {
      setLoading(false)
    }
  }

  const handleSendAlert = async (employeeId: number, employeeName: string) => {
    setSendingAlerts((prev) => new Set(prev).add(employeeId))
    try {
      const response = await fetch("/api/email/send-alert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employee_id: employeeId }),
      })

      if (!response.ok) {
        throw new Error("Failed to send alert")
      }

      toast.success(`Alert sent to ${employeeName}`)
    } catch (error) {
      console.error("Error sending alert:", error)
      toast.error("Failed to send alert email")
    } finally {
      setSendingAlerts((prev) => {
        const next = new Set(prev)
        next.delete(employeeId)
        return next
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ok":
        return "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
      case "missed":
        return "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
      case "pending":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300"
    }
  }

  const getProgressColor = (uploaded: number, required: number) => {
    const percentage = required > 0 ? (uploaded / required) * 100 : 0
    if (percentage >= 100) return "text-green-600 dark:text-green-400"
    if (percentage >= 70) return "text-yellow-600 dark:text-yellow-400"
    return "text-red-600 dark:text-red-400"
  }

  if (loading) {
    return <LoadingLottie message="Loading weekly summary..." />
  }

  if (!weekSummary || !weekSummary.summary || weekSummary.summary.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No weekly data available yet.</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <LoadingLottie message="Loading weekly summary..." />
      </div>
    )
  }

  if (!weekSummary) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>Unable to load weekly summary. Please try again later.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground text-center md:text-left">
        Week: {weekSummary.week_start} to {weekSummary.week_end}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 px-4 font-semibold text-foreground">Employee</th>
              <th className="text-center py-3 px-4 font-semibold text-foreground">YouTube</th>
              <th className="text-center py-3 px-4 font-semibold text-foreground">Instagram</th>
              <th className="text-center py-3 px-4 font-semibold text-foreground">Status</th>
              <th className="text-center py-3 px-4 font-semibold text-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {weekSummary.summary.map((item: any) => {
              const isCompliant = item.status === "ok"
              const isMissed = item.status === "missed"

              return (
                <tr
                  key={item.employee_id}
                  className={`border-b border-border hover:bg-muted/50 ${
                    isMissed ? "bg-red-50/50 dark:bg-red-950/10" : isCompliant ? "bg-green-50/50 dark:bg-green-950/10" : ""
                  }`}
                >
                  <td className="py-3 px-4 font-medium text-foreground">{item.employee_name}</td>
                  <td className="py-3 px-4">
                    <div className="text-center">
                      <span className={`font-semibold ${getProgressColor(item.yt_uploaded, item.yt_required)}`}>
                        {item.yt_uploaded}/{item.yt_required}
                      </span>
                      {item.yt_uploaded < item.yt_required && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Missing {item.yt_required - item.yt_uploaded}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-center">
                      <span className={`font-semibold ${getProgressColor(item.insta_uploaded, item.insta_required)}`}>
                        {item.insta_uploaded}/{item.insta_required}
                      </span>
                      {item.insta_uploaded < item.insta_required && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Missing {item.insta_required - item.insta_uploaded}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex justify-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(item.status)}`}>
                        {item.status === "ok" && <CheckCircle2 className="w-4 h-4" />}
                        {item.status === "missed" && <AlertCircle className="w-4 h-4" />}
                        {item.status === "pending" && <AlertCircle className="w-4 h-4" />}
                        {item.status === "ok" ? "Good" : item.status === "missed" ? "Missing" : "Pending"}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex justify-center">
                      {isMissed && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSendAlert(item.employee_id, item.employee_name)}
                          disabled={sendingAlerts.has(item.employee_id)}
                        >
                          {sendingAlerts.has(item.employee_id) ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Sending...
                            </>
                          ) : (
                            <>
                              <Mail className="w-4 h-4 mr-2" />
                              Send Alert
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {weekSummary.summary.map((item: any) => {
          const isCompliant = item.status === "ok"
          const isMissed = item.status === "missed"
          const isPending = item.status === "pending"

          return (
            <Card key={item.employee_id} className={`w-full ${
              isMissed ? "border-red-200 dark:border-red-800" :
              isCompliant ? "border-green-200 dark:border-green-800" : ""
            }`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-foreground">{item.employee_name}</h3>
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(item.status)}`}>
                    {item.status === "ok" && <CheckCircle2 className="w-3 h-3" />}
                    {item.status === "missed" && <AlertCircle className="w-3 h-3" />}
                    {item.status === "pending" && <AlertCircle className="w-3 h-3" />}
                    {item.status === "ok" ? "Good" : item.status === "missed" ? "Missing" : "Pending"}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center p-3 rounded-lg bg-muted/50">
                    <div className="text-xs text-muted-foreground mb-1">YouTube</div>
                    <div className={`text-lg font-bold ${getProgressColor(item.yt_uploaded, item.yt_required)}`}>
                      {item.yt_uploaded}/{item.yt_required}
                    </div>
                    {item.yt_uploaded < item.yt_required && (
                      <div className="text-xs text-red-600 dark:text-red-400 mt-1">
                        Missing {item.yt_required - item.yt_uploaded}
                      </div>
                    )}
                  </div>

                  <div className="text-center p-3 rounded-lg bg-muted/50">
                    <div className="text-xs text-muted-foreground mb-1">Instagram</div>
                    <div className={`text-lg font-bold ${getProgressColor(item.insta_uploaded, item.insta_required)}`}>
                      {item.insta_uploaded}/{item.insta_required}
                    </div>
                    {item.insta_uploaded < item.insta_required && (
                      <div className="text-xs text-red-600 dark:text-red-400 mt-1">
                        Missing {item.insta_required - item.insta_uploaded}
                      </div>
                    )}
                  </div>
                </div>

                {isMissed && (
                  <div className="flex justify-center">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleSendAlert(item.employee_id, item.employee_name)}
                      disabled={sendingAlerts.has(item.employee_id)}
                      className="w-full"
                    >
                      {sendingAlerts.has(item.employee_id) ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Sending Alert...
                        </>
                      ) : (
                        <>
                          <Mail className="w-4 h-4 mr-2" />
                          Send Alert Email
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
