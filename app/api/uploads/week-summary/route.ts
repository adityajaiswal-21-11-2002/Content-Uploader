import { connectToDatabase } from "@/lib/db"
import { getWeekStartDate, formatDateISO } from "@/lib/helpers"

/**
 * GET /api/uploads/week-summary
 * Get weekly upload summary for all employees
 * Query params: ?week=YYYY-MM-DD (optional, defaults to current week)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const weekParam = searchParams.get("week")

    const weekStart = weekParam ? new Date(weekParam) : getWeekStartDate()
    const weekStartStr = formatDateISO(weekStart)

    // Calculate week end (6 days later)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 6)
    const weekEndStr = formatDateISO(weekEnd)

    const db = await connectToDatabase()

    // Get all employees
    const employees = await db.collection("employees").find({}).toArray()

    // Get uploads for this week
    const uploads = await db
      .collection("uploads")
      .find({
        date: {
          $gte: weekStartStr,
          $lte: weekEndStr,
        },
      })
      .toArray()

    // Get or create weekly reports
    const summary = await Promise.all(
      employees.map(async (employee) => {
        const employeeUploads = uploads.filter((u) => u.employee_id === employee.id)

        const ytCount = employeeUploads.filter((u) => u.platform === "youtube").length
        const instaCount = employeeUploads.filter((u) => u.platform === "instagram").length

        const ytRequired = employee.weekly_required_yt || 3
        const instaRequired = employee.weekly_required_insta || 7

        let status: "ok" | "missed" | "pending" = "pending"
        if (ytCount >= ytRequired && instaCount >= instaRequired) {
          status = "ok"
        } else if (new Date() > weekEnd) {
          status = "missed"
        }

        // Save/update weekly report
        await db.collection("weekly_reports").updateOne(
          {
            week: weekStartStr,
            employee_id: employee.id,
          },
          {
            $set: {
              week: weekStartStr,
              employee_id: employee.id,
              yt_uploaded: ytCount,
              yt_required: ytRequired,
              insta_uploaded: instaCount,
              insta_required: instaRequired,
              status,
              created_at: new Date(),
            },
          },
          { upsert: true }
        )

        return {
          employee_id: employee.id,
          employee_name: employee.name,
          employee_email: employee.email,
          role: employee.role,
          yt_uploaded: ytCount,
          yt_required: ytRequired,
          insta_uploaded: instaCount,
          insta_required: instaRequired,
          status,
        }
      })
    )

    return Response.json({
      week_start: weekStartStr,
      week_end: weekEndStr,
      summary,
    })
  } catch (error) {
    console.error("Error fetching week summary:", error)
    return Response.json({ error: "Failed to fetch week summary" }, { status: 500 })
  }
}

