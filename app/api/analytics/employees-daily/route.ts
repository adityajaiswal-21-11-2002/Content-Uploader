import { connectToDatabase } from "@/lib/db"
import { formatDateISO } from "@/lib/helpers"

/**
 * GET /api/analytics/employees-daily
 * Get daily analytics data for all employees
 * Query params: days (default: 30)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const daysParam = searchParams.get("days")

    const days = daysParam ? Number.parseInt(daysParam) : 30
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

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

    // Get extra uploads for the range
    const extraUploads = await db
      .collection("extra_uploads")
      .find({
        date: { $gte: startDateStr, $lte: endDateStr },
      })
      .toArray()

    const extraByEmployee = extraUploads.reduce<Record<number, { youtube: number; instagram: number }>>((acc, extra) => {
      if (!acc[extra.employee_id]) {
        acc[extra.employee_id] = { youtube: 0, instagram: 0 }
      }
      if (extra.platform === "youtube") {
        acc[extra.employee_id].youtube++
      } else if (extra.platform === "instagram") {
        acc[extra.employee_id].instagram++
      }
      return acc
    }, {})

    // Group by employee
    const employeeStats = employees.map((emp) => {
      const empUploads = dailyUploads.filter((u) => u.employee_id === emp.id)
      const youtubeMandatory = empUploads.filter((u) => u.youtube_done).length
      const instagramMandatory = empUploads.filter((u) => u.insta_done).length
      const extraCounts = extraByEmployee[emp.id] || { youtube: 0, instagram: 0 }
      const youtubeCount = youtubeMandatory + extraCounts.youtube
      const instagramCount = instagramMandatory + extraCounts.instagram
      const totalCount = youtubeCount + instagramCount

      return {
        employee_id: emp.id,
        employee_name: emp.name,
        employee_email: emp.email,
        youtube_uploads: youtubeCount,
        instagram_uploads: instagramCount,
        total_uploads: totalCount,
        youtube_extra_uploads: extraCounts.youtube,
        instagram_extra_uploads: extraCounts.instagram,
        avg_per_day: days > 0 ? (totalCount / days).toFixed(2) : "0",
      }
    })

    // Sort by total uploads (descending)
    employeeStats.sort((a, b) => b.total_uploads - a.total_uploads)

    return Response.json({
      startDate: startDateStr,
      endDate: endDateStr,
      days,
      employees: employeeStats,
    })
  } catch (error) {
    console.error("Error fetching employees daily analytics:", error)
    return Response.json({ error: "Failed to fetch employees daily analytics" }, { status: 500 })
  }
}

