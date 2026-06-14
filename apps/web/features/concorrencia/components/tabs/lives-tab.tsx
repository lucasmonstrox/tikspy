import { Suspense } from "react"

import { Badge } from "@workspace/ui/components/badge"

import {
  DataTable,
  FilterBar,
  formatCompact,
  KpiRow,
  MediaCell,
  SkeletonKpiRow,
  SkeletonTable,
} from "@/shared"
import type { DataColumn, Kpi, SkeletonColumn } from "@/shared"

import { LIVES_LIMIT } from "../../consts"
import { getLives } from "../../services/lives"

type Live = Awaited<ReturnType<typeof getLives>>[number]

function AoVivoBadge() {
  return (
    <Badge variant="outline" className="gap-1.5 border-red-500/40 text-red-400">
      <span className="size-1.5 animate-pulse rounded-full bg-red-400" />
      Ao vivo
    </Badge>
  )
}

const COLUMNS: DataColumn<Live>[] = [
  {
    header: "Live",
    render: (row, index) => (
      <MediaCell
        title={row.title}
        subtitle={row.host}
        image={row.cover}
        seed={index + 3}
      />
    ),
  },
  {
    header: "Criador",
    render: (row) => (
      <span className="text-sm text-muted-foreground">
        {row.hostName ?? row.host}
      </span>
    ),
  },
  {
    header: "Assistindo",
    align: "right",
    render: (row) => (
      <span className="text-sm text-muted-foreground">
        {row.viewers != null ? formatCompact(row.viewers) : "—"}
      </span>
    ),
  },
  {
    header: "Produtos",
    align: "right",
    render: (row) => (
      <span className="text-sm text-muted-foreground">
        {row.productCount != null ? formatCompact(row.productCount) : "—"}
      </span>
    ),
  },
  {
    header: "Status",
    render: () => <AoVivoBadge />,
  },
  {
    header: "",
    align: "right",
    render: (row) =>
      row.tiktokUrl ? (
        <a
          href={row.tiktokUrl}
          target="_blank"
          rel="noreferrer"
          className="text-sm font-medium text-primary hover:underline"
        >
          Assistir ↗
        </a>
      ) : null,
  },
]

const KPI_LABELS = [
  "Lives ao vivo agora",
  "Assistindo agora",
  "Com vitrine de produtos",
  "Produtos em live",
]

const SKELETON_COLUMNS: SkeletonColumn[] = [
  { header: "Live", cell: "media" },
  { header: "Criador", cell: "text" },
  { header: "Assistindo", cell: "text", align: "right" },
  { header: "Produtos", cell: "text", align: "right" },
  { header: "Status", cell: "badge" },
  { header: "", cell: "text", align: "right" },
]

export function LivesTab() {
  return (
    <>
      <FilterBar searchPlaceholder="Buscar live, criador ou produto…" />
      <Suspense fallback={<LivesFallback />}>
        <LivesContent />
      </Suspense>
    </>
  )
}

function LivesFallback() {
  return (
    <>
      <SkeletonKpiRow labels={KPI_LABELS} />
      <SkeletonTable columns={SKELETON_COLUMNS} rows={LIVES_LIMIT} />
    </>
  )
}

async function LivesContent() {
  const lives = await getLives()

  if (lives.length === 0) {
    return (
      <p className="rounded-xl bg-card p-8 text-center text-sm text-muted-foreground ring-1 ring-foreground/10">
        Nenhuma live de venda no ar agora no Brasil. As lives em tempo-real vão e
        voltam — tente de novo em instantes.
      </p>
    )
  }

  return (
    <>
      <KpiRow items={buildKpis(lives)} />
      <DataTable columns={COLUMNS} rows={lives} />
    </>
  )
}

/** KPIs derivados da própria lista — sem chamada extra. */
function buildKpis(lives: Live[]): Kpi[] {
  const withProducts = lives.filter((live) => live.hasProducts).length
  const products = lives.reduce((total, live) => total + (live.productCount ?? 0), 0)
  const watching = lives.reduce((total, live) => total + (live.viewers ?? 0), 0)
  return [
    {
      label: KPI_LABELS[0]!,
      value: String(lives.length),
      hint: "no Brasil, neste momento",
    },
    {
      label: KPI_LABELS[1]!,
      value: formatCompact(watching),
      hint: "espectadores nas lives medidas",
    },
    {
      label: KPI_LABELS[2]!,
      value: String(withProducts),
      hint: "lives de venda",
    },
    {
      label: KPI_LABELS[3]!,
      value: formatCompact(products),
      hint: "somados nas vitrines",
    },
  ]
}
