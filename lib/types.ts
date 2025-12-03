export interface Employee {
  id: number
  name: string
  role: "coder" | "peeper"
  email: string
  weekly_required_yt: number
  weekly_required_insta: number
  created_at?: Date
}

export interface DailyTopic {
  id?: string
  date: string
  employee_id?: number
  platform: "youtube" | "instagram"
  topic: string
  status: "pending" | "completed"
  created_at?: Date
}

export interface Upload {
  id?: string
  employee_id: number
  platform: "youtube" | "instagram"
  date: string
  video_link?: string // Instagram video URL (optional, only for Instagram)
  created_at?: Date
}

// Extra uploads beyond the mandatory daily ones
export interface ExtraUpload {
  id?: string
  employee_id: number
  platform: "youtube" | "instagram"
  date: string // YYYY-MM-DD
  video_link: string
  created_at?: Date
}

export interface WeeklyReport {
  id?: string
  week: string // Week start date (YYYY-MM-DD)
  employee_id: number
  yt_uploaded: number
  yt_required: number
  insta_uploaded: number
  insta_required: number
  status: "ok" | "missed" | "pending"
  created_at?: Date
}

// Daily Upload Record - tracks each day's upload status for each employee
export interface DailyUploadRecord {
  id?: string // MongoDB ObjectId
  employee_id: number
  date: string // YYYY-MM-DD format
  youtube_done: boolean
  insta_done: boolean
  youtube_video_link?: string // YouTube video URL (optional)
  instagram_video_link?: string // Instagram video URL (optional)
  created_at?: Date
  updated_at?: Date
}

// Legacy interfaces for backward compatibility
export interface DailyUpload {
  id: number
  employee_id: number
  date: string
  insta_done: boolean
  youtube_done: boolean
  created_at?: string
}

export interface WeeklyStat {
  id: number
  employee_id: number
  week_start_date: string
  insta_count: number
  youtube_count: number
  created_at?: string
}

export interface Topic {
  id: number
  employee_id: number
  date: string
  topic_text: string
  created_at?: string
}

export interface ComplianceStatus {
  employee: Employee
  today?: DailyUpload
  thisWeek?: WeeklyStat
  dailyStatus: "ok" | "missed" | "pending"
  weeklyStatus: "ok" | "missed" | "pending"
}
