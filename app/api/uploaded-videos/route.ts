import { connectToDatabase } from "@/lib/db"
import { formatDateISO, getWeekStartDate } from "@/lib/helpers"

/**
 * GET /api/uploaded-videos
 * Get all uploaded videos with links for all employees
 * Query params:
 * - employeeId: filter by specific employee (optional)
 * - platform: filter by platform "youtube" | "instagram" (optional)
 * - startDate: start date (YYYY-MM-DD) (optional)
 * - endDate: end date (YYYY-MM-DD) (optional)
 * - days: number of days to fetch (default: 30)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const employeeIdParam = searchParams.get("employeeId")
    const platformParam = searchParams.get("platform")
    const startDateParam = searchParams.get("startDate")
    const endDateParam = searchParams.get("endDate")
    const daysParam = searchParams.get("days")

    const db = await connectToDatabase()

    let startDate: Date
    let endDate: Date = new Date()

    if (startDateParam && endDateParam) {
      startDate = new Date(startDateParam)
      endDate = new Date(endDateParam)
    } else {
      const days = daysParam ? Number.parseInt(daysParam) : 30
      startDate = new Date()
      startDate.setDate(startDate.getDate() - days)
    }

    const startDateStr = formatDateISO(startDate)
    const endDateStr = formatDateISO(endDate)

    // Build query
    const query: any = {
      date: { $gte: startDateStr, $lte: endDateStr },
    }

    if (employeeIdParam) {
      query.employee_id = Number.parseInt(employeeIdParam)
    }

    // Get daily uploads with video links
    const dailyUploads = await db
      .collection("daily_uploads")
      .find(query)
      .sort({ date: -1, employee_id: 1 })
      .toArray()

    // Get employees for names
    const employees = await db.collection("employees").find({}).toArray()
    const employeeMap = new Map(employees.map((e) => [e.id, e]))

    // Get daily topics (YouTube) for additional context
    const dailyTopics = await db
      .collection("topics_daily")
      .find({
        date: { $gte: startDateStr, $lte: endDateStr },
      })
      .toArray()

    // Get weekly topics (Instagram) for additional context
    // Find all week starts within the date range
    const weekStarts = new Set<string>()
    let currentDate = new Date(startDate)
    while (currentDate <= endDate) {
      const weekStart = getWeekStartDate(currentDate)
      weekStarts.add(formatDateISO(weekStart))
      currentDate.setDate(currentDate.getDate() + 7) // Move to next week
    }

    const weeklyTopics = await db
      .collection("topics_weekly")
      .find({
        week_start: { $in: Array.from(weekStarts) },
      })
      .toArray()

    const topicMap = new Map()
    // Add daily topics (YouTube)
    dailyTopics.forEach((t) => {
      const key = `${t.employee_id}-${t.date}-${t.platform}`
      topicMap.set(key, t.topic)
    })
    // Add weekly topics (Instagram) - map to each day of the week
    weeklyTopics.forEach((t) => {
      // For each day in the week, map the Instagram topic
      let weekDate = new Date(t.week_start)
      for (let i = 0; i < 7; i++) {
        const dateStr = formatDateISO(weekDate)
        if (dateStr >= startDateStr && dateStr <= endDateStr) {
          const key = `${t.employee_id}-${dateStr}-${t.platform}`
          topicMap.set(key, t.topic)
        }
        weekDate.setDate(weekDate.getDate() + 1)
      }
    })

    // Build video list
    const videos: any[] = []

    // Mandatory (daily) uploads
    dailyUploads.forEach((upload) => {
      const employee = employeeMap.get(upload.employee_id)
      if (!employee) return

      // YouTube videos
      if (upload.youtube_done && upload.youtube_video_link) {
        if (!platformParam || platformParam === "youtube") {
          let topicName = "No topic assigned"

          // If topic_id is stored with the upload, use it to find the specific topic
          if (upload.topic_id) {
            try {
              // Try to find the specific topic by ID
              const dailyTopic = dailyTopics.find(t =>
                t._id?.toString() === upload.topic_id ||
                t._id === upload.topic_id
              )
              if (dailyTopic) {
                topicName = dailyTopic.topic
              } else {
                // Fallback to topic map if specific topic not found
                const topicKey = `${upload.employee_id}-${upload.date}-youtube`
                topicName = topicMap.get(topicKey) || "No topic assigned"
              }
            } catch (error) {
              // Fallback if topic_id is invalid
              const topicKey = `${upload.employee_id}-${upload.date}-youtube`
              topicName = topicMap.get(topicKey) || "No topic assigned"
            }
          } else {
            // No topic_id stored, use the old logic
            const topicKey = `${upload.employee_id}-${upload.date}-youtube`
            topicName = topicMap.get(topicKey) || "No topic assigned"
          }

          videos.push({
            id: `${upload.employee_id}-${upload.date}-youtube`,
            employee_id: upload.employee_id,
            employee_name: employee.name,
            employee_email: employee.email,
            platform: "youtube",
            date: upload.date,
            video_link: upload.youtube_video_link,
            topic: topicName,
            created_at: upload.created_at || upload.updated_at,
          })
        }
      }

      // Instagram videos
      if (upload.insta_done && upload.instagram_video_link) {
        if (!platformParam || platformParam === "instagram") {
          let topicName = "No topic assigned"

          // If topic_id is stored with the upload, use it to find the specific topic
          if (upload.topic_id) {
            try {
              // Try to find the specific topic by ID
              const weeklyTopic = weeklyTopics.find(t =>
                t._id?.toString() === upload.topic_id ||
                t._id === upload.topic_id
              )
              if (weeklyTopic) {
                topicName = weeklyTopic.topic
              } else {
                // Fallback to topic map if specific topic not found
                const topicKey = `${upload.employee_id}-${upload.date}-instagram`
                topicName = topicMap.get(topicKey) || "No topic assigned"
              }
            } catch (error) {
              // Fallback if topic_id is invalid
              const topicKey = `${upload.employee_id}-${upload.date}-instagram`
              topicName = topicMap.get(topicKey) || "No topic assigned"
            }
          } else {
            // No topic_id stored, use the old logic
            const topicKey = `${upload.employee_id}-${upload.date}-instagram`
            topicName = topicMap.get(topicKey) || "No topic assigned"
          }

          videos.push({
            id: `${upload.employee_id}-${upload.date}-instagram`,
            employee_id: upload.employee_id,
            employee_name: employee.name,
            employee_email: employee.email,
            platform: "instagram",
            date: upload.date,
            video_link: upload.instagram_video_link,
            topic: topicName,
            created_at: upload.created_at || upload.updated_at,
          })
        }
      }
    })

    // Extra uploads beyond mandatory ones
    const extraQuery: any = {
      date: { $gte: startDateStr, $lte: endDateStr },
    }

    if (employeeIdParam) {
      extraQuery.employee_id = Number.parseInt(employeeIdParam)
    }

    const extraUploads = await db
      .collection("extra_uploads")
      .find(extraQuery)
      .sort({ date: -1, employee_id: 1, created_at: -1 })
      .toArray()

    extraUploads.forEach((upload) => {
      const employee = employeeMap.get(upload.employee_id)
      if (!employee) return

      if (!platformParam || platformParam === upload.platform) {
        videos.push({
          id: `${upload.employee_id}-${upload.date}-${upload.platform}-extra-${upload._id?.toString()}`,
          employee_id: upload.employee_id,
          employee_name: employee.name,
          employee_email: employee.email,
          platform: upload.platform,
          date: upload.date,
          video_link: upload.video_link,
          topic: "Extra video",
          created_at: upload.created_at,
        })
      }
    })

    // Sort by date (newest first)
    videos.sort((a, b) => {
      const dateA = new Date(a.date).getTime()
      const dateB = new Date(b.date).getTime()
      if (dateA !== dateB) return dateB - dateA
      return a.employee_name.localeCompare(b.employee_name)
    })

    return Response.json({
      startDate: startDateStr,
      endDate: endDateStr,
      total: videos.length,
      videos,
    })
  } catch (error) {
    console.error("Error fetching uploaded videos:", error)
    return Response.json({ error: "Failed to fetch uploaded videos" }, { status: 500 })
  }
}

