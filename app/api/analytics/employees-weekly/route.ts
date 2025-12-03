import { connectToDatabase } from "@/lib/db"
import { formatDateISO, getWeekStartDate } from "@/lib/helpers"

/**
 * GET /api/analytics/employees-weekly
 * Get weekly analytics data for all employees
 * Query params: weeks (default: 8)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const weeksParam = searchParams.get("weeks")

    const weeks = weeksParam ? Number.parseInt(weeksParam) : 8
    const currentWeekStart = getWeekStartDate()
    const startDate = new Date(currentWeekStart)
    startDate.setDate(startDate.getDate() - (weeks - 1) * 7)

    const startDateStr = formatDateISO(startDate)
    const endDateStr = formatDateISO(new Date())

    const db = await connectToDatabase()

    // Get all employees
    const employees = await db.collection("employees").find({}).toArray()

    // Get daily uploads for all employees
    const dailyUploads = await db
      .collection("daily_uploads")
      .find({
        date: { $gte: startDateStr, $lte: endDateStr },
      })
      .toArray()

    // Group by employee and calculate totals
    const employeeStats = employees.map((emp) => {
      const empUploads = dailyUploads.filter((u) => u.employee_id === emp.id)
      const youtubeCount = empUploads.filter((u) => u.youtube_done).length
      const instagramCount = empUploads.filter((u) => u.insta_done).length
      const totalCount = youtubeCount + instagramCount

      return {
        employee_id: emp.id,
        employee_name: emp.name,
        employee_email: emp.email,
        youtube_uploads: youtubeCount,
        instagram_uploads: instagramCount,
        total_uploads: totalCount,
        avg_per_week: weeks > 0 ? (totalCount / weeks).toFixed(2) : "0",
      }
    })

    // Sort by total uploads (descending)
    employeeStats.sort((a, b) => b.total_uploads - a.total_uploads)

    return Response.json({
      startDate: startDateStr,
      endDate: endDateStr,
      weeks,
      employees: employeeStats,
    })
  } catch (error) {
    console.error("Error fetching employees weekly analytics:", error)
    return Response.json({ error: "Failed to fetch employees weekly analytics" }, { status: 500 })
  }
}

