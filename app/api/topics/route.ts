import { connectToDatabase } from "@/lib/db"
import { formatDateISO } from "@/lib/helpers"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const employeeId = searchParams.get("employeeId")
    const date = searchParams.get("date") || formatDateISO(new Date())

    if (!employeeId) {
      return Response.json({ error: "employeeId is required" }, { status: 400 })
    }

    const db = await connectToDatabase()
    const topics = await db
      .collection("topics")
      .find({
        employee_id: Number.parseInt(employeeId),
        date,
      })
      .sort({ created_at: -1 })
      .toArray()

    return Response.json(topics)
  } catch (error) {
    console.error("Error fetching topics:", error)
    return Response.json({ error: "Failed to fetch topics" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { employeeId, date, topic_text } = body

    if (!employeeId || !date || !topic_text) {
      return Response.json({ error: "employeeId, date, and topic_text are required" }, { status: 400 })
    }

    const db = await connectToDatabase()
    const result = await db.collection("topics").insertOne({
      employee_id: Number.parseInt(employeeId),
      date,
      topic_text,
      created_at: new Date(),
    })

    return Response.json({
      id: result.insertedId,
      employee_id: Number.parseInt(employeeId),
      date,
      topic_text,
      created_at: new Date(),
    })
  } catch (error) {
    console.error("Error creating topic:", error)
    return Response.json({ error: "Failed to create topic" }, { status: 500 })
  }
}
