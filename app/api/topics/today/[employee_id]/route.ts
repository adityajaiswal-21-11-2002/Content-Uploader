import { connectToDatabase } from "@/lib/db"
import { formatDateISO, getWeekStartDate } from "@/lib/helpers"

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
    const weekStart = getWeekStartDate(new Date())
    const weekStartStr = formatDateISO(weekStart)

    console.log(`[Topics API] Fetching topics for employee ${employeeId} on date ${today}, week starting ${weekStartStr}`)

    // Get today's YouTube topics for this employee
    const youtubeQuery = {
      $and: [
        {
          $or: [
            { employee_id: employeeId },
            { employee_id: resolvedParams.employee_id },
          ],
        },
        { date: today },
        { platform: "youtube" },
      ],
    }

    console.log(`[Topics API] YouTube Query:`, JSON.stringify(youtubeQuery))

    const youtubeTopic = await db
      .collection("topics_daily")
      .findOne(youtubeQuery)

    // Get this week's Instagram topics for this employee
    const instagramQuery = {
      $and: [
        {
          $or: [
            { employee_id: employeeId },
            { employee_id: resolvedParams.employee_id },
          ],
        },
        { week_start: weekStartStr },
        { platform: "instagram" },
      ],
    }

    console.log(`[Topics API] Instagram Query:`, JSON.stringify(instagramQuery))

    const instaTopics = await db
      .collection("topics_weekly")
      .find(instagramQuery)
      .toArray()

    console.log(`[Topics API] Found YouTube: ${youtubeTopic ? 1 : 0}, Instagram: ${instaTopics.length} topics for employee ${employeeId}`)

    const response = {
      date: today,
      week_start: weekStartStr,
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

