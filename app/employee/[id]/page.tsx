"use client"

import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import type { Employee } from "@/lib/types"
import WeeklyProgress from "@/components/weekly-progress"
import DailyTrackingCalendar from "@/components/daily-tracking-calendar"
import MonthlyStatsCard from "@/components/monthly-stats-card"
import EmployeeTracking from "@/components/analytics/employee-tracking"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { formatDateISO, getRequiredQuota } from "@/lib/helpers"
import { ArrowLeft, CheckCircle2, Circle, Youtube, Instagram, AlertCircle, Clock } from "lucide-react"
import { toast } from "sonner"
import { LoadingLottie } from "@/components/ui/loading-lottie"

interface TodayTopics {
  date: string
  youtube: {
    id: string
    topic: string
    status: string
  } | null
  instagram: Array<{
    id: string
    topic: string
    status: string
  }>
}

interface DayActivity {
  date: string
  youtubeDone: boolean
  instagramDone: boolean
}

interface EmployeeActivity {
  employee_id: number
  days: number
  activity: DayActivity[]
  lastAlert: {
    date: string
    sent_at: string
  } | null
}

export default function EmployeeDashboardPage() {
  const router = useRouter()
  const params = useParams()
  const employeeId = params.id as string

  const [employee, setEmployee] = useState<Employee | null>(null)
  const [topics, setTopics] = useState<TodayTopics | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState<string | null>(null)
  const [activity, setActivity] = useState<EmployeeActivity | null>(null)
  const [refreshKey, setRefreshKey] = useState(0) // Key to force refresh of DailyTrackingCalendar
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null) // Selected topic ID for input
  const [videoLinkInputs, setVideoLinkInputs] = useState<Record<string, string>>({}) // Video links by topic ID
  const [extraPlatform, setExtraPlatform] = useState<"youtube" | "instagram">("youtube")
  const [extraVideoLink, setExtraVideoLink] = useState("")
  const [extraDate, setExtraDate] = useState<string>(() => formatDateISO(new Date()))
  const [savingExtra, setSavingExtra] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch employee
        const empResponse = await fetch("/api/employees")
        if (!empResponse.ok) {
          throw new Error("Failed to fetch employees")
        }
        const employees = await empResponse.json()
        const emp = employees.find((e: Employee) => e.id === Number.parseInt(employeeId))
        if (!emp) {
          toast.error("Employee not found")
          return
        }
        setEmployee(emp)

        // Fetch today's topics
        const topicsResponse = await fetch(`/api/topics/today/${employeeId}`)
        if (topicsResponse.ok) {
          const topicsData = await topicsResponse.json()
          console.log("Topics data received:", topicsData)
          setTopics(topicsData)
        } else {
          const errorData = await topicsResponse.json().catch(() => ({}))
          console.error("Failed to fetch topics:", topicsResponse.status, errorData)
          // Don't show error toast for missing topics (they might not be generated yet)
          setTopics(null)
        }

        // Fetch recent activity (last 7 days + last alert)
        const activityResponse = await fetch(`/api/employee/activity?employeeId=${employeeId}&days=7`)
        if (activityResponse.ok) {
          const activityData = await activityResponse.json()
          setActivity(activityData)
        }
      } catch (error) {
        console.error("Error fetching data:", error)
        toast.error("Failed to load data")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
    const interval = setInterval(fetchData, 60000) // Refresh every minute
    return () => clearInterval(interval)
  }, [employeeId])

  const handleTopicClick = (topicId: string, platform: "youtube" | "instagram") => {
    // If already selected, deselect it
    if (selectedTopic === topicId) {
      setSelectedTopic(null)
      return
    }
    setSelectedTopic(topicId)
    // Initialize input if not exists
    if (!videoLinkInputs[topicId]) {
      setVideoLinkInputs((prev) => ({ ...prev, [topicId]: "" }))
    }
  }

  const handleMarkUpload = async (platform: "youtube" | "instagram", topicId?: string) => {
    // Get the video link for the specific topic
    const videoLink = topicId ? videoLinkInputs[topicId] : ""

    // Validate video link is required
    if (!videoLink || !videoLink.trim()) {
      toast.error(`Please enter the ${platform === "youtube" ? "YouTube" : "Instagram"} video link`)
      return
    }

    // Validate URL format
    try {
      new URL(videoLink.trim())
    } catch {
      toast.error(`Please enter a valid URL for the ${platform === "youtube" ? "YouTube" : "Instagram"} video link`)
      return
    }

    setUploading(topicId || platform)
    try {
      const requestBody = {
        employee_id: Number.parseInt(employeeId),
        platform,
        video_link: videoLink.trim(),
        topic_id: topicId, // Include topic ID if provided
      }

      const response = await fetch("/api/upload/mark-done", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.error || errorData.details || "Failed to mark upload"
        console.error("Upload error:", errorData)
        throw new Error(errorMessage)
      }

      toast.success(`${platform === "youtube" ? "YouTube" : "Instagram"} upload marked as done!`)
      
      // Clear video link input after successful upload
      if (topicId) {
        setVideoLinkInputs((prev) => {
          const updated = { ...prev }
          delete updated[topicId]
          return updated
        })
        setSelectedTopic(null)
      }
      
      // Refresh topics to update status
      const topicsResponse = await fetch(`/api/topics/today/${employeeId}`)
      if (topicsResponse.ok) {
        const topicsData = await topicsResponse.json()
        setTopics(topicsData)
      }

      // Refresh activity and daily tracking
      const activityResponse = await fetch(`/api/employee/activity?employeeId=${employeeId}&days=7`)
      if (activityResponse.ok) {
        const activityData = await activityResponse.json()
        setActivity(activityData)
      }

      // Force refresh of daily tracking calendar
      setRefreshKey((prev) => prev + 1)
    } catch (error: any) {
      console.error("Error marking upload:", error)
      const errorMessage = error?.message || "Failed to mark upload"
      toast.error(errorMessage)
    } finally {
      setUploading(null)
    }
  }

  const handleAddExtraUpload = async () => {
    if (!extraVideoLink.trim()) {
      toast.error("Please enter the video link")
      return
    }

    try {
      new URL(extraVideoLink.trim())
    } catch {
      toast.error("Please enter a valid URL for the video link")
      return
    }

    setSavingExtra(true)
    try {
      const response = await fetch("/api/upload/extra", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employee_id: Number.parseInt(employeeId),
          platform: extraPlatform,
          video_link: extraVideoLink.trim(),
          date: extraDate,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.error || errorData.details || "Failed to save extra upload"
        throw new Error(errorMessage)
      }

      toast.success("Extra upload saved successfully")
      setExtraVideoLink("")
      setExtraDate(formatDateISO(new Date()))
    } catch (error: any) {
      console.error("Error saving extra upload:", error)
      toast.error(error?.message || "Failed to save extra upload")
    } finally {
      setSavingExtra(false)
    }
  }

  if (loading || !employee) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingLottie message="Loading employee dashboard..." />
      </div>
    )
  }

  const quota = getRequiredQuota(employee.role, employee)

  return (
    <div className="min-h-screen bg-background px-4 py-6 sm:p-6">
      <div className="max-w-4xl mx-auto w-full">
        <Button
          onClick={() => router.push("/")}
          variant="outline"
          className="mb-6 gap-2 w-full sm:w-auto justify-center"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Button>

        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">{employee.name}</h1>
          <p className="text-muted-foreground">
            {employee.role === "coder" ? "Coder" : "Pepper"} - {quota.youtube} YouTube videos/week, {quota.insta} Instagram posts/week
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Today's YouTube Topic */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Youtube className="w-5 h-5 text-red-500" />
                  Today's YouTube Topic
                </CardTitle>
                <CardDescription>{formatDateISO(new Date())}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {topics?.youtube ? (
                  <>
                    <div
                      onClick={() => topics.youtube.status !== "completed" && handleTopicClick(topics.youtube.id, "youtube")}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        topics.youtube.status === "completed"
                          ? "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800"
                          : selectedTopic === topics.youtube.id
                            ? "bg-primary/10 border-primary"
                            : "bg-accent/10 border-accent hover:bg-accent/20"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="text-foreground font-medium">{topics.youtube.topic}</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Status: <span className="capitalize">{topics.youtube.status}</span>
                          </p>
                          {topics.youtube.status === "completed" && (
                            <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                              ✓ Upload completed
                            </p>
                          )}
                        </div>
                        {topics.youtube.status === "completed" && (
                          <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                        )}
                      </div>
                    </div>
                    
                    {/* YouTube Video Link Input - Show when topic is selected */}
                    {selectedTopic === topics.youtube.id && topics.youtube.status !== "completed" && (
                      <div className="space-y-3 p-4 bg-muted/50 rounded-lg border">
                        <div className="space-y-2">
                          <Label htmlFor={`youtube-video-link-${topics.youtube.id}`} className="text-sm font-medium">
                            YouTube Video Link <span className="text-destructive">*</span>
                          </Label>
                          <Input
                            id={`youtube-video-link-${topics.youtube.id}`}
                            type="url"
                            placeholder="https://www.youtube.com/watch?v=..."
                            value={videoLinkInputs[topics.youtube.id] || ""}
                            onChange={(e) =>
                              setVideoLinkInputs((prev) => ({
                                ...prev,
                                [topics.youtube.id]: e.target.value,
                              }))
                            }
                            disabled={uploading === topics.youtube.id}
                            className="w-full"
                          />
                          <p className="text-xs text-muted-foreground">
                            Paste the URL of your YouTube video here
                          </p>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleMarkUpload("youtube", topics.youtube.id)}
                            disabled={uploading === topics.youtube.id || !videoLinkInputs[topics.youtube.id]?.trim()}
                            className="flex-1"
                          >
                            {uploading === topics.youtube.id ? "Marking..." : "Mark Upload Done"}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setSelectedTopic(null)
                              setVideoLinkInputs((prev) => {
                                const updated = { ...prev }
                                delete updated[topics.youtube.id]
                                return updated
                              })
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="p-4 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200 font-medium mb-1">
                      No YouTube topic assigned for today yet.
                    </p>
                    <p className="text-xs text-yellow-700 dark:text-yellow-300">
                      Topics are automatically generated at 8:00 AM daily. If you don't see topics, ask an admin to generate them manually from the Admin Dashboard.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Today's Instagram Topics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Instagram className="w-5 h-5 text-pink-500" />
                  Today's Instagram Topics
                </CardTitle>
                <CardDescription>7 topics shared by all employees</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {topics?.instagram && topics.instagram.length > 0 ? (
                  <>
                    <div className="space-y-2">
                      {topics.instagram.map((topic, idx) => (
                        <div key={topic.id}>
                          <div
                            onClick={() => topic.status !== "completed" && handleTopicClick(topic.id, "instagram")}
                            className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                              topic.status === "completed"
                                ? "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800"
                                : selectedTopic === topic.id
                                  ? "bg-primary/10 border-primary"
                                  : "bg-accent/10 border-accent hover:bg-accent/20"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-sm text-foreground flex-1 font-medium">
                                {idx + 1}. {topic.topic}
                              </p>
                              {topic.status === "completed" ? (
                                <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                              ) : (
                                <p className="text-xs text-muted-foreground shrink-0">Click to add link</p>
                              )}
                            </div>
                            {topic.status === "completed" && (
                              <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                                ✓ Upload completed
                              </p>
                            )}
                          </div>

                          {/* Instagram Video Link Input - Show when topic is selected */}
                          {selectedTopic === topic.id && topic.status !== "completed" && (
                            <div className="mt-2 space-y-3 p-4 bg-muted/50 rounded-lg border">
                              <div className="space-y-2">
                                <Label htmlFor={`instagram-video-link-${topic.id}`} className="text-sm font-medium">
                                  Instagram Video Link <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                  id={`instagram-video-link-${topic.id}`}
                                  type="url"
                                  placeholder="https://www.instagram.com/reel/..."
                                  value={videoLinkInputs[topic.id] || ""}
                                  onChange={(e) =>
                                    setVideoLinkInputs((prev) => ({
                                      ...prev,
                                      [topic.id]: e.target.value,
                                    }))
                                  }
                                  disabled={uploading === topic.id}
                                  className="w-full"
                                />
                                <p className="text-xs text-muted-foreground">
                                  Paste the URL of your Instagram reel/post here
                                </p>
                              </div>

                              <div className="flex gap-2">
                                <Button
                                  onClick={() => handleMarkUpload("instagram", topic.id)}
                                  disabled={uploading === topic.id || !videoLinkInputs[topic.id]?.trim()}
                                  className="flex-1"
                                >
                                  {uploading === topic.id ? "Marking..." : "Mark Upload Done"}
                                </Button>
                                <Button
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedTopic(null)
                                    setVideoLinkInputs((prev) => {
                                      const updated = { ...prev }
                                      delete updated[topic.id]
                                      return updated
                                    })
                                  }}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="p-4 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200 font-medium mb-1">
                      No Instagram topics assigned for today yet.
                    </p>
                    <p className="text-xs text-yellow-700 dark:text-yellow-300">
                      Topics are automatically generated at 8:00 AM daily. If you don't see topics, ask an admin to generate them manually from the Admin Dashboard.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Weekly Progress */}
            <Card>
              <CardHeader>
                <CardTitle>This Week's Progress</CardTitle>
                <CardDescription>Target quotas</CardDescription>
              </CardHeader>
              <CardContent>
                <WeeklyProgress employee={employee} />
              </CardContent>
            </Card>

            {/* Daily Tracking Calendar - Last 30 Days */}
            <DailyTrackingCalendar key={refreshKey} employeeId={employee.id} days={30} />

            {/* Monthly Statistics */}
            <Card>
              <CardHeader>
                <CardTitle>Monthly Statistics</CardTitle>
                <CardDescription>This month's upload performance</CardDescription>
              </CardHeader>
              <CardContent>
                <MonthlyStatsCard employeeId={employee.id} />
              </CardContent>
            </Card>

            {/* Analytics */}
            <Card>
              <CardHeader>
                <CardTitle>Analytics & Charts</CardTitle>
                <CardDescription>Visual analytics of your upload performance</CardDescription>
              </CardHeader>
              <CardContent>
                <EmployeeTracking employeeId={employee.id} />
              </CardContent>
            </Card>
          </div>

          <div>
            {/* Info Card */}
            <Card>
              <CardHeader>
                <CardTitle>Weekly Requirements</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-accent/10 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Youtube className="w-4 h-4 text-red-500" />
                    <span className="text-sm">YouTube</span>
                  </div>
                  <span className="font-semibold">{quota.youtube}/week</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-accent/10 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Instagram className="w-4 h-4 text-pink-500" />
                    <span className="text-sm">Instagram</span>
                  </div>
                  <span className="font-semibold">{quota.insta}/week</span>
                </div>
              </CardContent>
            </Card>

            {/* Alerts & Status */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Alerts & Status</CardTitle>
                <CardDescription>Compliance notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {activity?.lastAlert ? (
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Last alert sent</p>
                      <p className="text-xs text-muted-foreground">
                        Date: {activity.lastAlert.date}
                        <br />
                        At: {new Date(activity.lastAlert.sent_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-foreground">No alerts this week</p>
                      <p className="text-xs text-muted-foreground">
                        Keep uploading consistently to maintain a clean record.
                      </p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  <span>Compliance checks run every night at 11:59 PM.</span>
                </div>
              </CardContent>
            </Card>

            {/* Extra uploads section */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Extra Videos</CardTitle>
                <CardDescription>
                  Log additional YouTube or Instagram videos beyond today&apos;s mandatory topics.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Platform</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={extraPlatform === "youtube" ? "default" : "outline"}
                      className="flex-1 gap-2"
                      onClick={() => setExtraPlatform("youtube")}
                    >
                      <Youtube className="w-4 h-4 text-red-500" />
                      YouTube
                    </Button>
                    <Button
                      type="button"
                      variant={extraPlatform === "instagram" ? "default" : "outline"}
                      className="flex-1 gap-2"
                      onClick={() => setExtraPlatform("instagram")}
                    >
                      <Instagram className="w-4 h-4 text-pink-500" />
                      Instagram
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="extra-date" className="text-sm font-medium">
                    Date
                  </Label>
                  <Input
                    id="extra-date"
                    type="date"
                    value={extraDate}
                    onChange={(e) => setExtraDate(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="extra-video-link" className="text-sm font-medium">
                    Video link
                  </Label>
                  <Input
                    id="extra-video-link"
                    type="url"
                    placeholder={
                      extraPlatform === "youtube"
                        ? "https://www.youtube.com/watch?v=..."
                        : "https://www.instagram.com/reel/..."
                    }
                    value={extraVideoLink}
                    onChange={(e) => setExtraVideoLink(e.target.value)}
                    disabled={savingExtra}
                  />
                </div>

                <Button
                  type="button"
                  onClick={handleAddExtraUpload}
                  disabled={savingExtra || !extraVideoLink.trim()}
                  className="w-full"
                >
                  {savingExtra ? "Saving..." : "Save Extra Video"}
                </Button>

                <p className="text-xs text-muted-foreground">
                  Extra videos do not affect your mandatory daily checklist but will appear in admin
                  video lists and daily links views.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
