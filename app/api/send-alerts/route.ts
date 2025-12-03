import { connectToDatabase } from "@/lib/db"
import type { Employee, WeeklyStat } from "@/lib/types"
import {
  formatDateISO,
  getWeekStartDate,
  getRequiredQuota,
  checkDailyCompliance,
  checkWeeklyCompliance,
} from "@/lib/helpers"

// This would be called by a cron job daily at 11:59 PM IST
export async function POST(request: Request) {
  const { type } = await request.json() // 'daily' or 'weekly'

  try {
    const db = await connectToDatabase()
    const employees = await db.collection("employees").find({}).toArray()

    if (type === "daily") {
      // Daily alert for missed uploads
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const yesterdayStr = formatDateISO(yesterday)

      for (const emp of employees) {
        const dailyUpload = await db.collection("daily_uploads").findOne({
          employee_id: emp.id,
          date: yesterdayStr,
        })

        const quota = getRequiredQuota(emp.role)
        const isMissing = !checkDailyCompliance(emp, dailyUpload)

        if (isMissing) {
          // Send email alert
          await sendDailyAlert(emp, quota)
        }
      }
    } else if (type === "weekly") {
      // Weekly alert for missed quotas
      const weekStart = formatDateISO(getWeekStartDate(new Date(new Date().getTime() - 7 * 24 * 60 * 60 * 1000)))

      for (const emp of employees) {
        const stats = await db.collection("weekly_stats").findOne({
          employee_id: emp.id,
          week_start_date: weekStart,
        })

        const isNonCompliant = !checkWeeklyCompliance(emp, stats)

        if (isNonCompliant) {
          // Send weekly alert
          await sendWeeklyAlert(emp, stats)
        }
      }
    }

    return Response.json({ success: true, message: "Alerts sent" })
  } catch (error) {
    console.error("Error sending alerts:", error)
    return Response.json({ error: "Failed to send alerts" }, { status: 500 })
  }
}

async function sendDailyAlert(employee: Employee, quota: any) {
  // This will use Nodemailer to send email
  // Configuration should be in environment variables
  const emailContent = `
Subject: Daily Upload Missing — Action Needed

Hi ${employee.name},

You have not marked your required upload for today. 

Required: ${employee.role === "coder" ? "YouTube video" : "Instagram post"}

Please complete it as soon as possible.

Best regards,
Content Upload Tracker
  `

  console.log("[ALERT] Daily alert to:", employee.email)
  console.log(emailContent)
}

async function sendWeeklyAlert(employee: Employee, stats: WeeklyStat | null) {
  const quota = getRequiredQuota(employee.role)
  const instaCount = stats?.insta_count || 0
  const youtubeCount = stats?.youtube_count || 0

  const emailContent = `
Subject: Weekly Upload Summary — Action Required

Hi ${employee.name},

Here's your weekly upload summary:

${employee.role === "coder" ? `YouTube Videos: ${youtubeCount}/${quota.youtube}` : `Instagram Posts: ${instaCount}/${quota.insta}`}

${employee.role === "coder" && youtubeCount < quota.youtube ? `You missed your YouTube quota. Please upload ${quota.youtube - youtubeCount} more video(s) before next week.` : ""}
${employee.role === "pepper" && instaCount < quota.insta ? `You missed your Instagram quota. Please post ${quota.insta - instaCount} more photo(s) before next week.` : ""}

Best regards,
Content Upload Tracker
  `

  console.log("[ALERT] Weekly alert to:", employee.email)
  console.log(emailContent)
}
