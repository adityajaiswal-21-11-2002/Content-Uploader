import { connectToDatabase } from "@/lib/db"
import { formatDateISO } from "@/lib/helpers"
import { ObjectId } from "mongodb"

/**
 * POST /api/upload/mark-done
 * Mark an upload as completed for an employee
 * Body: { employee_id: number, platform: "youtube" | "instagram", video_link: string }
 * video_link is required for both YouTube and Instagram uploads
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { employee_id, platform, video_link } = body

    if (!employee_id || !platform) {
      return Response.json({ error: "employee_id and platform are required" }, { status: 400 })
    }

    if (platform !== "youtube" && platform !== "instagram") {
      return Response.json({ error: "platform must be 'youtube' or 'instagram'" }, { status: 400 })
    }

    // Validate video_link is required for both platforms
    if (!video_link || !video_link.trim()) {
      return Response.json(
        { error: "video_link is required for uploads" },
        { status: 400 }
      )
    }

    // Validate video_link format (basic URL validation)
    try {
      new URL(video_link.trim())
    } catch {
      return Response.json(
        { error: "video_link must be a valid URL" },
        { status: 400 }
      )
    }

    const db = await connectToDatabase()
    const today = formatDateISO(new Date())
    const employeeIdNum = Number.parseInt(employee_id)

    // Insert or update upload record in uploads collection
    const uploadData: any = {
      employee_id: employeeIdNum,
      platform,
      date: today,
      video_link: video_link.trim(),
      created_at: new Date(),
    }

    await db.collection("uploads").updateOne(
      {
        employee_id: employeeIdNum,
        platform,
        date: today,
      },
      {
        $set: uploadData,
      },
      { upsert: true }
    )

    // Update or create daily upload record
    const updateField = platform === "youtube" ? "youtube_done" : "insta_done"
    const videoLinkField = platform === "youtube" ? "youtube_video_link" : "instagram_video_link"
    
    // Build update object - only set the fields we're updating
    const updateData: any = {
      employee_id: employeeIdNum,
      date: today,
      [updateField]: true,
      [videoLinkField]: video_link.trim(),
      updated_at: new Date(),
    }

    // Build setOnInsert only for initial creation - don't include fields already in $set
    const setOnInsertData: any = {
      created_at: new Date(),
    }

    // Only set default values for fields NOT being updated
    if (platform === "youtube") {
      // If updating YouTube, set default for Instagram
      setOnInsertData.insta_done = false
    } else {
      // If updating Instagram, set default for YouTube
      setOnInsertData.youtube_done = false
    }

    await db.collection("daily_uploads").updateOne(
      {
        employee_id: employeeIdNum,
        date: today,
      },
      {
        $set: updateData,
        $setOnInsert: setOnInsertData,
      },
      { upsert: true }
    )

    // Update topic status to completed if exists
    // If topic_id is provided, update only that specific topic
    // Otherwise, update all topics for that platform on that day
    const topicQuery: any = {
      employee_id: employeeIdNum,
      platform,
      date: today,
    }

    // If topic_id is provided, update only that specific topic
    if (body.topic_id) {
      try {
        // Try to convert topic_id to ObjectId
        let topicObjectId: ObjectId | string = body.topic_id
        try {
          topicObjectId = new ObjectId(body.topic_id)
        } catch (error) {
          // If it's not a valid ObjectId format, use as string
          console.log("Topic ID is not ObjectId format, using as string:", body.topic_id)
        }

        // Update the specific topic
        const result = await db.collection("topics_daily").updateOne(
          {
            _id: topicObjectId,
            employee_id: employeeIdNum,
            platform,
            date: today,
          },
          {
            $set: {
              status: "completed",
            },
          }
        )

        // If no topic was found with that ID, fall back to updating all topics
        if (result.matchedCount === 0) {
          console.warn(`Topic ${body.topic_id} not found, updating all topics for platform`)
          await db.collection("topics_daily").updateMany(topicQuery, {
            $set: {
              status: "completed",
            },
          })
        }
      } catch (error) {
        // If there's an error, fall back to updating all topics
        console.error("Error updating topic by ID, updating all topics for platform:", error)
        await db.collection("topics_daily").updateMany(topicQuery, {
          $set: {
            status: "completed",
          },
        })
      }
    } else {
      // No topic_id provided, update all topics for that platform
      await db.collection("topics_daily").updateMany(topicQuery, {
        $set: {
          status: "completed",
        },
      })
    }

    return Response.json({
      success: true,
      message: `Upload marked as done for ${platform}`,
      employee_id: Number.parseInt(employee_id),
      platform,
      date: today,
      video_link: video_link.trim(),
    })
  } catch (error: any) {
    console.error("Error marking upload as done:", error)
    const errorMessage = error?.message || "Failed to mark upload as done"
    console.error("Error details:", {
      message: errorMessage,
      stack: error?.stack,
      code: error?.code,
    })
    return Response.json(
      { error: errorMessage, details: error?.message },
      { status: 500 }
    )
  }
}

