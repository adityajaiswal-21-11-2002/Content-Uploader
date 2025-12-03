import { initializeDatabase } from "@/lib/init-db"

/**
 * GET /api/init - Initialize database via browser
 * POST /api/init - Initialize database via API call
 * Initialize database with employee data
 * This should be called once to set up the database
 */
export async function GET() {
  try {
    const employees = await initializeDatabase()
    return Response.json({
      success: true,
      message: "Database initialized successfully",
      employees: employees.length,
      employees_data: employees.map((emp) => ({
        id: emp.id,
        name: emp.name,
        role: emp.role,
        email: emp.email,
      })),
    })
  } catch (error) {
    console.error("Error initializing database:", error)
    return Response.json(
      { error: "Failed to initialize database", details: String(error) },
      { status: 500 }
    )
  }
}

export async function POST() {
  return GET()
}

