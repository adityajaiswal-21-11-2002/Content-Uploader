import { connectToDatabase } from "@/lib/db"
import { formatDateISO } from "@/lib/helpers"

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

    // Get topics for additional context
    const topics = await db
      .collection("topics_daily")
      .find({
        date: { $gte: startDateStr, $lte: endDateStr },
      })
      .toArray()

    const topicMap = new Map()
    topics.forEach((t) => {
      const key = `${t.employee_id}-${t.date}-${t.platform}`
      topicMap.set(key, t.topic)
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
          const topicKey = `${upload.employee_id}-${upload.date}-youtube`
          videos.push({
            id: `${upload.employee_id}-${upload.date}-youtube`,
            employee_id: upload.employee_id,
            employee_name: employee.name,
            employee_email: employee.email,
            platform: "youtube",
            date: upload.date,
            video_link: upload.youtube_video_link,
            topic: topicMap.get(topicKey) || "No topic assigned",
            created_at: upload.created_at || upload.updated_at,
          })
        }
      }

      // Instagram videos
      if (upload.insta_done && upload.instagram_video_link) {
        if (!platformParam || platformParam === "instagram") {
          const topicKey = `${upload.employee_id}-${upload.date}-instagram`
          videos.push({
            id: `${upload.employee_id}-${upload.date}-instagram`,
            employee_id: upload.employee_id,
            employee_name: employee.name,
            employee_email: employee.email,
            platform: "instagram",
            date: upload.date,
            video_link: upload.instagram_video_link,
            topic: topicMap.get(topicKey) || "No topic assigned",
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

