import { connectToDatabase } from "@/lib/db"
import { formatDateISO } from "@/lib/helpers"

/**
 * GET /api/analytics/monthly
 * Get monthly analytics data for charts
 * Query params: 
 * - month: YYYY-MM format (optional, defaults to current month)
 * - employeeId: specific employee (optional)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const monthParam = searchParams.get("month")
    const employeeIdParam = searchParams.get("employeeId")

    let startDate: Date
    let endDate: Date

    if (monthParam) {
      const [year, month] = monthParam.split("-").map(Number)
      startDate = new Date(year, month - 1, 1)
      endDate = new Date(year, month, 0, 23, 59, 59, 999)
    } else {
      const now = new Date()
      startDate = new Date(now.getFullYear(), now.getMonth(), 1)
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
    }

    const db = await connectToDatabase()
    const startDateStr = formatDateISO(startDate)
    const endDateStr = formatDateISO(endDate)

    // Get employees
    const employees = employeeIdParam
      ? await db.collection("employees").find({ id: Number.parseInt(employeeIdParam) }).toArray()
      : await db.collection("employees").find({}).toArray()

    // Get daily uploads for the month
    const dailyUploads = await db
      .collection("daily_uploads")
      .find({
        employee_id: employeeIdParam ? Number.parseInt(employeeIdParam) : { $exists: true },
        date: { $gte: startDateStr, $lte: endDateStr },
      })
      .toArray()

    // Group by employee
    const employeeStats: Record<number, {
      employee_id: number
      employee_name: string
      youtube_uploads: number
      instagram_uploads: number
      total_uploads: number
      days_with_both: number
      days_active: number
    }> = {}

    employees.forEach((emp) => {
      employeeStats[emp.id] = {
        employee_id: emp.id,
        employee_name: emp.name,
        youtube_uploads: 0,
        instagram_uploads: 0,
        total_uploads: 0,
        days_with_both: 0,
        days_active: 0,
      }
    })

    // Process uploads
    dailyUploads.forEach((upload) => {
      const stats = employeeStats[upload.employee_id]
      if (stats) {
        if (upload.youtube_done) {
          stats.youtube_uploads++
          stats.days_active++
        }
        if (upload.insta_done) {
          stats.instagram_uploads++
          if (!upload.youtube_done) {
            stats.days_active++
          }
        }
        if (upload.youtube_done && upload.insta_done) {
          stats.days_with_both++
        }
        stats.total_uploads = stats.youtube_uploads + stats.instagram_uploads
      }
    })

    // Convert to array for charts
    const chartData = Object.values(employeeStats).sort((a, b) => b.total_uploads - a.total_uploads)

    // Calculate requirements
    const daysInMonth = endDate.getDate()
    const weeksInMonth = Math.ceil(daysInMonth / 7)
    const requiredInstagram = daysInMonth
    const requiredYouTube = weeksInMonth * 3

    // Add compliance status
    const dataWithCompliance = chartData.map((data) => ({
      ...data,
      required_instagram: requiredInstagram,
      required_youtube: requiredYouTube,
      insta_compliant: data.instagram_uploads >= requiredInstagram,
      youtube_compliant: data.youtube_uploads >= requiredYouTube,
      insta_extra: Math.max(0, data.instagram_uploads - requiredInstagram),
      youtube_extra: Math.max(0, data.youtube_uploads - requiredYouTube),
    }))

    return Response.json({
      month: monthParam || `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, "0")}`,
      startDate: startDateStr,
      endDate: endDateStr,
      employeeId: employeeIdParam ? Number.parseInt(employeeIdParam) : null,
      data: dataWithCompliance,
      summary: {
        total_employees: employees.length,
        total_youtube_uploads: chartData.reduce((sum, d) => sum + d.youtube_uploads, 0),
        total_instagram_uploads: chartData.reduce((sum, d) => sum + d.instagram_uploads, 0),
        total_uploads: chartData.reduce((sum, d) => sum + d.total_uploads, 0),
        avg_youtube_per_employee: chartData.length > 0 ? chartData.reduce((sum, d) => sum + d.youtube_uploads, 0) / chartData.length : 0,
        avg_instagram_per_employee: chartData.length > 0 ? chartData.reduce((sum, d) => sum + d.instagram_uploads, 0) / chartData.length : 0,
        compliant_employees: dataWithCompliance.filter((d) => d.insta_compliant && d.youtube_compliant).length,
      },
    })
  } catch (error) {
    console.error("Error fetching monthly analytics:", error)
    return Response.json({ error: "Failed to fetch monthly analytics" }, { status: 500 })
  }
}

