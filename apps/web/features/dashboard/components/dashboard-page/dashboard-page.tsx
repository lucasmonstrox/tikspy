import { PageHeader, PageShell } from "@/shared"

import { DashboardKpis } from "./dashboard-kpis"
import { LiveBadge } from "./live-badge"
import { MarketTrendCard } from "./market-trend-card"
import { TopProductsCard } from "./top-products-card"
import { TopSellingCreativesCard } from "./top-selling-creatives-card"
import { TrendingCreativesCard } from "./trending-creatives-card"

export function DashboardPage() {
  return (
    <PageShell>
      <PageHeader
        title="Dashboard"
        description="O que está acontecendo no TikTok Shop Brasil agora — só mercado, nada da sua operação."
      >
        <LiveBadge />
      </PageHeader>
      <DashboardKpis />
      <TopProductsCard />
      <TrendingCreativesCard />
      <TopSellingCreativesCard />
      <MarketTrendCard />
    </PageShell>
  )
}
