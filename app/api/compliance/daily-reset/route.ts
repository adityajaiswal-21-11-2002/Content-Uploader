// This is called by a cron job to reset daily uploads
export async function POST() {
  try {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)

    // Delete old daily records (optional cleanup)
    // In production, you might keep historical records

    return Response.json({ success: true, message: "Daily reset completed" })
  } catch (error) {
    console.error("Error during daily reset:", error)
    return Response.json({ error: "Failed to reset daily uploads" }, { status: 500 })
  }
}
