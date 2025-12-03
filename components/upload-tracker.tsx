"use client"

import { useState } from "react"
import type { Employee, DailyUpload } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { formatDateISO } from "@/lib/helpers"
import { CheckCircle2, Circle } from "lucide-react"

interface UploadTrackerProps {
  employee: Employee
  dailyUpload: DailyUpload | null
  onUpdate: (updated: DailyUpload) => void
}

export default function UploadTracker({ employee, dailyUpload, onUpdate }: UploadTrackerProps) {
  const [loading, setLoading] = useState(false)
  const today = formatDateISO(new Date())

  const instaComplete = dailyUpload?.insta_done || false
  const youtubeComplete = dailyUpload?.youtube_done || false

  const handleMarkUpload = async (type: "insta" | "youtube") => {
    setLoading(true)
    try {
      const response = await fetch("/api/daily-uploads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: employee.id,
          date: today,
          insta_done: type === "insta" ? !instaComplete : instaComplete,
          youtube_done: type === "youtube" ? !youtubeComplete : youtubeComplete,
        }),
      })

      const updated = await response.json()
      onUpdate(updated)
    } catch (error) {
      console.error("Error updating upload:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {employee.role === "coder" && (
        <div className="flex items-center justify-between p-4 bg-card border border-border rounded-lg">
          <div className="flex items-center gap-3">
            {youtubeComplete ? (
              <CheckCircle2 className="w-6 h-6 text-green-500" />
            ) : (
              <Circle className="w-6 h-6 text-gray-300" />
            )}
            <div>
              <p className="font-semibold text-foreground">YouTube Upload</p>
              <p className="text-sm text-muted-foreground">Required for coders</p>
            </div>
          </div>
          <Button
            onClick={() => handleMarkUpload("youtube")}
            disabled={loading}
            variant={youtubeComplete ? "default" : "outline"}
          >
            {youtubeComplete ? "Done" : "Mark Done"}
          </Button>
        </div>
      )}

      {employee.role === "pepper" && (
        <div className="flex items-center justify-between p-4 bg-card border border-border rounded-lg">
          <div className="flex items-center gap-3">
            {instaComplete ? (
              <CheckCircle2 className="w-6 h-6 text-green-500" />
            ) : (
              <Circle className="w-6 h-6 text-gray-300" />
            )}
            <div>
              <p className="font-semibold text-foreground">Instagram Upload</p>
              <p className="text-sm text-muted-foreground">Required for pepper team</p>
            </div>
          </div>
          <Button
            onClick={() => handleMarkUpload("insta")}
            disabled={loading}
            variant={instaComplete ? "default" : "outline"}
          >
            {instaComplete ? "Done" : "Mark Done"}
          </Button>
        </div>
      )}

      {/* Optional uploads */}
      {employee.role === "coder" && (
        <div className="flex items-center justify-between p-4 bg-card border border-border rounded-lg opacity-60">
          <div className="flex items-center gap-3">
            {instaComplete ? (
              <CheckCircle2 className="w-6 h-6 text-green-500" />
            ) : (
              <Circle className="w-6 h-6 text-gray-300" />
            )}
            <div>
              <p className="font-semibold text-foreground">Instagram Upload</p>
              <p className="text-sm text-muted-foreground">Optional</p>
            </div>
          </div>
          <Button
            onClick={() => handleMarkUpload("insta")}
            disabled={loading}
            variant={instaComplete ? "default" : "outline"}
            size="sm"
          >
            {instaComplete ? "Done" : "Mark"}
          </Button>
        </div>
      )}

      {employee.role === "pepper" && (
        <div className="flex items-center justify-between p-4 bg-card border border-border rounded-lg opacity-60">
          <div className="flex items-center gap-3">
            {youtubeComplete ? (
              <CheckCircle2 className="w-6 h-6 text-green-500" />
            ) : (
              <Circle className="w-6 h-6 text-gray-300" />
            )}
            <div>
              <p className="font-semibold text-foreground">YouTube Upload</p>
              <p className="text-sm text-muted-foreground">Optional</p>
            </div>
          </div>
          <Button
            onClick={() => handleMarkUpload("youtube")}
            disabled={loading}
            variant={youtubeComplete ? "default" : "outline"}
            size="sm"
          >
            {youtubeComplete ? "Done" : "Mark"}
          </Button>
        </div>
      )}
    </div>
  )
}
