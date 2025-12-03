import { connectToDatabase } from "@/lib/db"
import { formatDateISO } from "@/lib/helpers"

/**
 * GET /api/analytics/daily
 * Get daily analytics data for charts
 * Query params: 
 * - employeeId: specific employee (optional)
 * - days: number of days to fetch (default: 30)
 * - startDate: start date (YYYY-MM-DD)
 * - endDate: end date (YYYY-MM-DD)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const employeeIdParam = searchParams.get("employeeId")
    const daysParam = searchParams.get("days")
    const startDateParam = searchParams.get("startDate")
    const endDateParam = searchParams.get("endDate")

    const db = await connectToDatabase()

    let startDate: Date
    let endDate: Date = new Date()

    if (startDateParam && endDateParam) {
      startDate = new Date(startDateParam)
      endDate = new Date(endDateParam)
    } else {
      const days = daysParam ? Number.parseInt(daysParam) : 30
      startDate = new Date()
      startDate.setDate(startDate.getDate() - days)
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

    // Get extra uploads for the date range
    const extraUploads = await db
      .collection("extra_uploads")
      .find({
        employee_id: employeeIdParam ? Number.parseInt(employeeIdParam) : { $exists: true },
        date: { $gte: startDateStr, $lte: endDateStr },
      })
      .toArray()

    // Group by date
    const dataByDate: Record<string, {
      date: string
      youtube_mandatory: number
      instagram_mandatory: number
      youtube_extra: number
      instagram_extra: number
      youtube_uploads: number
      instagram_uploads: number
      total_uploads: number
      employees_uploaded_yt: number
      employees_uploaded_ig: number
      employees_uploaded_both: number
      total_employees: number
    }> = {}

    // Initialize all dates in range
    const currentDate = new Date(startDate)
    while (currentDate <= endDate) {
      const dateStr = formatDateISO(currentDate)
      dataByDate[dateStr] = {
        date: dateStr,
        youtube_mandatory: 0,
        instagram_mandatory: 0,
        youtube_extra: 0,
        instagram_extra: 0,
        youtube_uploads: 0,
        instagram_uploads: 0,
        total_uploads: 0,
        employees_uploaded_yt: 0,
        employees_uploaded_ig: 0,
        employees_uploaded_both: 0,
        total_employees: employees.length,
      }
      currentDate.setDate(currentDate.getDate() + 1)
    }

    // Process daily uploads
    dailyUploads.forEach((upload) => {
      const dateStr = upload.date
      if (dataByDate[dateStr]) {
        if (upload.youtube_done) {
          dataByDate[dateStr].youtube_mandatory++
          dataByDate[dateStr].employees_uploaded_yt++
        }
        if (upload.insta_done) {
          dataByDate[dateStr].instagram_mandatory++
          dataByDate[dateStr].employees_uploaded_ig++
        }
        if (upload.youtube_done && upload.insta_done) {
          dataByDate[dateStr].employees_uploaded_both++
        }
      }
    })

    // Process extra uploads
    extraUploads.forEach((upload) => {
      const dateStr = upload.date
      if (dataByDate[dateStr]) {
        if (upload.platform === "youtube") {
          dataByDate[dateStr].youtube_extra++
        } else if (upload.platform === "instagram") {
          dataByDate[dateStr].instagram_extra++
        }
      }
    })

    // Finalize totals (mandatory + extras)
    Object.values(dataByDate).forEach((data) => {
      data.youtube_uploads = data.youtube_mandatory + data.youtube_extra
      data.instagram_uploads = data.instagram_mandatory + data.instagram_extra
      data.total_uploads = data.youtube_uploads + data.instagram_uploads
    })

    // Convert to array and format for charts
    const chartData = Object.values(dataByDate).map((data) => ({
      date: data.date,
      youtube: data.youtube_uploads,
      instagram: data.instagram_uploads,
      total: data.total_uploads,
      youtube_mandatory: data.youtube_mandatory,
      youtube_extra: data.youtube_extra,
      instagram_mandatory: data.instagram_mandatory,
      instagram_extra: data.instagram_extra,
      employees_uploaded_yt: data.employees_uploaded_yt,
      employees_uploaded_ig: data.employees_uploaded_ig,
      employees_uploaded_both: data.employees_uploaded_both,
      employees_missed_yt: data.total_employees - data.employees_uploaded_yt,
      employees_missed_ig: data.total_employees - data.employees_uploaded_ig,
      total_employees: data.total_employees,
    }))

    // Get employee-specific data if employeeId is provided
    let employeeData = null
    if (employeeIdParam) {
      const employeeUploads = dailyUploads.filter((u) => u.employee_id === Number.parseInt(employeeIdParam))
      const employeeExtras = extraUploads.filter((u) => u.employee_id === Number.parseInt(employeeIdParam))

      const extraByDate = employeeExtras.reduce<Record<string, { youtube: number; instagram: number }>>((acc, extra) => {
        if (!acc[extra.date]) {
          acc[extra.date] = { youtube: 0, instagram: 0 }
        }
        if (extra.platform === "youtube") {
          acc[extra.date].youtube++
        } else {
          acc[extra.date].instagram++
        }
        return acc
      }, {})
      employeeData = chartData.map((data) => {
        const upload = employeeUploads.find((u) => u.date === data.date)
        return {
          ...data,
          employee_youtube: upload?.youtube_done ? 1 : 0,
          employee_instagram: upload?.insta_done ? 1 : 0,
          employee_youtube_extra: extraByDate[data.date]?.youtube || 0,
          employee_instagram_extra: extraByDate[data.date]?.instagram || 0,
        }
      })
    }

    return Response.json({
      startDate: startDateStr,
      endDate: endDateStr,
      employeeId: employeeIdParam ? Number.parseInt(employeeIdParam) : null,
      data: employeeData || chartData,
      summary: {
        total_days: chartData.length,
        total_youtube_uploads: chartData.reduce((sum, d) => sum + d.youtube, 0),
        total_instagram_uploads: chartData.reduce((sum, d) => sum + d.instagram, 0),
        total_uploads: chartData.reduce((sum, d) => sum + d.total, 0),
        extra_youtube_uploads: chartData.reduce((sum, d) => sum + (d.youtube_extra || 0), 0),
        extra_instagram_uploads: chartData.reduce((sum, d) => sum + (d.instagram_extra || 0), 0),
        avg_youtube_per_day: chartData.length > 0 ? chartData.reduce((sum, d) => sum + d.youtube, 0) / chartData.length : 0,
        avg_instagram_per_day: chartData.length > 0 ? chartData.reduce((sum, d) => sum + d.instagram, 0) / chartData.length : 0,
      },
    })
  } catch (error) {
    console.error("Error fetching daily analytics:", error)
    return Response.json({ error: "Failed to fetch daily analytics" }, { status: 500 })
  }
}

