// This is called by a cron job every Monday
export async function POST() {
  try {
    // Delete old weekly stats (optional cleanup)
    // In production, you might keep historical records for reporting

    return Response.json({ success: true, message: "Weekly reset completed" })
  } catch (error) {
    console.error("Error during weekly reset:", error)
    return Response.json({ error: "Failed to reset weekly stats" }, { status: 500 })
  }
}
