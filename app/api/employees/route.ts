import { connectToDatabase } from "@/lib/db"
import type { Employee } from "@/lib/types"

const MOCK_EMPLOYEES: Employee[] = [
  { id: 1, name: "Aditya Jaiswal", role: "coder", email: "aditya.jaiswal@example.com", weekly_required_yt: 3, weekly_required_insta: 7 },
  { id: 2, name: "Vipin Sharma", role: "coder", email: "vipin.sharma@example.com", weekly_required_yt: 3, weekly_required_insta: 7 },
  { id: 3, name: "Vikash Sharma", role: "coder", email: "vikash.sharma@example.com", weekly_required_yt: 3, weekly_required_insta: 7 },
  { id: 4, name: "Rohit", role: "pepper", email: "rohit.edit@example.com", weekly_required_yt: 3, weekly_required_insta: 7 },
  { id: 5, name: "Pawan Sharma", role: "pepper", email: "pawan.sharma@example.com", weekly_required_yt: 3, weekly_required_insta: 7 },
  { id: 6, name: "Annu", role: "pepper", email: "annu.edit@example.com", weekly_required_yt: 3, weekly_required_insta: 7 },
]

export async function GET() {
  try {
    const db = await connectToDatabase()
    const employees = await db.collection("employees").find({}).toArray()

    const formattedEmployees = employees.map((emp) => ({
      id: emp.id,
      name: emp.name,
      role: emp.role,
      email: emp.email,
      weekly_required_yt: emp.weekly_required_yt || 3,
      weekly_required_insta: emp.weekly_required_insta || 7,
    }))

    return Response.json(formattedEmployees)
  } catch (error) {
    console.error("Error fetching employees:", error)
    console.log("[v0] Using mock employee data for development")
    return Response.json(MOCK_EMPLOYEES)
  }
}
