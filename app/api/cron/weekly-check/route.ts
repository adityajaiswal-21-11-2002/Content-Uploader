import { NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/db"
import { getWeekStartDate, formatDateISO } from "@/lib/helpers"
import { sendEmail } from "@/lib/nodemailer"

/**
 * Cron job endpoint: Daily Compliance Checker (Every day at 11:59 PM)
 * Checks weekly upload progress daily and sends alerts if employees are behind schedule
 * This should be triggered by Vercel Cron or external cron service
 * 
 * To set up Vercel Cron, add to vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/weekly-check",
 *     "schedule": "59 23 * * *"
 *   }]
 * }
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authorization
    const authHeader = request.headers.get("authorization")
    const cronSecret = process.env.CRON_SECRET

    // Allow Vercel Cron signature or API key
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      // Check for Vercel Cron header
      const vercelCron = request.headers.get("x-vercel-cron")
      if (vercelCron !== "1") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }
    }

    const db = await connectToDatabase()

    // Get the current week
    const today = new Date()
    const weekStart = getWeekStartDate(today)
    const weekStartStr = formatDateISO(weekStart)

    // Calculate week end
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 6)
    const weekEndStr = formatDateISO(weekEnd)

    // Calculate days into the week (0 = Monday, 6 = Sunday)
    const dayOfWeek = today.getDay()
    const daysIntoWeek = dayOfWeek === 0 ? 6 : dayOfWeek - 1 // Convert to Monday = 0

    // Get all employees
    const employees = await db.collection("employees").find({}).toArray()

    // Get uploads for this week
    const uploads = await db
      .collection("uploads")
      .find({
        date: {
          $gte: weekStartStr,
          $lte: weekEndStr,
        },
      })
      .toArray()

    const alertsSent = []
    const todayStr = formatDateISO(today)
    
    // Check if it's end of week (Saturday or Sunday)
    const weekEnding = daysIntoWeek >= 5

    // Check each employee
    for (const employee of employees) {
      // Check if we already sent an alert today (to prevent duplicate emails)
      const existingAlert = await db.collection("alert_logs").findOne({
        employee_id: employee.id,
        date: todayStr,
        type: "compliance_check",
      })

      // Skip if alert already sent today (unless it's end of week)
      if (existingAlert && !weekEnding) {
        continue
      }
      const employeeUploads = uploads.filter((u) => u.employee_id === employee.id)

      const ytCount = employeeUploads.filter((u) => u.platform === "youtube").length
      const instaCount = employeeUploads.filter((u) => u.platform === "instagram").length

      const ytRequired = employee.weekly_required_yt || 3
      const instaRequired = employee.weekly_required_insta || 7

      // Calculate expected progress based on days into week
      // Assume even distribution: by day X, should have completed approximately (X+1)/7 of weekly quota
      const progressRatio = (daysIntoWeek + 1) / 7
      const expectedYt = Math.ceil(ytRequired * progressRatio)
      const expectedInsta = Math.ceil(instaRequired * progressRatio)

      // Check if they're behind schedule
      // Alert if they're missing more than 1 upload from expected progress
      const isBehindYt = ytCount < expectedYt - 1
      const isBehindInsta = instaCount < expectedInsta - 1
      const isBehind = isBehindYt || isBehindInsta

      // Also check if week is ending and they haven't met full quota
      const isMissingAtEndOfWeek = weekEnding && (ytCount < ytRequired || instaCount < instaRequired)

      if (isBehind || isMissingAtEndOfWeek) {
        // Send alert email
        const missingYt = Math.max(0, expectedYt - ytCount)
        const missingInsta = Math.max(0, expectedInsta - instaCount)
        const totalMissingYt = Math.max(0, ytRequired - ytCount)
        const totalMissingInsta = Math.max(0, instaRequired - instaCount)

        const subject = weekEnding 
          ? "⚠ URGENT: You missed your mandatory uploads this week"
          : "⚠ Reminder: You're falling behind on your weekly uploads"
        const html = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <title>Mandatory Upload Missing</title>
            </head>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #dc2626;">⚠ ${weekEnding ? 'Mandatory Upload Missing' : 'Upload Reminder'}</h2>
              <p>Hello ${employee.name},</p>
              <p>${weekEnding 
                ? `You have missed your required uploads for this week (${weekStartStr} to ${weekEndStr}).` 
                : `You're falling behind on your weekly upload targets. Please catch up to stay on track.`}</p>
              <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #dc2626;">Weekly Progress (Week of ${weekStartStr}):</h3>
                <p><strong>YouTube:</strong> ${ytCount}/${ytRequired} uploaded ${totalMissingYt > 0 ? `(Missing ${totalMissingYt})` : ''}</p>
                <p><strong>Instagram:</strong> ${instaCount}/${instaRequired} uploaded ${totalMissingInsta > 0 ? `(Missing ${totalMissingInsta})` : ''}</p>
                ${!weekEnding && (missingYt > 0 || missingInsta > 0) ? `
                <p style="margin-top: 10px; font-size: 14px; color: #666;">
                  <strong>Expected at this point:</strong> ~${expectedYt} YouTube, ~${expectedInsta} Instagram<br>
                  You're behind by ${missingYt > 0 ? `${missingYt} YouTube` : ''}${missingYt > 0 && missingInsta > 0 ? ' and ' : ''}${missingInsta > 0 ? `${missingInsta} Instagram` : ''} upload(s).
                </p>
                ` : ''}
              </div>
              <p>Please complete the missing uploads ${weekEnding ? 'immediately' : 'as soon as possible'}.</p>
              <p style="margin-top: 30px; font-size: 14px; color: #666;">
                Best regards,<br>
                Content Upload Tracker System
              </p>
            </body>
          </html>
        `

        try {
          await sendEmail(employee.email, subject, html)
          
          // Log the alert to prevent duplicates
          await db.collection("alert_logs").updateOne(
            {
              employee_id: employee.id,
              date: todayStr,
              type: "compliance_check",
            },
            {
              $set: {
                employee_id: employee.id,
                date: todayStr,
                type: "compliance_check",
                sent_at: new Date(),
                week_start: weekStartStr,
                yt_count: ytCount,
                insta_count: instaCount,
              },
            },
            { upsert: true }
          )

          alertsSent.push({
            employee_id: employee.id,
            employee_name: employee.name,
            email: employee.email,
            status: "sent",
          })
        } catch (emailError) {
          console.error(`Failed to send email to ${employee.email}:`, emailError)
          alertsSent.push({
            employee_id: employee.id,
            employee_name: employee.name,
            email: employee.email,
            status: "failed",
            error: String(emailError),
          })
        }

        // Save weekly report
        await db.collection("weekly_reports").updateOne(
          {
            week: weekStartStr,
            employee_id: employee.id,
          },
          {
            $set: {
              week: weekStartStr,
              employee_id: employee.id,
              yt_uploaded: ytCount,
              yt_required: ytRequired,
              insta_uploaded: instaCount,
              insta_required: instaRequired,
              status: "missed",
              created_at: new Date(),
            },
          },
          { upsert: true }
        )
      } else {
        // Save successful weekly report
        await db.collection("weekly_reports").updateOne(
          {
            week: weekStartStr,
            employee_id: employee.id,
          },
          {
            $set: {
              week: weekStartStr,
              employee_id: employee.id,
              yt_uploaded: ytCount,
              yt_required: ytRequired,
              insta_uploaded: instaCount,
              insta_required: instaRequired,
              status: "ok",
              created_at: new Date(),
            },
          },
          { upsert: true }
        )
      }
    }

    return NextResponse.json({
      success: true,
      message: "Daily compliance check completed",
      week_start: weekStartStr,
      week_end: weekEndStr,
      day_of_week: daysIntoWeek,
      alerts_sent: alertsSent.length,
      alerts: alertsSent,
    })
  } catch (error) {
    console.error("Error in daily compliance check cron job:", error)
    return NextResponse.json(
      { error: "Cron job failed", details: String(error) },
      { status: 500 }
    )
  }
}

