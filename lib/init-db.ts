import { connectToDatabase } from "./db"
import type { Employee } from "./types"

/**
 * Initialize database with employee data
 */
export async function initializeDatabase() {
  const db = await connectToDatabase()

  // Employees data
  const employees: Omit<Employee, "created_at">[] = [
    {
      id: 1,
      name: "Aditya Jaiswal",
      role: "coder",
      email: "aditya.jaiswal@example.com",
      weekly_required_yt: 3,
      weekly_required_insta: 7,
    },
    {
      id: 2,
      name: "Vipin Sharma",
      role: "coder",
      email: "vipin.sharma@example.com",
      weekly_required_yt: 3,
      weekly_required_insta: 7,
    },
    {
      id: 3,
      name: "Vikash Sharma",
      role: "coder",
      email: "vikash.sharma@example.com",
      weekly_required_yt: 3,
      weekly_required_insta: 7,
    },
    {
      id: 4,
      name: "Rohit",
      role: "peeper",
      email: "rohit.edit@example.com",
      weekly_required_yt: 3,
      weekly_required_insta: 7,
    },
    {
      id: 5,
      name: "Pawan Sharma",
      role: "peeper",
      email: "pawan.sharma@example.com",
      weekly_required_yt: 3,
      weekly_required_insta: 7,
    },
    {
      id: 6,
      name: "Annu",
      role: "peeper",
      email: "annu.edit@example.com",
      weekly_required_yt: 3,
      weekly_required_insta: 7,
    },
  ]

  const employeesCollection = db.collection("employees")

  // Upsert employees
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
  await db.collection("uploads").createIndex({ employee_id: 1, date: 1, platform: 1 })
  await db.collection("daily_uploads").createIndex({ employee_id: 1, date: 1 }, { unique: true })
  await db.collection("daily_uploads").createIndex({ date: 1 })
  await db.collection("weekly_reports").createIndex({ week: 1, employee_id: 1 }, { unique: true })

  console.log("[v0] Database initialized successfully")
  return employees
}

