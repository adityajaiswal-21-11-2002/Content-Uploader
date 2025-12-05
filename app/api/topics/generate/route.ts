import { connectToDatabase } from "@/lib/db"
import { generateCoderTopics, generatePeeperTopics } from "@/lib/openai"
import { formatDateISO } from "@/lib/helpers"

/**
 * POST /api/topics/generate
 * Generates daily topics for all employees using OpenAI
 * Should be triggered by cron job at 8:00 AM daily
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
    const today = formatDateISO(new Date())

    // Fetch all employees
    const employees = await db.collection("employees").find({}).toArray()

    // Only generate YouTube topics for employees that actually have a YT quota
    const coders = employees.filter(
      (e) => e.role === "coder" && (e.weekly_required_yt ?? 3) > 0
    )
    const peppers = employees.filter(
      (e) => e.role === "pepper" && (e.weekly_required_yt ?? 3) > 0
    )

    // Generate YouTube topics using OpenAI (skip if no employees for that group)
    const [coderTopicsResponse, pepperTopicsResponse] = await Promise.all([
      coders.length
        ? generateCoderTopics(coders.map((e) => e.name))
        : Promise.resolve({ coder_topics: [] }),
      peppers.length
        ? generatePepperTopics(peppers.map((e) => e.name))
        : Promise.resolve({ pepper_topics: [] }),
    ])

    const topicsCollection = db.collection("topics_daily")

    // Save YouTube topics for coders
    for (const coderTopic of coderTopicsResponse.coder_topics ?? []) {
      const employee = coders.find((e) => e.name === coderTopic.employee)
      if (employee) {
        await topicsCollection.insertOne({
          date: today,
          employee_id: employee.id,
          platform: "youtube",
          topic: coderTopic.topic,
          status: "pending",
          created_at: new Date(),
        })
      }
    }

    // Save YouTube topics for peppers
    for (const pepperTopic of pepperTopicsResponse.pepper_topics ?? []) {
      const employee = peppers.find((e) => e.name === pepperTopic.employee)
      if (employee) {
        await topicsCollection.insertOne({
          date: today,
          employee_id: employee.id,
          platform: "youtube",
          topic: pepperTopic.topic,
          status: "pending",
          created_at: new Date(),
        })
      }
    }


    return Response.json({
      success: true,
      message: `Generated YouTube topics for ${today}`,
      coder_topics: coderTopicsResponse.coder_topics?.length ?? 0,
      pepper_topics: pepperTopicsResponse.pepper_topics?.length ?? 0,
    })
  } catch (error) {
    console.error("Error generating topics:", error)
    return Response.json({ error: "Failed to generate topics", details: String(error) }, { status: 500 })
  }
}

