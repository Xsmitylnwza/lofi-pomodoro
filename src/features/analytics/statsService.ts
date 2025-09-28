import {
  addDays,
  addMonths,
  format,
  isSameDay,
  isWithinInterval,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subDays,
  subMonths,
  subWeeks,
} from "date-fns"
import type { SessionRecord } from "@/types"

export interface ChartSeries {
  labels: string[]
  values: number[]
}

export interface HeatmapBucket {
  hour: number
  count: number
}

export interface StreakStats {
  current: number
  longest: number
}

export interface AnalyticsSummary {
  daily: ChartSeries
  weekly: ChartSeries
  monthly: ChartSeries
  completionRate: number
  completionCounts: { completed: number; skipped: number }
  totalFocusMinutes: number
  averageSessionMinutes: number
  streak: StreakStats
  heatmap: HeatmapBucket[]
  bestFocusWindow: string
  insights: string[]
}

const DAY_MS = 24 * 60 * 60 * 1000

export function calculateAnalytics(records: SessionRecord[]): AnalyticsSummary {
  const workSessions = records.filter((record) => record.type === 'work')
  const now = new Date()

  const daily = buildDailySeries(workSessions, now)
  const weekly = buildWeeklySeries(workSessions, now)
  const monthly = buildMonthlySeries(workSessions, now)

  const completionCounts = workSessions.reduce(
    (acc, record) => {
      const completed = record.actualSec >= record.plannedSec * 0.95
      if (completed) {
        acc.completed += 1
      } else {
        acc.skipped += 1
      }
      return acc
    },
    { completed: 0, skipped: 0 },
  )

  const completionTotal = completionCounts.completed + completionCounts.skipped
  const completionRate = completionTotal > 0 ? completionCounts.completed / completionTotal : 0

  const totalFocusMinutes = Math.round(
    workSessions.reduce((acc, record) => acc + record.actualSec, 0) / 60,
  )
  const averageSessionMinutes = workSessions.length > 0 ? Math.round(totalFocusMinutes / workSessions.length) : 0

  const streak = computeStreak(workSessions, now)
  const heatmap = buildHeatmap(workSessions)
  const bestFocusWindow = determineBestFocusWindow(heatmap)
  const insights = buildInsights({
    bestFocusWindow,
    completionRate,
    averageSessionMinutes,
    streak,
    totalFocusMinutes,
  })

  return {
    daily,
    weekly,
    monthly,
    completionRate,
    completionCounts,
    totalFocusMinutes,
    averageSessionMinutes,
    streak,
    heatmap,
    bestFocusWindow,
    insights,
  }
}

function buildDailySeries(records: SessionRecord[], today: Date): ChartSeries {
  const labels: string[] = []
  const values: number[] = []

  for (let offset = 13; offset >= 0; offset -= 1) {
    const day = startOfDay(subDays(today, offset))
    const label = format(day, 'MMM d')
    const totalSeconds = records.reduce((acc, record) => {
      return isSameDay(day, new Date(record.startedAt)) ? acc + record.actualSec : acc
    }, 0)
    labels.push(label)
    values.push(Math.round(totalSeconds / 60))
  }

  return { labels, values }
}

function buildWeeklySeries(records: SessionRecord[], today: Date): ChartSeries {
  const labels: string[] = []
  const values: number[] = []
  const currentWeekStart = startOfWeek(today, { weekStartsOn: 1 })

  for (let offset = 7; offset >= 0; offset -= 1) {
    const weekStart = subWeeks(currentWeekStart, offset)
    const weekEnd = addDays(weekStart, 6)
    const label = format(weekStart, 'MMM d')
    const totalSeconds = records.reduce((acc, record) => {
      const startedAt = new Date(record.startedAt)
      return isWithinInterval(startedAt, { start: weekStart, end: weekEnd })
        ? acc + record.actualSec
        : acc
    }, 0)
    labels.push(label)
    values.push(Math.round(totalSeconds / 60))
  }

  return { labels, values }
}

function buildMonthlySeries(records: SessionRecord[], today: Date): ChartSeries {
  const labels: string[] = []
  const values: number[] = []
  const currentMonthStart = startOfMonth(today)

  for (let offset = 5; offset >= 0; offset -= 1) {
    const monthStart = startOfMonth(subMonths(currentMonthStart, offset))
    const nextMonthStart = startOfMonth(addMonths(monthStart, 1))
    const monthEnd = subDays(nextMonthStart, 1)
    const label = format(monthStart, 'MMM yyyy')
    const totalSeconds = records.reduce((acc, record) => {
      const startedAt = new Date(record.startedAt)
      return isWithinInterval(startedAt, { start: monthStart, end: monthEnd })
        ? acc + record.actualSec
        : acc
    }, 0)
    labels.push(label)
    values.push(Math.round(totalSeconds / 60))
  }

  return { labels, values }
}

function computeStreak(records: SessionRecord[], today: Date): StreakStats {
  const uniqueDays = Array.from(
    new Set(
      records.map((record) => startOfDay(new Date(record.startedAt)).getTime()),
    ),
  )

  uniqueDays.sort((a, b) => a - b)
  const daySet = new Set(uniqueDays)

  let current = 0
  let checkpoint = startOfDay(today).getTime()
  while (daySet.has(checkpoint)) {
    current += 1
    checkpoint -= DAY_MS
  }

  let longest = 0
  for (const day of uniqueDays) {
    if (!daySet.has(day - DAY_MS)) {
      let length = 1
      let nextDay = day + DAY_MS
      while (daySet.has(nextDay)) {
        length += 1
        nextDay += DAY_MS
      }
      if (length > longest) {
        longest = length
      }
    }
  }

  return { current, longest }
}

function buildHeatmap(records: SessionRecord[]): HeatmapBucket[] {
  const buckets: HeatmapBucket[] = []
  const counts: number[] = new Array(24).fill(0)

  records.forEach((record) => {
    const hour = new Date(record.startedAt).getHours()
    counts[hour] += 1
  })

  for (let hour = 0; hour < 24; hour += 1) {
    buckets.push({ hour, count: counts[hour] })
  }

  return buckets
}

function determineBestFocusWindow(heatmap: HeatmapBucket[]): string {
  if (heatmap.length === 0) return '00:00-01:00'
  let maxCount = -1
  let bestHour = 0
  heatmap.forEach((bucket) => {
    if (bucket.count > maxCount) {
      maxCount = bucket.count
      bestHour = bucket.hour
    }
  })
  return buildHourRange(bestHour)
}

function buildHourRange(hour: number): string {
  const startHour = hour
  const endHour = (hour + 1) % 24
  return padHour(startHour) + ':00-' + padHour(endHour) + ':00'
}

function padHour(value: number) {
  return value.toString().padStart(2, '0')
}

interface InsightContext {
  bestFocusWindow: string
  completionRate: number
  averageSessionMinutes: number
  streak: StreakStats
  totalFocusMinutes: number
}

function buildInsights(context: InsightContext): string[] {
  const insights: string[] = []
  const completionPercent = Math.round(context.completionRate * 100)
  insights.push('Completion rate at ' + completionPercent + '%')

  if (context.averageSessionMinutes > 0) {
    insights.push('Typical session lasts ' + context.averageSessionMinutes + ' minutes')
  }
  if (context.streak.current > 0) {
    insights.push('Current streak: ' + context.streak.current + ' days')
  }
  if (context.streak.longest > 0) {
    insights.push('Longest streak: ' + context.streak.longest + ' days')
  }
  insights.push('Best focus window: ' + context.bestFocusWindow)
  insights.push('Total focus time: ' + context.totalFocusMinutes + ' minutes')
  return insights
}
