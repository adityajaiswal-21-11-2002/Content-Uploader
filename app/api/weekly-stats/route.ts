import { connectToDatabase } from "@/lib/db"
import { getWeekStartDate, formatDateISO } from "@/lib/helpers"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const employeeId = searchParams.get("employeeId")
    const weekStart = searchParams.get("weekStart") || formatDateISO(getWeekStartDate())

    if (!employeeId) {
      return Response.json({ error: "employeeId is required" }, { status: 400 })
    }

    const db = await connectToDatabase()
    const stats = await db.collection("weekly_stats").findOne({
      employee_id: Number.parseInt(employeeId),
      week_start_date: weekStart,
    })

    return Response.json(stats ? { id: stats._id, ...stats } : null)
  } catch (error) {
    console.error("Error fetching weekly stats:", error)
    return Response.json({ error: "Failed to fetch weekly stats" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { employeeId, weekStart } = body

    if (!employeeId || !weekStart) {
      return Response.json({ error: "employeeId and weekStart are required" }, { status: 400 })
    }

    const db = await connectToDatabase()
    const employeeIdNum = Number.parseInt(employeeId)

    const weekEnd = new Date(new Date(weekStart).getTime() + 7 * 24 * 60 * 60 * 1000)
    const dailyUploads = await db
      .collection("daily_uploads")
      .find({
        employee_id: employeeIdNum,
        date: { $gte: weekStart, $lt: formatDateISO(weekEnd) },
      })
      .toArray()

    const insta_count = dailyUploads.filter((u) => u.insta_done).length
    const youtube_count = dailyUploads.filter((u) => u.youtube_done).length

    const result = await db.collection("weekly_stats").findOneAndUpdate(
      { employee_id: employeeIdNum, week_start_date: weekStart },
      {
        $set: {
          employee_id: employeeIdNum,
          week_start_date: weekStart,
          insta_count,
          youtube_count,
          updated_at: new Date(),
        },
      },
      { upsert: true, returnDocument: "after" },
    )

    return Response.json(result.value)
  } catch (error) {
    console.error("Error updating weekly stats:", error)
    return Response.json({ error: "Failed to update weekly stats" }, { status: 500 })
  }
}
