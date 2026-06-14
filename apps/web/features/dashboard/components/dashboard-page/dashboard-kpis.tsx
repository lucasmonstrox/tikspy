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
      value: formatInteger(summary.bestsellers.count),
      delta:
        summary.bestsellers.delta === null
          ? undefined
          : formatSignedInteger(summary.bestsellers.delta),
      deltaUp: (summary.bestsellers.delta ?? 0) >= 0,
      hint: "acima de 500 vendas/dia",
    },
    {
      label: KPI_LABELS[1],
      value: formatInteger(summary.trendingCreatives.count),
      delta:
        summary.trendingCreatives.delta === null
          ? undefined
          : formatSignedInteger(summary.trendingCreatives.delta),
      deltaUp: (summary.trendingCreatives.delta ?? 0) >= 0,
      hint: "virais nas últimas 24h",
    },
    {
      label: KPI_LABELS[2],
      value: formatBrlCompact(summary.topGmv24h.amount),
      delta:
        summary.topGmv24h.deltaPct === null
          ? undefined
          : formatDeltaPct(summary.topGmv24h.deltaPct),
      deltaUp: (summary.topGmv24h.deltaPct ?? 0) >= 0,
      hint: "soma do ranking diário, vs. dia anterior",
    },
  ]

  return <KpiRow items={kpis} />
}
