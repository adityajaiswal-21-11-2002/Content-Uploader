const { connectToDatabase } = require("../lib/db")
const { getWeekStartDate, formatDateISO } = require("../lib/helpers")

async function updateWeeklyStats() {
  try {
    console.log("🔄 Updating weekly stats to include extra uploads...")

    const db = await connectToDatabase()

    // Get all weekly stats records
    const weeklyStats = await db.collection("weekly_stats").find({}).toArray()
    console.log(`📊 Found ${weeklyStats.length} weekly stats records to update`)

    let updated = 0
    let skipped = 0

    for (const stat of weeklyStats) {
      const employeeId = stat.employee_id
      const weekStart = stat.week_start_date

      // Calculate week end
      const weekEnd = new Date(new Date(weekStart).getTime() + 7 * 24 * 60 * 60 * 1000)

      // Get mandatory uploads for the week
      const dailyUploads = await db
        .collection("daily_uploads")
        .find({
          employee_id: employeeId,
          date: { $gte: weekStart, $lt: formatDateISO(weekEnd) },
        })
        .toArray()

      // Get extra uploads for the week
      const extraUploads = await db
        .collection("extra_uploads")
        .find({
          employee_id: employeeId,
          date: { $gte: weekStart, $lt: formatDateISO(weekEnd) },
        })
        .toArray()

      // Count mandatory uploads
      const mandatoryInsta = dailyUploads.filter((u) => u.insta_done).length
      const mandatoryYoutube = dailyUploads.filter((u) => u.youtube_done).length

      // Count extra uploads
      const extraInsta = extraUploads.filter((u) => u.platform === "instagram").length
      const extraYoutube = extraUploads.filter((u) => u.platform === "youtube").length

      // Total counts (mandatory + extra)
      const newInstaCount = mandatoryInsta + extraInsta
      const newYoutubeCount = mandatoryYoutube + extraYoutube

      // Check if update is needed
      if (newInstaCount !== stat.insta_count || newYoutubeCount !== stat.youtube_count) {
        await db.collection("weekly_stats").updateOne(
          { _id: stat._id },
          {
            $set: {
              insta_count: newInstaCount,
              youtube_count: newYoutubeCount,
              updated_at: new Date(),
            },
          }
        )
        console.log(`✅ Updated ${stat.employee_id} for week ${weekStart}: YT ${stat.youtube_count} → ${newYoutubeCount}, IG ${stat.insta_count} → ${newInstaCount}`)
        updated++
      } else {
        skipped++
      }
    }

    console.log(`🎉 Weekly stats update complete:`)
    console.log(`   📈 Updated: ${updated} records`)
    console.log(`   ⏭️  Skipped: ${skipped} records (already up to date)`)

    process.exit(0)
  } catch (error) {
    console.error("❌ Error updating weekly stats:", error)
    process.exit(1)
  }
}

updateWeeklyStats()
