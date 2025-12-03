import { connectToDatabase } from "@/lib/db"
import { formatDateISO } from "@/lib/helpers"

/**
 * GET /api/monthly-stats
 * Get monthly statistics for all employees
 * Query params: month (YYYY-MM), year (YYYY), or current month if not provided
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const monthParam = searchParams.get("month") // YYYY-MM format
    const yearParam = searchParams.get("year")

    let startDate: Date
    let endDate: Date

    if (monthParam) {
      // Parse YYYY-MM format
      const [year, month] = monthParam.split("-").map(Number)
      startDate = new Date(year, month - 1, 1)
      endDate = new Date(year, month, 0, 23, 59, 59, 999) // Last day of month
    } else if (yearParam) {
      const year = Number.parseInt(yearParam)
      startDate = new Date(year, 0, 1)
      endDate = new Date(year, 11, 31, 23, 59, 59, 999)
    } else {
      // Current month
      const now = new Date()
      startDate = new Date(now.getFullYear(), now.getMonth(), 1)
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
    }

    const db = await connectToDatabase()
    const employees = await db.collection("employees").find({}).toArray()

    const startDateStr = formatDateISO(startDate)
    const endDateStr = formatDateISO(endDate)

    const monthlyStats = await Promise.all(
      employees.map(async (emp) => {
        // Get all daily uploads for this month
        const dailyUploads = await db
          .collection("daily_uploads")
          .find({
            employee_id: emp.id,
            date: { $gte: startDateStr, $lte: endDateStr },
          })
          .toArray()

        // Count total uploads
        const totalYoutube = dailyUploads.filter((u) => u.youtube_done).length
        const totalInstagram = dailyUploads.filter((u) => u.insta_done).length
        const totalUploads = totalYoutube + totalInstagram

        // Count days with both platforms uploaded
        const daysWithBoth = dailyUploads.filter((u) => u.youtube_done && u.insta_done).length

        // Calculate compliance
        // Instagram: 1 per day (required)
        // YouTube: 3 per week (approximately 12-13 per month)
        const daysInMonth = endDate.getDate()
        const weeksInMonth = Math.ceil(daysInMonth / 7)
        const requiredInstagram = daysInMonth
        const requiredYouTube = weeksInMonth * 3

        const instaCompliant = totalInstagram >= requiredInstagram
        const youtubeCompliant = totalYoutube >= requiredYouTube
        const fullyCompliant = instaCompliant && youtubeCompliant

        return {
          employee_id: emp.id,
          employee_name: emp.name,
          employee_role: emp.role,
          employee_email: emp.email,
          month: monthParam || `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, "0")}`,
          total_youtube: totalYoutube,
          total_instagram: totalInstagram,
          total_uploads: totalUploads,
          days_with_both: daysWithBoth,
          required_instagram: requiredInstagram,
          required_youtube: requiredYouTube,
          insta_compliant: instaCompliant,
          youtube_compliant: youtubeCompliant,
          fully_compliant: fullyCompliant,
          insta_extra: Math.max(0, totalInstagram - requiredInstagram),
          youtube_extra: Math.max(0, totalYoutube - requiredYouTube),
        }
      }),
    )

    // Sort by total uploads (descending) for leaderboard
    monthlyStats.sort((a, b) => b.total_uploads - a.total_uploads)

    return Response.json({
      month: monthParam || `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, "0")}`,
      start_date: startDateStr,
      end_date: endDateStr,
      stats: monthlyStats,
    })
  } catch (error) {
    console.error("Error fetching monthly stats:", error)
    return Response.json({ error: "Failed to fetch monthly stats" }, { status: 500 })
  }
}

