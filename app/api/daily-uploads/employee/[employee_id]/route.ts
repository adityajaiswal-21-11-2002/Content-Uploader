import { connectToDatabase } from "@/lib/db"
import { formatDateISO } from "@/lib/helpers"
import type { DailyUploadRecord } from "@/lib/types"

/**
 * GET /api/daily-uploads/employee/:employee_id
 * Get daily upload records for a specific employee
 * Query params: ?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&days=30
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ employee_id: string }> | { employee_id: string } }
) {
  try {
    const resolvedParams = params instanceof Promise ? await params : params
    const employeeId = Number.parseInt(resolvedParams.employee_id)
    
    if (isNaN(employeeId)) {
      return Response.json({ error: "Invalid employee_id" }, { status: 400 })
    }

    const { searchParams } = new URL(request.url)
    const startDateParam = searchParams.get("startDate")
    const endDateParam = searchParams.get("endDate")
    const daysParam = searchParams.get("days")

    const db = await connectToDatabase()
    const today = new Date()
    
    let startDate: string
    let endDate: string = formatDateISO(today)

    if (startDateParam && endDateParam) {
      startDate = startDateParam
      endDate = endDateParam
    } else if (daysParam) {
      const days = Number.parseInt(daysParam) || 30
      const start = new Date(today)
      start.setDate(start.getDate() - (days - 1))
      startDate = formatDateISO(start)
    } else {
      // Default: last 30 days
      const start = new Date(today)
      start.setDate(start.getDate() - 29)
      startDate = formatDateISO(start)
    }

    // Fetch daily upload records
    const records = await db
      .collection("daily_uploads")
      .find({
        employee_id: employeeId,
        date: {
          $gte: startDate,
          $lte: endDate,
        },
      })
      .sort({ date: -1 })
      .toArray()

    // Convert to DailyUploadRecord format
    const formattedRecords: DailyUploadRecord[] = records.map((record) => ({
      id: record._id?.toString(),
      employee_id: record.employee_id,
      date: record.date,
      youtube_done: record.youtube_done || false,
      insta_done: record.insta_done || false,
      youtube_video_link: record.youtube_video_link || undefined,
      instagram_video_link: record.instagram_video_link || undefined,
      created_at: record.created_at,
      updated_at: record.updated_at,
    }))

    return Response.json({
      employee_id: employeeId,
      startDate,
      endDate,
      records: formattedRecords,
      totalDays: formattedRecords.length,
    })
  } catch (error) {
    console.error("Error fetching daily upload records:", error)
    return Response.json(
      { error: "Failed to fetch daily upload records", details: String(error) },
      { status: 500 }
    )
  }
}

