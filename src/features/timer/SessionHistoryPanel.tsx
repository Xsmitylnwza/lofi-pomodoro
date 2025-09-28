import type { ChangeEvent } from "react"
import { useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { format, formatDistanceToNow } from "date-fns"
import type { SessionRecord } from "@/types"
import { usePomodoroStore } from "@/store/pomodoroStore"
import { formatDurationLabel } from "@/features/timer/timerEngine"

interface ImportStatus {
  type: 'idle' | 'success' | 'error'
  message?: string
}

function validateRecords(records: unknown): records is SessionRecord[] {
  if (!Array.isArray(records)) return false
  return records.every((item) => {
    if (typeof item !== 'object' || item === null) return false
    const record = item as Record<string, unknown>
    return (
      typeof record.id === 'string' &&
      typeof record.type === 'string' &&
      (record.type === 'work' || record.type === 'short' || record.type === 'long') &&
      typeof record.plannedSec === 'number' &&
      typeof record.actualSec === 'number' &&
      typeof record.startedAt === 'string' &&
      typeof record.endedAt === 'string'
    )
  })
}

export function SessionHistoryPanel() {
  const { t } = useTranslation('common')
  const { t: tTimer } = useTranslation('timer')
  const history = usePomodoroStore((state) => state.sessionHistory)
  const clearHistory = usePomodoroStore((state) => state.actions.clearHistory)
  const importHistory = usePomodoroStore((state) => state.actions.importHistory)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [status, setStatus] = useState<ImportStatus>({ type: 'idle' })

  const latestRecords = useMemo(() => history.slice(0, 8), [history])

  const handleExport = () => {
    if (typeof window === 'undefined') return
    const payload = JSON.stringify(history, null, 2)
    const blob = new Blob([payload], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'lofi-pomodoro-history.json'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    try {
      const text = await file.text()
      const parsed = JSON.parse(text)
      if (!validateRecords(parsed)) {
        setStatus({ type: 'error', message: 'Invalid file format.' })
        return
      }
      importHistory(parsed)
      setStatus({ type: 'success', message: 'History imported successfully.' })
    } catch (error) {
      console.error(error)
      setStatus({ type: 'error', message: 'Unable to import file.' })
    } finally {
      event.target.value = ''
    }
  }

  const renderBadge = (type: SessionRecord['type']) => {
    const label =
      type === 'work' ? tTimer('focus') : type === 'short' ? tTimer('shortBreak') : tTimer('longBreak')
    return (
      <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-medium text-[var(--text-primary)]">
        {label}
      </span>
    )
  }

  return (
    <section className="rounded-3xl border border-white/30 bg-[var(--bg-secondary)]/80 p-6 shadow-card backdrop-blur">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">{t('history')}</h2>
          <p className="text-sm text-[var(--text-secondary)]">
            {history.length} entries · {t('today')}: {formatDurationLabel(sumFocusSeconds(history))}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <button
            type="button"
            onClick={handleImportClick}
            className="rounded-full bg-white/30 px-4 py-2 text-[var(--text-primary)] transition hover:bg-white/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
          >
            {t('import')}
          </button>
          <button
            type="button"
            onClick={handleExport}
            className="rounded-full bg-white/30 px-4 py-2 text-[var(--text-primary)] transition hover:bg-white/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
          >
            {t('export')}
          </button>
          <button
            type="button"
            onClick={() => clearHistory()}
            className="rounded-full bg-red-400/80 px-4 py-2 text-white transition hover:bg-red-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500"
          >
            {t('clear')}
          </button>
        </div>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json"
        className="hidden"
        onChange={handleFileChange}
      />
      {status.type !== 'idle' && status.message && (
        <p
          className={
            'mt-3 text-sm ' +
            (status.type === 'error'
              ? 'text-red-500'
              : 'text-emerald-500')
          }
        >
          {status.message}
        </p>
      )}
      <div className="mt-6 grid gap-3">
        {latestRecords.length === 0 && (
          <div className="rounded-2xl border border-dashed border-white/30 bg-white/20 p-6 text-sm text-[var(--text-secondary)]">
            No sessions yet. Start your first focus round to build momentum.
          </div>
        )}
        {latestRecords.map((record) => (
          <div
            key={record.id}
            className="flex flex-wrap items-center gap-4 rounded-2xl bg-white/25 px-4 py-3 text-sm text-[var(--text-primary)] dark:bg-white/10"
          >
            {renderBadge(record.type)}
            <span className="min-w-[120px] font-semibold">
              {formatDurationLabel(record.actualSec)}
            </span>
            <span className="flex-1 truncate text-[var(--text-secondary)]">
              {record.label || 'Untitled Session'}
            </span>
            <span className="text-xs text-[var(--text-secondary)]">
              {formatDistanceToNow(new Date(record.endedAt), { addSuffix: true })}
            </span>
            <span className="text-xs text-[var(--text-secondary)]">
              {format(new Date(record.startedAt), 'MMM d, HH:mm')}
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}

function sumFocusSeconds(records: SessionRecord[]) {
  const focusSeconds = records
    .filter((record) => record.type === 'work')
    .reduce((acc, record) => acc + record.actualSec, 0)
  return focusSeconds
}
