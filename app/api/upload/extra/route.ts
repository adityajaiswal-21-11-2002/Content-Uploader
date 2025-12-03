import { connectToDatabase } from "@/lib/db"
import { formatDateISO } from "@/lib/helpers"

/**
 * POST /api/upload/extra
 * Create an extra (non-mandatory) upload entry for an employee.
 * Body: { employee_id: number | string, platform: "youtube" | "instagram", video_link: string, date?: string }
 *
 * Unlike /api/upload/mark-done, this does NOT affect daily compliance flags or topics.
 * It only records additional videos that can be shown in lists and analytics.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { employee_id, platform, video_link, date } = body

    if (!employee_id || !platform) {
      return Response.json({ error: "employee_id and platform are required" }, { status: 400 })
    }

    if (platform !== "youtube" && platform !== "instagram") {
      return Response.json(
        { error: "platform must be 'youtube' or 'instagram'" },
        { status: 400 },
      )
    }

    if (!video_link || !video_link.trim()) {
      return Response.json(
        { error: "video_link is required for extra uploads" },
        { status: 400 },
      )
    }

    // Basic URL validation
    try {
      new URL(video_link.trim())
    } catch {
      return Response.json(
        { error: "video_link must be a valid URL" },
        { status: 400 },
      )
    }

    const db = await connectToDatabase()
    const employeeIdNum = Number.parseInt(String(employee_id))
    const uploadDate = date && String(date).trim().length > 0 ? String(date).trim() : formatDateISO(new Date())

    const doc = {
      employee_id: employeeIdNum,
      platform,
      date: uploadDate,
      video_link: video_link.trim(),
      created_at: new Date(),
    }

    const result = await db.collection("extra_uploads").insertOne(doc)

    return Response.json(
      {
        success: true,
        id: result.insertedId?.toString(),
        ...doc,
      },
      { status: 201 },
    )
  } catch (error: any) {
    console.error("Error creating extra upload:", error)
    return Response.json(
      { error: error?.message || "Failed to create extra upload" },
      { status: 500 },
    )
  }
}


