import { BellPlusIcon, BookmarkIcon, StarIcon } from "lucide-react"

import type { MarketProductDetail } from "api"

import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"

import { getInitials } from "@/shared"

type ProdutoDetalheHeaderProps = {
  detail: MarketProductDetail
}

export function ProdutoDetalheHeader({ detail }: ProdutoDetalheHeaderProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex items-center gap-4">
        {detail.image ? (
          // eslint-disable-next-line @next/next/no-img-element -- CDN externo (echosell), sem next/image config
          <img
            src={detail.image}
            alt={detail.name}
            className="size-20 shrink-0 rounded-xl bg-muted object-cover ring-1 ring-foreground/10"
          />
        ) : (
          <div className="flex size-20 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/30 to-rose-500/20 font-heading text-lg font-semibold text-cyan-200">
            {getInitials(detail.name)}
          </div>
        )}
        <div className="flex min-w-0 flex-col gap-1.5">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            {detail.name}
          </h1>
          <span className="text-sm text-muted-foreground">
            {detail.category}
          </span>
          <div className="flex flex-wrap items-center gap-2">
            {detail.rating != null ? (
              <Badge
                variant="outline"
                className="gap-1 border-amber-500/40 text-amber-400"
              >
                <StarIcon className="size-3 fill-amber-400 text-amber-400" />
                {detail.rating.toFixed(1)}
              </Badge>
            ) : null}
            {detail.commissionRate != null ? (
              <Badge
                variant="outline"
                className="border-[#25F4EE]/40 text-[#25F4EE]"
              >
                Comissão {Math.round(detail.commissionRate * 100)}%
              </Badge>
            ) : null}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" className="gap-2">
          <BookmarkIcon className="size-4" />
          Adicionar à watchlist
        </Button>
        <Button className="gap-2">
          <BellPlusIcon className="size-4" />
          Criar alerta
        </Button>
      </div>
    </div>
  )
}
