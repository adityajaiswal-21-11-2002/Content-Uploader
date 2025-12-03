import { connectToDatabase } from "@/lib/db"
import { generateCoderTopics, generatePeeperTopics, generateInstagramTopics } from "@/lib/openai"
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
    const peepers = employees.filter(
      (e) => e.role === "peeper" && (e.weekly_required_yt ?? 3) > 0
    )

    // Generate topics using OpenAI (skip YT topic generation if no employees for that group)
    const [coderTopicsResponse, peeperTopicsResponse, instaTopicsResponse] = await Promise.all([
      coders.length
        ? generateCoderTopics(coders.map((e) => e.name))
        : Promise.resolve({ coder_topics: [] }),
      peepers.length
        ? generatePeeperTopics(peepers.map((e) => e.name))
        : Promise.resolve({ peeper_topics: [] }),
      generateInstagramTopics(),
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

    // Save YouTube topics for peepers
    for (const peeperTopic of peeperTopicsResponse.peeper_topics ?? []) {
      const employee = peepers.find((e) => e.name === peeperTopic.employee)
      if (employee) {
        await topicsCollection.insertOne({
          date: today,
          employee_id: employee.id,
          platform: "youtube",
          topic: peeperTopic.topic,
          status: "pending",
          created_at: new Date(),
        })
      }
    }

    // Save Instagram topics for all employees (shared topics)
    for (const employee of employees) {
      for (const instaTopic of instaTopicsResponse.insta_topics ?? []) {
        await topicsCollection.insertOne({
          date: today,
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
      message: `Generated topics for ${today}`,
      coder_topics: coderTopicsResponse.coder_topics?.length ?? 0,
      peeper_topics: peeperTopicsResponse.peeper_topics?.length ?? 0,
      insta_topics: instaTopicsResponse.insta_topics?.length ?? 0,
    })
  } catch (error) {
    console.error("Error generating topics:", error)
    return Response.json({ error: "Failed to generate topics", details: String(error) }, { status: 500 })
  }
}

