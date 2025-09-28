import { Suspense, lazy } from "react"

const AnalyticsDashboard = lazy(() => import("@/features/analytics/AnalyticsDashboard"))

function PageFallback() {
  return (
    <div className="flex justify-center py-16 text-sm text-[var(--text-secondary)]">
      Loading analytics...
    </div>
  )
}

export default function AnalyticsPage() {
  return (
    <Suspense fallback={<PageFallback />}>
      <AnalyticsDashboard />
    </Suspense>
  )
}
