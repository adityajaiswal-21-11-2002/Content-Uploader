import type { Employee, DailyUpload, WeeklyStat } from "./types"

export function getWeekStartDate(date: Date = new Date()): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  return new Date(d.setDate(diff))
}

export function formatDateISO(date: Date): string {
  return date.toISOString().split("T")[0]
}

export function getRequiredQuota(role: "coder" | "peeper"): { youtube: number; insta: number } {
  // All employees need 3 YouTube and 7 Instagram per week
  return { youtube: 3, insta: 7 }
}

export function checkDailyCompliance(employee: Employee, dailyUpload: DailyUpload | null): boolean {
  if (!dailyUpload) return false
  // All employees must upload 1 Instagram per day (mandatory)
  // YouTube is weekly (3 per week), so daily check is just for Instagram
  return dailyUpload.insta_done
}

export function checkWeeklyCompliance(employee: Employee, weeklyStat: WeeklyStat | null): boolean {
  if (!weeklyStat) return false
  const quota = getRequiredQuota(employee.role)
  // All employees must meet both requirements: 3 YouTube and 7 Instagram per week
  return weeklyStat.youtube_count >= quota.youtube && weeklyStat.insta_count >= quota.insta
}
