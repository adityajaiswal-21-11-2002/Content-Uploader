import { connectToDatabase } from "@/lib/db"
import { formatDateISO } from "@/lib/helpers"

/**
 * GET /api/employee/activity?employeeId=1&days=7
 * Returns last N days activity and last alert info for a single employee
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const employeeIdParam = searchParams.get("employeeId")
    const daysParam = searchParams.get("days")

    if (!employeeIdParam) {
      return Response.json({ error: "employeeId is required" }, { status: 400 })
    }

    const employeeId = Number.parseInt(employeeIdParam)
    if (isNaN(employeeId)) {
      return Response.json({ error: "Invalid employeeId" }, { status: 400 })
    }

    const days = daysParam ? Number.parseInt(daysParam) : 7
    const db = await connectToDatabase()

    // Build list of last N dates (including today)
    const today = new Date()
    const dates: string[] = []
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      dates.push(formatDateISO(d))
    }

    // Fetch uploads for this employee in this date range
    const uploads = await db
      .collection("uploads")
      .find({
        employee_id: employeeId,
        date: { $in: dates },
      })
      .toArray()

    const activity = dates.map((date) => {
      const dayUploads = uploads.filter((u) => u.date === date)
      const youtubeDone = dayUploads.some((u) => u.platform === "youtube")
      const instagramDone = dayUploads.some((u) => u.platform === "instagram")
      return {
        date,
        youtubeDone,
        instagramDone,
      }
    })

    // Get last alert for this employee (if alert_logs collection exists)
    let lastAlert: { date: string; sent_at: string } | null = null
    const collections = await db.listCollections().toArray()
    const hasAlertLogs = collections.some((col) => col.name === "alert_logs")

    if (hasAlertLogs) {
      const alert = await db
        .collection("alert_logs")
        .find({ employee_id: employeeId })
        .sort({ sent_at: -1 })
        .limit(1)
        .toArray()

      if (alert.length > 0) {
        lastAlert = {
          date: alert[0].date,
          sent_at: alert[0].sent_at?.toISOString?.() ?? alert[0].sent_at,
        }
      }
    }

    return Response.json({
      employee_id: employeeId,
      days,
      activity,
      lastAlert,
    })
  } catch (error) {
    console.error("Error fetching employee activity:", error)
    return Response.json({ error: "Failed to fetch employee activity" }, { status: 500 })
  }
}


