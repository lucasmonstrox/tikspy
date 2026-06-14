import Link from "next/link"

import type { MarketProductListItem } from "api"

import { Badge } from "@workspace/ui/components/badge"
import { cn } from "@workspace/ui/lib/utils"

import {
  Delta,
  formatBrl,
  formatCompact,
  formatDeltaPct,
  getInitials,
  ScorePill,
  Sparkline,
  THUMB_TONES,
} from "@/shared"

/** Faixa de preço (BRL); "—" sem preço. NB: a fonte dá USD — ver pendência. */
function priceLabel(min: number | null, max: number | null): string {
  if (min == null) return "—"
  if (max == null || min === max) return formatBrl(min)
  return `${formatBrl(min)}–${formatBrl(max)}`
}

type ProdutoCardProps = {
  produto: MarketProductListItem
  seed?: number
  rank?: number
}

export function ProdutoCard({ produto, seed = 0, rank }: ProdutoCardProps) {
  const up = (produto.salesDelta ?? 0) >= 0

  return (
    <Link
      href={`/produtos/${produto.id}`}
      className="flex h-full flex-col gap-3 rounded-xl border border-border/60 bg-card p-3 transition-colors hover:border-foreground/20 hover:bg-accent/30"
    >
      <div
        className={cn(
          "relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br ring-1 ring-foreground/10",
          THUMB_TONES[seed % THUMB_TONES.length],
        )}
      >
        {produto.image ? (
          // eslint-disable-next-line @next/next/no-img-element -- CDN externo (echosell), sem next/image config
          <img
            src={produto.image}
            alt={produto.name}
            loading="lazy"
            className="size-full object-cover"
          />
        ) : (
          <span className="font-heading text-2xl font-semibold opacity-60">
            {getInitials(produto.name)}
          </span>
        )}
        {rank ? (
          <span className="absolute top-2 left-2 rounded-full bg-black/60 px-2 py-0.5 font-mono text-xs font-medium text-white/90">
            #{rank}
          </span>
        ) : null}
        <div className="absolute top-2 right-2">
          <ScorePill value={produto.score} />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <span className="truncate text-sm font-medium">{produto.name}</span>
        <div className="flex items-center justify-between gap-2">
          <Badge variant="secondary" className="truncate">
            {produto.category}
          </Badge>
          <span className="shrink-0 text-sm font-medium">
            {priceLabel(produto.priceMin, produto.priceMax)}
          </span>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <Stat label="Vendas 7d" value={formatCompact(produto.sales7d)} />
        <Stat label="Criadores" value={formatCompact(produto.creatorCount)} />
        <Stat
          label="Comissão"
          value={
            produto.commissionRate != null
              ? `${Math.round(produto.commissionRate * 100)}%`
              : "—"
          }
        />
      </div>
      <div className="mt-auto flex items-center justify-between border-t border-border/60 pt-3">
        <Sparkline data={produto.salesTrend} up={up} />
        {produto.salesDelta == null ? (
          <span className="text-sm text-muted-foreground/50">—</span>
        ) : (
          <Delta value={formatDeltaPct(produto.salesDelta)} up={up} />
        )}
      </div>
    </Link>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground/70">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  )
}
