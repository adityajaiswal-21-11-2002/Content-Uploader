import { connectToDatabase } from "@/lib/db"
import { formatDateISO } from "@/lib/helpers"

/**
 * GET /api/topics/today/:employee_id
 * Get today's topics for a specific employee
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ employee_id: string }> | { employee_id: string } }
) {
  try {
    // Handle both Promise and direct params (for Next.js 15+ compatibility)
    const resolvedParams = params instanceof Promise ? await params : params
    const employeeId = Number.parseInt(resolvedParams.employee_id)
    if (isNaN(employeeId)) {
      return Response.json({ error: "Invalid employee_id" }, { status: 400 })
    }

    const db = await connectToDatabase()
    const today = formatDateISO(new Date())

    console.log(`[Topics API] Fetching topics for employee ${employeeId} on date ${today}`)

    // Get today's topics for this employee
    // Be tolerant to employee_id stored as number OR string in MongoDB
    const query = {
      $and: [
        {
          $or: [
            { employee_id: employeeId },
            { employee_id: resolvedParams.employee_id },
          ],
        },
        { date: today },
      ],
    }

    console.log(`[Topics API] Query:`, JSON.stringify(query))

    const topics = await db
      .collection("topics_daily")
      .find(query)
      .toArray()

    console.log(`[Topics API] Found ${topics.length} topics for employee ${employeeId}`)

    // Separate YouTube and Instagram topics
    const youtubeTopic = topics.find((t) => t.platform === "youtube")
    const instaTopics = topics.filter((t) => t.platform === "instagram")

    const response = {
      date: today,
      youtube: youtubeTopic
        ? {
            id: youtubeTopic._id?.toString(),
            topic: youtubeTopic.topic,
            status: youtubeTopic.status,
          }
        : null,
      instagram: instaTopics.map((t) => ({
        id: t._id?.toString(),
        topic: t.topic,
        status: t.status,
      })),
    }

    console.log(`[Topics API] Response:`, JSON.stringify(response, null, 2))

    return Response.json(response)
  } catch (error) {
    console.error("Error fetching today's topics:", error)
    return Response.json({ error: "Failed to fetch topics", details: String(error) }, { status: 500 })
  }
}

