'use client'

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ExternalLink, Instagram, Youtube } from "lucide-react"
import { formatDateISO } from "@/lib/helpers"

interface Video {
  id: string
  employee_id: number
  employee_name: string
  employee_email: string
  platform: "youtube" | "instagram"
  date: string
  video_link: string
  topic: string
}

interface EmployeeLinksRow {
  employee_id: number
  employee_name: string
  employee_email: string
  instagramLinks: string[]
  youtubeLinks: string[]
}

export default function DailyLinksTable() {
  const [selectedDate, setSelectedDate] = useState<string>(() => formatDateISO(new Date()))
  const [rows, setRows] = useState<EmployeeLinksRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Use the uploaded-videos API for the single selected day
        const url = `/api/uploaded-videos?startDate=${selectedDate}&endDate=${selectedDate}`
        const res = await fetch(url)
        if (!res.ok) {
          throw new Error("Failed to fetch daily links")
        }
        const data = await res.json()
        const videos: Video[] = data.videos || []

        // Group by employee, split by platform
        const map = new Map<number, EmployeeLinksRow>()
        videos.forEach((video) => {
          const existing = map.get(video.employee_id) || {
            employee_id: video.employee_id,
            employee_name: video.employee_name,
            employee_email: video.employee_email,
            instagramLinks: [],
            youtubeLinks: [],
          }

          if (video.platform === "instagram") {
            existing.instagramLinks.push(video.video_link)
          } else if (video.platform === "youtube") {
            existing.youtubeLinks.push(video.video_link)
          }

          map.set(video.employee_id, existing)
        })

        // Sort by employee name for stable display
        const rowsArray = Array.from(map.values()).sort((a, b) =>
          a.employee_name.localeCompare(b.employee_name),
        )
        setRows(rowsArray)
      } catch (err: any) {
        console.error("Error loading daily links:", err)
        setError(err.message || "Failed to load daily links")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [selectedDate])

  const onDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(e.target.value)
  }

  const formatDisplayDate = (dateStr: string) => {
    const d = new Date(dateStr + "T00:00:00")
    return d.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <CardTitle>Daily Video Links</CardTitle>
            <CardDescription>
              See each employee&apos;s Instagram and YouTube links for a specific day. Defaults to
              today.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Select date</span>
            <Input
              type="date"
              value={selectedDate}
              onChange={onDateChange}
              className="w-[180px]"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading links...</p>
        ) : error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No Instagram or YouTube links found for {formatDisplayDate(selectedDate)}.
          </p>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Showing {rows.length} employees for {formatDisplayDate(selectedDate)}.
            </p>
            <div className="border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left py-3 px-4 font-semibold text-foreground">
                        Name of employee
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-foreground">
                        Instagram
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-foreground">
                        YouTube
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr
                        key={row.employee_id}
                        className="border-b border-border hover:bg-muted/50 transition-colors"
                      >
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium text-foreground">{row.employee_name}</p>
                            <p className="text-xs text-muted-foreground">{row.employee_email}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4 align-top">
                          {row.instagramLinks.length === 0 ? (
                            <span className="text-xs text-muted-foreground">No links</span>
                          ) : (
                            <ul className="space-y-1">
                              {row.instagramLinks.map((link, idx) => (
                                <li key={idx}>
                                  <a
                                    href={link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-pink-500 hover:text-pink-400 text-xs truncate max-w-xs"
                                  >
                                    <Instagram className="w-3 h-3" />
                                    <span className="truncate">{link}</span>
                                    <ExternalLink className="w-3 h-3 shrink-0" />
                                  </a>
                                </li>
                              ))}
                            </ul>
                          )}
                        </td>
                        <td className="py-3 px-4 align-top">
                          {row.youtubeLinks.length === 0 ? (
                            <span className="text-xs text-muted-foreground">No links</span>
                          ) : (
                            <ul className="space-y-1">
                              {row.youtubeLinks.map((link, idx) => (
                                <li key={idx}>
                                  <a
                                    href={link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-red-500 hover:text-red-400 text-xs truncate max-w-xs"
                                  >
                                    <Youtube className="w-3 h-3" />
                                    <span className="truncate">{link}</span>
                                    <ExternalLink className="w-3 h-3 shrink-0" />
                                  </a>
                                </li>
                              ))}
                            </ul>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}


