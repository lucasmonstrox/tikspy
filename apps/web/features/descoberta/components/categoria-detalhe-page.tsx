import { notFound } from "next/navigation"

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
  formatBrlCompact,
  formatCompact,
  formatDeltaPct,
  formatInteger,
  KpiRow,
  MediaCell,
  PageHeader,
  PageShell,
  ScorePill,
  Sparkline,
} from "@/shared"
import type { DataColumn, Kpi } from "@/shared"

import { getMarketCategory } from "../services/categorias"

const PRODUTOS_COLUMNS: DataColumn<MarketProduct>[] = [
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

export async function CategoriaDetalhePage({ slug }: { slug: string }) {
  const detalhe = await getMarketCategory(slug)

  if (!detalhe) {
    notFound()
  }

  const { category, products } = detalhe
  const emAlta = products.filter((produto) => (produto.salesDelta24h ?? 0) > 0)
  const scoreMedio = products.length
    ? Math.round(
        products.reduce((total, produto) => total + produto.score, 0) /
          products.length,
      )
    : null

  const kpis: Kpi[] = [
    {
      label: "GMV da categoria (24h)",
      value: formatBrlCompact(category.gmv),
      delta:
        category.gmvDelta !== null
          ? formatDeltaPct(category.gmvDelta)
          : undefined,
      deltaUp: (category.gmvDelta ?? 0) >= 0,
      hint: "vs. dia anterior",
    },
    {
      label: "Produtos em alta",
      value: formatInteger(emAlta.length),
      hint: `de ${formatInteger(category.productCount)} no ranking`,
    },
    {
      label: "Vendas (24h)",
      value: formatCompact(category.sales),
      hint: "unidades no ranking",
    },
    {
      label: "Score médio",
      value: scoreMedio === null ? "—" : String(scoreMedio),
      hint: "produtos no ranking",
    },
  ]

  return (
    <PageShell>
      <PageHeader
        title={category.name}
        description="Produtos em alta e desempenho da categoria no ranking diário de vendas."
      >
        {category.gmvDelta !== null && (
          <Delta
            value={formatDeltaPct(category.gmvDelta)}
            up={category.gmvDelta >= 0}
          />
        )}
      </PageHeader>
      <KpiRow items={kpis} />
      <Card>
        <CardHeader>
          <CardTitle>Produtos em alta</CardTitle>
          <CardDescription>
            Maiores vendas da categoria no ranking diário
          </CardDescription>
        </CardHeader>
        <CardContent>
          {products.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Sem produtos no ranking desta categoria hoje.
            </p>
          ) : (
            <DataTable bare columns={PRODUTOS_COLUMNS} rows={products} />
          )}
        </CardContent>
      </Card>
    </PageShell>
  )
}
