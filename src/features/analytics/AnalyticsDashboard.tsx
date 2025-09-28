import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { Bar, Doughnut, Line } from "react-chartjs-2"
import {
  CategoryScale,
  Chart as ChartJS,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js"
import type { ChartOptions } from "chart.js"
import { usePomodoroStore } from "@/store/pomodoroStore"
import { calculateAnalytics } from "@/features/analytics/statsService"

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
)

interface ChartPalette {
  isDark: boolean
  textPrimary: string
  textSecondary: string
  accent: string
  grid: string
  tooltipBg: string
}

function readPalette(): ChartPalette {
  if (typeof window === 'undefined') {
    return {
      isDark: false,
      textPrimary: '#1f1d2b',
      textSecondary: 'rgba(31,29,43,0.72)',
      accent: '#f6b8b8',
      grid: 'rgba(31,29,43,0.12)',
      tooltipBg: 'rgba(31,29,43,0.9)',
    }
  }
  const root = document.documentElement
  const theme = root.getAttribute('data-theme') ?? 'light'
  const styles = window.getComputedStyle(root)
  const textPrimary = styles.getPropertyValue('--text-primary').trim() || '#1f1d2b'
  const textSecondary = styles.getPropertyValue('--text-secondary').trim() || 'rgba(31,29,43,0.72)'
  const accent = styles.getPropertyValue('--accent').trim() || '#f6b8b8'
  const isDark = theme === 'dark'
  const grid = isDark ? 'rgba(244,237,226,0.14)' : 'rgba(31,29,43,0.14)'
  const tooltipBg = isDark ? 'rgba(15,13,22,0.9)' : 'rgba(31,29,43,0.9)'
  return { isDark, textPrimary, textSecondary, accent, grid, tooltipBg }
}

function useChartPalette() {
  const themeMode = usePomodoroStore((state) => state.ui.themeMode)
  const [palette, setPalette] = useState<ChartPalette>(() => readPalette())

  useEffect(() => {
    setPalette(readPalette())
  }, [themeMode])

  return palette
}

function buildLineOptions(palette: ChartPalette): ChartOptions<'line'> {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: palette.tooltipBg,
        titleColor: palette.textPrimary,
        bodyColor: palette.textPrimary,
      },
    },
    scales: {
      x: {
        ticks: { color: palette.textSecondary },
        grid: { color: palette.grid },
      },
      y: {
        ticks: { color: palette.textSecondary },
        grid: { color: palette.grid },
      },
    },
  }
}

function buildBarOptions(palette: ChartPalette): ChartOptions<'bar'> {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: palette.tooltipBg,
        titleColor: palette.textPrimary,
        bodyColor: palette.textPrimary,
      },
    },
    scales: {
      x: {
        ticks: { color: palette.textSecondary },
        grid: { color: palette.grid },
      },
      y: {
        ticks: { color: palette.textSecondary },
        grid: { color: palette.grid },
      },
    },
  }
}

export default function AnalyticsDashboard() {
  const { t } = useTranslation('common')
  const { t: tTimer } = useTranslation('timer')
  const { t: tAnalytics } = useTranslation('analytics')
  const history = usePomodoroStore((state) => state.sessionHistory)
  const palette = useChartPalette()

  const lineOptions = useMemo(() => buildLineOptions(palette), [palette])
  const barOptions = useMemo(() => buildBarOptions(palette), [palette])

  const analytics = useMemo(() => calculateAnalytics(history), [history])

  const lineColor = palette.accent || '#f6b8b8'
  const lineBackground = lineColor.startsWith('#') ? lineColor + '33' : lineColor
  const weeklyBarColor = palette.isDark ? 'rgba(197,212,192,0.85)' : 'rgba(90,113,142,0.7)'
  const monthlyBarColor = palette.isDark ? 'rgba(244,237,226,0.75)' : 'rgba(31,29,43,0.2)'

  const dailyData = useMemo(
    () => ({
      labels: analytics.daily.labels,
      datasets: [
        {
          label: tTimer('focus'),
          data: analytics.daily.values,
          borderColor: lineColor,
          backgroundColor: lineBackground,
          tension: 0.35,
          fill: true,
        },
      ],
    }),
    [analytics.daily, lineColor, lineBackground, tTimer],
  )

  const weeklyData = useMemo(
    () => ({
      labels: analytics.weekly.labels,
      datasets: [
        {
          data: analytics.weekly.values,
          backgroundColor: weeklyBarColor,
          borderRadius: 6,
        },
      ],
    }),
    [analytics.weekly, weeklyBarColor],
  )

  const monthlyData = useMemo(
    () => ({
      labels: analytics.monthly.labels,
      datasets: [
        {
          data: analytics.monthly.values,
          backgroundColor: monthlyBarColor,
          borderRadius: 6,
        },
      ],
    }),
    [analytics.monthly, monthlyBarColor],
  )

  const completionData = useMemo(
    () => ({
      labels: ['Completed', 'Skipped'],
      datasets: [
        {
          data: [analytics.completionCounts.completed, analytics.completionCounts.skipped],
          backgroundColor: [lineColor, palette.isDark ? 'rgba(244,237,226,0.35)' : 'rgba(31,29,43,0.12)'],
          borderWidth: 0,
        },
      ],
    }),
    [analytics.completionCounts, lineColor, palette.isDark],
  )

  const maxHeat = Math.max(
    analytics.heatmap.reduce((acc, bucket) => (bucket.count > acc ? bucket.count : acc), 0),
    1,
  )

  const heatCells = analytics.heatmap.map((bucket) => {
    const intensity = bucket.count / maxHeat
    const baseColor = palette.isDark ? '246, 184, 184' : '31, 29, 43'
    const opacity = palette.isDark ? 0.25 + intensity * 0.55 : 0.08 + intensity * 0.25
    return {
      hour: bucket.hour,
      count: bucket.count,
      background: `rgba(${baseColor}, ${opacity.toFixed(2)})`,
    }
  })

  return (
    <div className="space-y-10 py-10">
      <header className="rounded-3xl border border-white/20 bg-[var(--bg-secondary)]/80 p-6 shadow-card backdrop-blur">
        <h1 className="text-3xl font-semibold text-[var(--text-primary)]">{t('analytics')}</h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          {analytics.totalFocusMinutes} {t('minutes')} {tAnalytics('summary')} {analytics.streak.current} {tAnalytics('dayStreak')} · {Math.round(analytics.completionRate * 100)}% {tAnalytics('completionLabel')}
        </p>
      </header>

      <section className="grid gap-8 lg:grid-cols-2">
        <ChartCard title={tAnalytics('dailyFocus')}>
          <Line data={dailyData} options={lineOptions} />
        </ChartCard>
        <ChartCard title={tAnalytics('weeklyFocus')}>
          <Bar data={weeklyData} options={barOptions} />
        </ChartCard>
        <ChartCard title={tAnalytics('monthlyFocus')}>
          <Bar data={monthlyData} options={barOptions} />
        </ChartCard>
        <ChartCard title={tAnalytics('completionRate')}>
          <Doughnut
            data={completionData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                tooltip: {
                  backgroundColor: palette.tooltipBg,
                  titleColor: palette.textPrimary,
                  bodyColor: palette.textPrimary,
                },
              },
            }}
          />
        </ChartCard>
      </section>

      <section className="grid gap-8 lg:grid-cols-[2fr_1fr]">
        <div className="rounded-3xl border border-white/20 bg-[var(--bg-secondary)]/80 p-6 shadow-card backdrop-blur">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">{tAnalytics('focusHeatmap')}</h2>
          <div className="mt-4 grid grid-cols-6 gap-2 text-xs text-[var(--text-secondary)] sm:grid-cols-8">
            {heatCells.map((cell) => (
              <div
                key={cell.hour}
                className="flex h-16 flex-col items-center justify-center rounded-2xl text-center"
                style={{ backgroundColor: cell.background }}
              >
                <span className="font-semibold text-[var(--text-primary)]">{padHour(cell.hour)}</span>
                <span>{cell.count}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-3xl border border-white/20 bg-[var(--bg-secondary)]/80 p-6 shadow-card backdrop-blur">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">{tAnalytics('insights')}</h2>
          <ul className="mt-3 space-y-3 text-sm text-[var(--text-secondary)]">
            {analytics.insights.map((insight, index) => (
              <li key={index} className="rounded-2xl bg-white/25 px-4 py-3 dark:bg-white/10">
                {insight}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  )
}

interface ChartCardProps {
  title: string
  children: React.ReactNode
}

function ChartCard({ title, children }: ChartCardProps) {
  return (
    <div className="rounded-3xl border border-white/20 bg-[var(--bg-secondary)]/80 p-6 shadow-card backdrop-blur">
      <h2 className="mb-4 text-lg font-semibold text-[var(--text-primary)]">{title}</h2>
      <div className="h-60">{children}</div>
    </div>
  )
}

function padHour(value: number) {
  return value.toString().padStart(2, '0')
}
