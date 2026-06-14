"use client"

import { useState } from "react"

import type { MarketProduct } from "api"

import { DataTable, Delta, MediaCell, ScorePill, Sparkline } from "@/shared"
import type { DataColumn } from "@/shared"

import { formatCompact, formatDeltaPct } from "../../utils/format"

import { ProductDetailSheet } from "./product-detail-sheet"

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

/**
 * Tabela do top de produtos. Cada linha abre um sheet com a ficha completa do
 * produto (criadores/vídeos carregados sob clique). Recebe as linhas já
 * resolvidas pelo server component pai — aqui só entra a interatividade.
 */
export function TopProductsTable({ products }: { products: MarketProduct[] }) {
  const [selected, setSelected] = useState<MarketProduct | null>(null)

  return (
    <>
      <DataTable
        bare
        columns={COLUMNS}
        rows={products}
        onRowClick={setSelected}
      />
      <ProductDetailSheet
        product={selected}
        open={selected !== null}
        onOpenChange={(open) => {
          if (!open) setSelected(null)
        }}
      />
    </>
  )
}
