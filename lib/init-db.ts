import { connectToDatabase } from "./db"
import type { Employee } from "./types"
import { formatDateISO } from "./helpers"
import { generateCoderTopics, generatePeeperTopics, generateInstagramTopics } from "./openai"

/**
 * Initialize / reset database with employee data and today's topics.
 * - Wipes ALL existing data for this app's database
 * - Creates current employees with correct emails
 * - Generates today's YouTube & Instagram topics
 *
 * Call via /api/init once to reset everything.
 */
export async function initializeDatabase() {
  const db = await connectToDatabase()

  // Wipe all existing app data (collection by collection, no dropDatabase)
  // This avoids requiring admin privileges on the MongoDB server.
  const collectionsToClear = [
    "employees",
    "topics_daily",
    "topics_weekly",
    "uploads",
    "extra_uploads",
    "daily_uploads",
    "weekly_reports",
    "weekly_stats",
    "alert_logs",
    "topics",
  ]

  for (const name of collectionsToClear) {
    try {
      await db.collection(name).deleteMany({})
      console.log(`[v0] Cleared collection: ${name}`)
    } catch (err) {
      console.warn(`[v0] Failed to clear collection ${name} (may not exist yet):`, err)
    }
  }

  console.log("[v0] Collections cleared – starting fresh initialization")

  // Employees data (current, with updated emails & quotas)
  const employees: Omit<Employee, "created_at">[] = [
    // Coding Bytes Group (coders)
    {
      id: 1,
      name: "Aditya Jaiswal",
      role: "coder",
      email: "adityajaiswal.21.11.2002@gmail.com",
      weekly_required_yt: 3,
      weekly_required_insta: 7,
    },
    {
      id: 2,
      name: "Vipin Sharma",
      role: "coder",
      email: "vipinsgnr@gmail.com",
      weekly_required_yt: 3,
      weekly_required_insta: 7,
    },
    {
      id: 3,
      name: "Vikas Sharma",
      role: "coder",
      email: "vikas.sharma@simply2cloud.com",
      weekly_required_yt: 3,
      weekly_required_insta: 7,
    },

    // Pepper Animations Group (peppers)
    {
      id: 4,
      name: "Rohit Asthana",
      role: "pepper",
      email: "Rohit.pepperanimation@gmail.com",
      weekly_required_yt: 3,
      weekly_required_insta: 7,
    },
    {
      id: 5,
      name: "Pawan Sharma",
      role: "pepper",
      email: "Pawans.ps966@gmail.com",
      weekly_required_yt: 3,
      weekly_required_insta: 7,
    },
    {
      id: 6,
      name: "Anu",
      role: "pepper",
      email: "anuwilliam93@gmail.com",
      // Special rule: Anu is only responsible for Instagram (no YouTube quota)
      weekly_required_yt: 0,
      weekly_required_insta: 7,
    },
  ]

  const employeesCollection = db.collection("employees")

  // Insert employees
  for (const employee of employees) {
    await employeesCollection.updateOne(
      { id: employee.id },
      {
        $set: {
          ...employee,
          created_at: new Date(),
        },
      },
      { upsert: true }
    )
  }

  // Create indexes
  await employeesCollection.createIndex({ id: 1 }, { unique: true })
  await employeesCollection.createIndex({ email: 1 }, { unique: true })

  await db.collection("topics_daily").createIndex({ date: 1, employee_id: 1, platform: 1 })
  await db.collection("topics_weekly").createIndex({ week_start: 1, employee_id: 1, platform: 1 })
  await db.collection("uploads").createIndex({ employee_id: 1, date: 1, platform: 1 })
  await db.collection("extra_uploads").createIndex({ employee_id: 1, date: 1, platform: 1 })
  await db.collection("daily_uploads").createIndex({ employee_id: 1, date: 1 }, { unique: true })
  await db.collection("daily_uploads").createIndex({ date: 1 })
  await db.collection("weekly_reports").createIndex({ week: 1, employee_id: 1 }, { unique: true })

  // After employees & indexes are ready, generate today's topics
  const today = formatDateISO(new Date())
  const allEmployees = await employeesCollection.find({}).toArray()

  // Only generate YouTube topics for employees that actually have a YT quota
  const coders = allEmployees.filter(
    (e) => e.role === "coder" && (e.weekly_required_yt ?? 3) > 0
  )
  const peppers = allEmployees.filter(
    (e) => e.role === "pepper" && (e.weekly_required_yt ?? 3) > 0
  )

  const [coderTopicsResponse, pepperTopicsResponse, instaTopicsResponse] = await Promise.all([
    coders.length
      ? generateCoderTopics(coders.map((e) => e.name))
      : Promise.resolve({ coder_topics: [] }),
    peppers.length
      ? generatePepperTopics(peppers.map((e) => e.name))
      : Promise.resolve({ pepper_topics: [] }),
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

  // Save YouTube topics for peppers (editors/animation)
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

  // Shared Instagram topics for all employees (including Anu)
  for (const employee of allEmployees) {
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

  console.log("[v0] Database initialized successfully with employees and today's topics")
  return employees
}
