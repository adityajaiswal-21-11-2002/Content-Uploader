import { NextRequest, NextResponse } from "next/server"

/**
 * Cron job endpoint: Daily Topic Generator (8:00 AM)
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

    // Call the topic generation endpoint
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || request.nextUrl.origin
    const response = await fetch(`${baseUrl}/api/topics/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(cronSecret && { Authorization: `Bearer ${cronSecret}` }),
      },
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to generate topics", details: data },
        { status: response.status }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Daily topics generated successfully",
      data,
    })
  } catch (error) {
    console.error("Error in daily topics cron job:", error)
    return NextResponse.json(
      { error: "Cron job failed", details: String(error) },
      { status: 500 }
    )
  }
}

