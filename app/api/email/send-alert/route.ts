import { connectToDatabase } from "@/lib/db"
import { sendEmail } from "@/lib/nodemailer"

/**
 * POST /api/email/send-alert
 * Send alert email to an employee about missing uploads
 * Body: { employee_id: number, message?: string }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { employee_id, message } = body

    if (!employee_id) {
      return Response.json({ error: "employee_id is required" }, { status: 400 })
    }

    const db = await connectToDatabase()

    // Get employee details
    const employee = await db.collection("employees").findOne({ id: Number.parseInt(employee_id) })

    if (!employee) {
      return Response.json({ error: "Employee not found" }, { status: 404 })
    }

    const subject = "⚠ URGENT: You missed your mandatory upload today"

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Mandatory Upload Missing</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #dc2626;">⚠ Mandatory Upload Missing</h2>
          <p>Hello ${employee.name},</p>
          <p>You have missed your required YouTube/Instagram upload for this week.</p>
          ${message ? `<p>${message}</p>` : ""}
          <p>Please complete it immediately.</p>
          <p style="margin-top: 30px; font-size: 14px; color: #666;">
            Best regards,<br>
            Content Upload Tracker System
          </p>
        </body>
      </html>
    `

    await sendEmail(employee.email, subject, html)

    return Response.json({
      success: true,
      message: `Alert email sent to ${employee.email}`,
      employee_id: Number.parseInt(employee_id),
    })
  } catch (error) {
    console.error("Error sending alert email:", error)
    return Response.json({ error: "Failed to send alert email", details: String(error) }, { status: 500 })
  }
}

