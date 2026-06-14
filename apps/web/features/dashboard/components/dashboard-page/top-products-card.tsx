import { Suspense } from "react"

import type { MarketProduct } from "api"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"

import {
  DataTable,
  Delta,
  MediaCell,
  ScorePill,
  SkeletonTable,
  Sparkline,
} from "@/shared"
import type { DataColumn, SkeletonColumn } from "@/shared"

import { TOP_PRODUCTS_LIMIT } from "../../consts"
import { getTopProducts } from "../../services/dashboard"
import { formatCompact, formatDeltaPct } from "../../utils/format"

const COLUMNS: DataColumn<MarketProduct>[] = [
  {
    header: "#",
    className: "w-10",
    render: (_row, index) => (
      <span className="font-mono text-sm text-muted-foreground/70">{index + 1}</span>
    ),
  },
  {
    header: "Produto",
    render: (row, index) => (
      <MediaCell
        title={row.name}
        subtitle={row.category}
        image={row.image}
        seed={index}
      />
    ),
  },
  {
    header: "Vendas 24h",
    align: "right",
    render: (row) => (
      <span className="font-mono text-sm font-medium">
        {formatCompact(row.sales24h)}
      </span>
    ),
  },
  {
    header: "Tendência",
    align: "right",
    render: (row) => (
      <Sparkline data={row.salesTrend} up={(row.salesDelta24h ?? 0) >= 0} />
    ),
  },
  {
    header: "Variação 24h",
    align: "right",
    render: (row) =>
      row.salesDelta24h === null ? (
        <span className="text-sm text-muted-foreground/50">—</span>
      ) : (
        <Delta
          value={formatDeltaPct(row.salesDelta24h)}
          up={row.salesDelta24h >= 0}
        />
      ),
  },
  {
    header: "Score",
    align: "right",
    render: (row) => <ScorePill value={row.score} />,
  },
]

const SKELETON_COLUMNS: SkeletonColumn[] = [
  { header: "#", cell: "rank", className: "w-10" },
  { header: "Produto", cell: "media" },
  { header: "Vendas 24h", cell: "text", align: "right" },
  { header: "Tendência", cell: "sparkline", align: "right" },
  { header: "Variação 24h", cell: "badge", align: "right" },
  { header: "Score", cell: "score", align: "right" },
]

export function TopProductsCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Produtos mais vendidos</CardTitle>
        <CardDescription>
          Maiores volumes de venda nas últimas 24h
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Suspense
          fallback={
            <SkeletonTable
              bare
              columns={SKELETON_COLUMNS}
              rows={TOP_PRODUCTS_LIMIT}
            />
          }
        >
          <TopProductsTable />
        </Suspense>
      </CardContent>
    </Card>
  )
}

async function TopProductsTable() {
  const products = await getTopProducts(TOP_PRODUCTS_LIMIT)
  return <DataTable bare columns={COLUMNS} rows={products} />
}
