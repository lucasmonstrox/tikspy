import { Suspense } from "react"

import { KpiRow, SkeletonKpiRow } from "@/shared"
import type { Kpi } from "@/shared"

import { KPI_LABELS } from "../../consts"
import { getMarketSummary } from "../../services/dashboard"
import {
  formatBrlCompact,
  formatDeltaPct,
  formatInteger,
  formatSignedInteger,
} from "../../utils/format"

export function DashboardKpis() {
  return (
    <Suspense fallback={<SkeletonKpiRow labels={[...KPI_LABELS]} />}>
      <KpisContent />
    </Suspense>
  )
}

async function KpisContent() {
  const { summary } = await getMarketSummary()

  const kpis: Kpi[] = [
    {
      label: KPI_LABELS[0],
      value: formatBrlCompact(summary.topGmv24h.amount),
      delta:
        summary.topGmv24h.deltaPct === null
          ? undefined
          : formatDeltaPct(summary.topGmv24h.deltaPct),
      deltaUp: (summary.topGmv24h.deltaPct ?? 0) >= 0,
      hint: "soma do ranking diário, vs. dia anterior",
    },
    {
      label: KPI_LABELS[1],
      value: formatBrlCompact(summary.creativesGmv24h.amount),
      delta:
        summary.creativesGmv24h.deltaPct === null
          ? undefined
          : formatDeltaPct(summary.creativesGmv24h.deltaPct),
      deltaUp: (summary.creativesGmv24h.deltaPct ?? 0) >= 0,
      hint: "soma do ranking de criativos, vs. dia anterior",
    },
    {
      label: KPI_LABELS[2],
      value: formatInteger(summary.trendingCreatives.count),
      delta:
        summary.trendingCreatives.delta === null
          ? undefined
          : formatSignedInteger(summary.trendingCreatives.delta),
      deltaUp: (summary.trendingCreatives.delta ?? 0) >= 0,
      hint: "virais nas últimas 24h",
    },
  ]

  return <KpiRow items={kpis} />
}
