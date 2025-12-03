import { connectToDatabase } from "@/lib/db"
import { formatDateISO, getWeekStartDate } from "@/lib/helpers"

/**
 * GET /api/analytics/weekly
 * Get weekly analytics data for charts
 * Query params: 
 * - employeeId: specific employee (optional)
 * - weeks: number of weeks to fetch (default: 8)
 * - startDate: start date (YYYY-MM-DD)
 * - endDate: end date (YYYY-MM-DD)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const employeeIdParam = searchParams.get("employeeId")
    const weeksParam = searchParams.get("weeks")
    const startDateParam = searchParams.get("startDate")
    const endDateParam = searchParams.get("endDate")

    const db = await connectToDatabase()

    let startDate: Date
    let endDate: Date = new Date()

    if (startDateParam && endDateParam) {
      startDate = new Date(startDateParam)
      endDate = new Date(endDateParam)
    } else {
      const weeks = weeksParam ? Number.parseInt(weeksParam) : 8
      // Get the start of the current week
      const currentWeekStart = getWeekStartDate()
      // Go back N weeks
      startDate = new Date(currentWeekStart)
      startDate.setDate(startDate.getDate() - (weeks - 1) * 7)
    }

    const startDateStr = formatDateISO(startDate)
    const endDateStr = formatDateISO(endDate)

    // Get all employees or specific employee
    const employees = employeeIdParam
      ? await db.collection("employees").find({ id: Number.parseInt(employeeIdParam) }).toArray()
      : await db.collection("employees").find({}).toArray()

    // Get daily uploads for the date range
    const dailyUploads = await db
      .collection("daily_uploads")
      .find({
        employee_id: employeeIdParam ? Number.parseInt(employeeIdParam) : { $exists: true },
        date: { $gte: startDateStr, $lte: endDateStr },
      })
      .sort({ date: 1 })
      .toArray()

    // Group by week
    const dataByWeek: Record<string, {
      weekStart: string
      weekEnd: string
      employees: Record<number, {
        employee_id: number
        employee_name: string
        youtube_uploads: number
        instagram_uploads: number
        total_uploads: number
      }>
    }> = {}

    // Initialize all weeks in range
    const currentWeek = new Date(startDate)
    while (currentWeek <= endDate) {
      const weekStart = getWeekStartDate(currentWeek)
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekEnd.getDate() + 6)
      
      const weekStartStr = formatDateISO(weekStart)
      const weekEndStr = formatDateISO(weekEnd)
      
      if (!dataByWeek[weekStartStr]) {
        dataByWeek[weekStartStr] = {
          weekStart: weekStartStr,
          weekEnd: weekEndStr,
          employees: {},
        }
        
        // Initialize all employees for this week
        employees.forEach((emp) => {
          dataByWeek[weekStartStr].employees[emp.id] = {
            employee_id: emp.id,
            employee_name: emp.name,
            youtube_uploads: 0,
            instagram_uploads: 0,
            total_uploads: 0,
          }
        })
      }
      
      currentWeek.setDate(currentWeek.getDate() + 7)
    }

    // Process daily uploads
    dailyUploads.forEach((upload) => {
      const uploadDate = new Date(upload.date)
      const weekStart = getWeekStartDate(uploadDate)
      const weekStartStr = formatDateISO(weekStart)
      
      if (dataByWeek[weekStartStr] && dataByWeek[weekStartStr].employees[upload.employee_id]) {
        const empData = dataByWeek[weekStartStr].employees[upload.employee_id]
        if (upload.youtube_done) {
          empData.youtube_uploads++
          empData.total_uploads++
        }
        if (upload.insta_done) {
          empData.instagram_uploads++
          empData.total_uploads++
        }
      }
    })

    // Convert to array format
    const chartData = Object.values(dataByWeek).map((weekData) => ({
      weekStart: weekData.weekStart,
      weekEnd: weekData.weekEnd,
      weekLabel: `${new Date(weekData.weekStart).toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${new Date(weekData.weekEnd).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`,
      employees: Object.values(weekData.employees),
    }))

    return Response.json({
      startDate: startDateStr,
      endDate: endDateStr,
      employeeId: employeeIdParam ? Number.parseInt(employeeIdParam) : null,
      data: chartData,
      summary: {
        total_weeks: chartData.length,
        total_employees: employees.length,
      },
    })
  } catch (error) {
    console.error("Error fetching weekly analytics:", error)
    return Response.json({ error: "Failed to fetch weekly analytics" }, { status: 500 })
  }
}

