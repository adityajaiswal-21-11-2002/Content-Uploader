import { NextRequest, NextResponse } from "next/server"

/**
 * Cron job endpoint: Daily & Weekly Topic Generator (8:00 AM)
 * Generates YouTube topics daily, Instagram topics weekly on Mondays
 * This should be triggered by Vercel Cron or external cron service
 *
 * To set up Vercel Cron, add to vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/daily-topics",
 *     "schedule": "0 8 * * *"
 *   }]
 * }
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authorization
    const authHeader = request.headers.get("authorization")
    const cronSecret = process.env.CRON_SECRET

    // Allow Vercel Cron signature or API key
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      // Check for Vercel Cron header
      const vercelCron = request.headers.get("x-vercel-cron")
      if (vercelCron !== "1") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || request.nextUrl.origin
    const results = []

    // Always generate YouTube topics daily
    const youtubeResponse = await fetch(`${baseUrl}/api/topics/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(cronSecret && { Authorization: `Bearer ${cronSecret}` }),
      },
    })

    const youtubeData = await youtubeResponse.json()

    if (!youtubeResponse.ok) {
      return NextResponse.json(
        { error: "Failed to generate YouTube topics", details: youtubeData },
        { status: youtubeResponse.status }
      )
    }

    results.push({ type: "youtube", data: youtubeData })

    // Check if today is Monday (day 1) and generate Instagram topics
    const today = new Date()
    const isMonday = today.getDay() === 1

    if (isMonday) {
      const instagramResponse = await fetch(`${baseUrl}/api/topics/generate-weekly-insta`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(cronSecret && { Authorization: `Bearer ${cronSecret}` }),
        },
      })

      const instagramData = await instagramResponse.json()

      if (!instagramResponse.ok) {
        console.error("Failed to generate Instagram topics:", instagramData)
        // Don't fail the whole request, just log the error
        results.push({ type: "instagram", error: instagramData })
      } else {
        results.push({ type: "instagram", data: instagramData })
      }
    }

    return NextResponse.json({
      success: true,
      message: `Topics generated successfully${isMonday ? ' (YouTube + Instagram)' : ' (YouTube only)'}`,
      is_monday: isMonday,
      results,
    })
  } catch (error) {
    console.error("Error in daily topics cron job:", error)
    return NextResponse.json(
      { error: "Cron job failed", details: String(error) },
      { status: 500 }
    )
  }
}

