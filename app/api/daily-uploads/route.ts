import { connectToDatabase } from "@/lib/db"
import type { DailyUpload } from "@/lib/types"
import { formatDateISO } from "@/lib/helpers"

function getMockDailyUpload(employeeId: string, date: string): DailyUpload | null {
  return null
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const employeeId = searchParams.get("employeeId")
    const date = searchParams.get("date") || formatDateISO(new Date())

    if (!employeeId) {
      return Response.json({ error: "employeeId is required" }, { status: 400 })
    }

    const db = await connectToDatabase()
    const upload = await db.collection("daily_uploads").findOne({
      employee_id: Number.parseInt(employeeId),
      date,
    })

    return Response.json(upload ? { id: upload._id, ...upload } : null)
  } catch (error) {
    console.error("Error fetching daily upload:", error)
    const { searchParams } = new URL(request.url)
    const employeeId = searchParams.get("employeeId")
    const date = searchParams.get("date") || formatDateISO(new Date())
    const mockData = getMockDailyUpload(employeeId || "", date)
    return Response.json(mockData)
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { employeeId, date, insta_done, youtube_done } = body

    if (!employeeId || !date) {
      return Response.json({ error: "employeeId and date are required" }, { status: 400 })
    }

    const db = await connectToDatabase()
    const employeeIdNum = Number.parseInt(employeeId)

    const result = await db.collection("daily_uploads").findOneAndUpdate(
      { employee_id: employeeIdNum, date },
      {
        $set: {
          employee_id: employeeIdNum,
          date,
          insta_done: insta_done ?? false,
          youtube_done: youtube_done ?? false,
          updated_at: new Date(),
        },
      },
      { upsert: true, returnDocument: "after" },
    )

    return Response.json(result.value)
  } catch (error) {
    console.error("Error updating daily upload:", error)
    const body = await request.json()
    const { employeeId, date, insta_done, youtube_done } = body
    const mockUpload: DailyUpload = {
      id: Math.random(),
      employee_id: Number.parseInt(employeeId),
      date,
      insta_done: insta_done ?? false,
      youtube_done: youtube_done ?? false,
    }
    return Response.json(mockUpload)
  }
}
