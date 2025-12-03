import { connectToDatabase } from "@/lib/db"
import {
  formatDateISO,
  getWeekStartDate,
  checkDailyCompliance,
  checkWeeklyCompliance,
  getRequiredQuota,
} from "@/lib/helpers"

export async function GET() {
  try {
    const db = await connectToDatabase()

    const employees = await db.collection("employees").find({}).toArray()

    const today = formatDateISO(new Date())
    const weekStart = formatDateISO(getWeekStartDate())

    const complianceData = await Promise.all(
      employees.map(async (emp) => {
        // Get today's daily upload record
        const dailyUploadRecord = await db.collection("daily_uploads").findOne({
          employee_id: emp.id,
          date: today,
        })

        // Convert to DailyUpload format for compatibility
        const dailyUpload = dailyUploadRecord
          ? {
              id: dailyUploadRecord._id?.toString(),
              employee_id: dailyUploadRecord.employee_id,
              date: dailyUploadRecord.date,
              insta_done: dailyUploadRecord.insta_done || false,
              youtube_done: dailyUploadRecord.youtube_done || false,
              created_at: dailyUploadRecord.created_at,
            }
          : null

        const weeklyStats = await db.collection("weekly_stats").findOne({
          employee_id: emp.id,
          week_start_date: weekStart,
        })

        const dailyCompliant = dailyUpload && checkDailyCompliance(emp, dailyUpload)
        const weeklyCompliant = weeklyStats && checkWeeklyCompliance(emp, weeklyStats)
        const quota = getRequiredQuota(emp.role)

        return {
          employee: { id: emp.id, name: emp.name, role: emp.role, email: emp.email },
          dailyUpload: dailyUpload || null,
          weeklyStats: weeklyStats || null,
          dailyCompliant,
          weeklyCompliant,
          quota,
        }
      }),
    )

    return Response.json(complianceData)
  } catch (error) {
    console.error("Error fetching compliance data:", error)
    return Response.json({ error: "Failed to fetch compliance data" }, { status: 500 })
  }
}
