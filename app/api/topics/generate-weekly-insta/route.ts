import { connectToDatabase } from "@/lib/db"
import { generateInstagramTopics } from "@/lib/openai"
import { formatDateISO, getWeekStartDate } from "@/lib/helpers"

/**
 * POST /api/topics/generate-weekly-insta
 * Generates weekly Instagram topics for all employees using OpenAI
 * Should be triggered by cron job every Monday at 8:00 AM
 */
export async function POST(request: Request) {
  try {
    // Verify authorization (can add API key check here)
    const authHeader = request.headers.get("authorization")
    const cronSecret = process.env.CRON_SECRET
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const db = await connectToDatabase()
    const today = new Date()
    const weekStart = getWeekStartDate(today)
    const weekStartStr = formatDateISO(weekStart)

    // Fetch all employees
    const employees = await db.collection("employees").find({}).toArray()

    // Generate Instagram topics for this week
    const instaTopicsResponse = await generateInstagramTopics()

    const topicsCollection = db.collection("topics_weekly")

    // Save Instagram topics for all employees (shared topics for the week)
    for (const employee of employees) {
      for (const instaTopic of instaTopicsResponse.insta_topics ?? []) {
        await topicsCollection.insertOne({
          week_start: weekStartStr,
          employee_id: employee.id,
          platform: "instagram",
          topic: instaTopic,
          status: "pending",
          created_at: new Date(),
        })
      }
    }

    return Response.json({
      success: true,
      message: `Generated weekly Instagram topics for week starting ${weekStartStr}`,
      insta_topics: instaTopicsResponse.insta_topics?.length ?? 0,
      week_start: weekStartStr,
    })
  } catch (error) {
    console.error("Error generating weekly Instagram topics:", error)
    return Response.json({ error: "Failed to generate weekly Instagram topics", details: String(error) }, { status: 500 })
  }
}
