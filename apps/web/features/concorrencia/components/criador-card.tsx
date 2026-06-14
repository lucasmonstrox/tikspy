import type { MarketCreator } from "api"

import { Badge } from "@workspace/ui/components/badge"
import { cn } from "@workspace/ui/lib/utils"

import {
  formatBrlCompact,
  formatCompact,
  formatInteger,
  getInitials,
  ScorePill,
  Sparkline,
  THUMB_TONES,
} from "@/shared"

type CriadorCardProps = {
  creator: MarketCreator
  seed?: number
}

export function CriadorCard({ creator, seed = 0 }: CriadorCardProps) {
  return (
    <div className="flex h-full flex-col gap-4 rounded-xl border border-border/60 bg-card p-4 transition-colors hover:border-foreground/20 hover:bg-accent/30">
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-sm font-semibold ring-1 ring-foreground/10",
            THUMB_TONES[seed % THUMB_TONES.length]
          )}
        >
          {getInitials(creator.name)}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="truncate text-sm font-medium">{creator.name}</span>
          <Badge variant="secondary" className="w-fit">
            {creator.niche}
          </Badge>
        </div>
        <ScorePill value={creator.efficiency} />
      </div>
      <div className="grid grid-cols-2 gap-x-2 gap-y-3">
        <Stat label="Seguidores" value={formatCompact(creator.followers)} />
        <Stat
          label="GMV estimado"
          value={formatBrlCompact(creator.estimatedGmv)}
        />
        <Stat label="Vídeos" value={formatInteger(creator.videos)} />
        <Stat label="Produtos" value={formatInteger(creator.products)} />
      </div>
      <div className="mt-auto flex items-center justify-between border-t border-border/60 pt-3">
        <span className="text-xs text-muted-foreground/70">Crescimento</span>
        <Sparkline data={creator.trend} up={creator.up} />
      </div>
    </div>
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
