import nodemailer from "nodemailer"

export const transporter = nodemailer.createTransport({
  service: "gmail",
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number.parseInt(process.env.SMTP_PORT || "587"),
  secure: false, // Use TLS (587) instead of SSL (465)
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

export async function sendEmail(to: string, subject: string, html: string) {
  try {
    const result = await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject,
      html,
    })
    console.log("[v0] Email sent successfully:", result.messageId)
    return result
  } catch (error) {
    console.error("[v0] Error sending email:", error)
    throw error
  }
}
