"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Youtube, Instagram, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { LoadingLottie } from "@/components/ui/loading-lottie"

interface Video {
  id: string
  employee_id: number
  employee_name: string
  employee_email: string
  platform: "youtube" | "instagram"
  date: string
  video_link: string
  topic: string
  created_at: string
}

export default function UploadedVideosTable() {
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)
  const [filteredVideos, setFilteredVideos] = useState<Video[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [platformFilter, setPlatformFilter] = useState<string>("all")
  const [daysFilter, setDaysFilter] = useState<string>("30")

  useEffect(() => {
    fetchVideos()
  }, [daysFilter])

  useEffect(() => {
    filterVideos()
  }, [videos, searchTerm, platformFilter])

  const fetchVideos = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/uploaded-videos?days=${daysFilter}`)
      if (response.ok) {
        const data = await response.json()
        setVideos(data.videos || [])
      }
    } catch (error) {
      console.error("Error fetching videos:", error)
    } finally {
      setLoading(false)
    }
  }

  const filterVideos = () => {
    let filtered = [...videos]

    // Filter by platform
    if (platformFilter !== "all") {
      filtered = filtered.filter((v) => v.platform === platformFilter)
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (v) =>
          v.employee_name.toLowerCase().includes(term) ||
          v.topic.toLowerCase().includes(term) ||
          v.video_link.toLowerCase().includes(term)
      )
    }

    setFilteredVideos(filtered)
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  if (loading) {
    return <LoadingLottie message="Loading uploaded videos..." />
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search by employee name, topic, or video link..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
        <Select value={platformFilter} onValueChange={setPlatformFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Platform" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Platforms</SelectItem>
            <SelectItem value="youtube">YouTube</SelectItem>
            <SelectItem value="instagram">Instagram</SelectItem>
          </SelectContent>
        </Select>
        <Select value={daysFilter} onValueChange={setDaysFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="14">Last 14 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="60">Last 60 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={fetchVideos}>
          Refresh
        </Button>
      </div>

      {/* Summary */}
      <div className="flex gap-4 text-sm">
        <div className="px-3 py-2 bg-muted rounded-lg">
          <span className="text-muted-foreground">Total Videos: </span>
          <span className="font-semibold">{filteredVideos.length}</span>
        </div>
        <div className="px-3 py-2 bg-muted rounded-lg">
          <span className="text-muted-foreground">YouTube: </span>
          <span className="font-semibold text-red-500">
            {filteredVideos.filter((v) => v.platform === "youtube").length}
          </span>
        </div>
        <div className="px-3 py-2 bg-muted rounded-lg">
          <span className="text-muted-foreground">Instagram: </span>
          <span className="font-semibold text-pink-500">
            {filteredVideos.filter((v) => v.platform === "instagram").length}
          </span>
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left py-3 px-4 font-semibold text-foreground">Date</th>
                <th className="text-left py-3 px-4 font-semibold text-foreground">Employee</th>
                <th className="text-left py-3 px-4 font-semibold text-foreground">Platform</th>
                <th className="text-left py-3 px-4 font-semibold text-foreground">Topic</th>
                <th className="text-left py-3 px-4 font-semibold text-foreground">Video Link</th>
              </tr>
            </thead>
            <tbody>
              {filteredVideos.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-muted-foreground">
                    No videos found. Try adjusting your filters.
                  </td>
                </tr>
              ) : (
                filteredVideos.map((video) => (
                  <tr
                    key={video.id}
                    className="border-b border-border hover:bg-muted/50 transition-colors"
                  >
                    <td className="py-3 px-4 text-foreground">{formatDate(video.date)}</td>
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium text-foreground">{video.employee_name}</p>
                        <p className="text-xs text-muted-foreground">{video.employee_email}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {video.platform === "youtube" ? (
                          <>
                            <Youtube className="w-4 h-4 text-red-500" />
                            <span className="text-red-500 font-medium">YouTube</span>
                          </>
                        ) : (
                          <>
                            <Instagram className="w-4 h-4 text-pink-500" />
                            <span className="text-pink-500 font-medium">Instagram</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-foreground max-w-xs truncate" title={video.topic}>
                        {video.topic}
                      </p>
                    </td>
                    <td className="py-3 px-4">
                      <a
                        href={video.video_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                      >
                        <span className="truncate max-w-xs">{video.video_link}</span>
                        <ExternalLink className="w-3 h-3 shrink-0" />
                      </a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {filteredVideos.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No videos found. Try adjusting your filters.
          </div>
        ) : (
          filteredVideos.map((video) => (
            <Card key={video.id} className="w-full">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {video.platform === "youtube" ? (
                      <Youtube className="w-5 h-5 text-red-500" />
                    ) : (
                      <Instagram className="w-5 h-5 text-pink-500" />
                    )}
                    <div>
                      <p className="font-medium text-foreground">{video.employee_name}</p>
                      <p className="text-xs text-muted-foreground">{video.employee_email}</p>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">{formatDate(video.date)}</span>
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-foreground mb-1">Topic</p>
                    <p className="text-sm text-muted-foreground">{video.topic}</p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-foreground mb-1">Platform</p>
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                      video.platform === "youtube"
                        ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                        : "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200"
                    }`}>
                      {video.platform === "youtube" ? (
                        <Youtube className="w-3 h-3" />
                      ) : (
                        <Instagram className="w-3 h-3" />
                      )}
                      {video.platform === "youtube" ? "YouTube" : "Instagram"}
                    </span>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-foreground mb-1">Video Link</p>
                    <a
                      href={video.video_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors text-sm break-all"
                    >
                      {video.video_link}
                      <ExternalLink className="w-3 h-3 shrink-0" />
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Pagination info */}
      {filteredVideos.length > 0 && (
        <div className="text-sm text-muted-foreground text-center">
          Showing {filteredVideos.length} of {videos.length} videos
        </div>
      )}
    </div>
  )
}

