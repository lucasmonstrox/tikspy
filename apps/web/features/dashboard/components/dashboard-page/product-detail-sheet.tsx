// Sem "use client" próprio: só é importado pelo top-products-table (client), logo
// já entra no grafo client. Marcar como entry dispararia o lint de prop não
// serializável (onOpenChange) à toa — os hooks client moram nos módulos deles.
import type { ReactNode } from "react"
import Link from "next/link"

import { ChevronRightIcon, StarIcon } from "lucide-react"

import type {
  MarketProduct,
  MarketProductCreator,
  MarketProductVideo,
} from "api"

import { Badge } from "@workspace/ui/components/badge"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@workspace/ui/components/sheet"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs"

import { Delta, getInitials, MediaCell, ScorePill, VideoGrid } from "@/shared"
import type { VideoItem } from "@/shared"

import { useProductDetail } from "../../hooks/data/queries/use-product-detail"
import {
  formatCompact,
  formatBrl,
  formatDeltaPct,
  formatInteger,
  formatShortDate,
} from "../../utils/format"

type ProductDetailSheetProps = {
  product: MarketProduct | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ProductDetailSheet({
  product,
  open,
  onOpenChange,
}: ProductDetailSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      {/* Sobrepõe o variant do próprio Sheet (data-[side=right]:sm:max-w-sm) — só
          casando o mesmo prefixo o tailwind-merge dedupa e a largura maior vale. */}
      <SheetContent className="flex w-full flex-col gap-0 p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-2xl">
        {product ? <SheetBody product={product} /> : null}
      </SheetContent>
    </Sheet>
  )
}

/**
 * Corpo do sheet. O cabeçalho e as métricas de 24h saem na hora (já vêm na
 * linha clicada); preço/comissão/avaliação/janelas + criadores/vídeos chegam
 * via server action quando o sheet monta. Desmonta ao fechar (Radix) → o fetch
 * só roda quando aberto.
 */
function SheetBody({ product }: { product: MarketProduct }) {
  const state = useProductDetail(product.id)
  const loading = state.status === "loading"
  const detail = state.status === "success" ? state.detail : null
  const failed =
    state.status === "error" || (state.status === "success" && detail === null)

  const videoItems: VideoItem[] = (detail?.videos ?? []).map((video) =>
    toVideoItem(video),
  )

  return (
    <>
      <SheetHeader className="gap-3 border-b border-foreground/10 pr-10">
        <div className="flex items-start gap-3">
          <ProductThumb image={product.image} name={product.name} />
          <div className="flex min-w-0 flex-col gap-1.5">
            <SheetTitle className="leading-snug">{product.name}</SheetTitle>
            <SheetDescription className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{product.category}</Badge>
              <ScorePill value={product.score} />
            </SheetDescription>
          </div>
        </div>
      </SheetHeader>

      <div className="flex flex-1 flex-col gap-5 overflow-y-auto p-4">
        <div className="grid grid-cols-2 gap-3">
          <Stat
            label="Preço"
            loading={loading}
            value={detail ? priceLabel(detail.priceMin, detail.priceMax) : "—"}
          />
          <Stat
            label="Comissão"
            loading={loading}
            value={
              detail?.commissionRate != null
                ? `${Math.round(detail.commissionRate * 100)}%`
                : "—"
            }
          />
          <Stat
            label="Avaliação"
            loading={loading}
            value={
              detail?.rating != null ? (
                <span className="inline-flex items-center gap-1">
                  <StarIcon className="size-4 fill-amber-400 text-amber-400" />
                  {detail.rating.toFixed(1)}
                </span>
              ) : detail ? (
                <span className="text-sm font-normal text-muted-foreground">
                  Sem avaliações
                </span>
              ) : (
                "—"
              )
            }
            hint={
              detail?.reviewCount
                ? `${formatInteger(detail.reviewCount)} avaliações`
                : undefined
            }
          />
          <Stat
            label="Vendas 24h"
            value={formatCompact(product.sales24h)}
            hint={
              product.salesDelta24h !== null ? (
                <Delta
                  value={formatDeltaPct(product.salesDelta24h)}
                  up={product.salesDelta24h >= 0}
                />
              ) : undefined
            }
          />
          <Stat
            label="Vendas 7d"
            loading={loading}
            value={detail ? formatCompact(detail.sales7d) : "—"}
          />
          <Stat
            label="Vendas 30d"
            loading={loading}
            value={detail ? formatCompact(detail.sales30d) : "—"}
          />
        </div>

        {detail ? (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span>{formatCompact(detail.creatorCount)} criadores no total</span>
            <span>{formatCompact(detail.videoCount)} vídeos</span>
            {detail.firstSeen ? (
              <span>No mercado desde {formatShortDate(detail.firstSeen)}</span>
            ) : null}
          </div>
        ) : null}

        {failed ? (
          <p className="text-sm text-muted-foreground">
            Não foi possível carregar a ficha completa agora.
          </p>
        ) : (
          <Tabs defaultValue="criadores" className="gap-4">
            <TabsList>
              <TabsTrigger value="criadores">
                Criadores
                {detail ? (
                  <Badge variant="secondary" className="ml-1.5">
                    {detail.creators.length}
                  </Badge>
                ) : null}
              </TabsTrigger>
              <TabsTrigger value="videos">
                Vídeos
                {detail ? (
                  <Badge variant="secondary" className="ml-1.5">
                    {detail.videos.length}
                  </Badge>
                ) : null}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="criadores">
              {loading ? (
                <LoadingRows />
              ) : detail ? (
                <CreatorsList creators={detail.creators} />
              ) : null}
            </TabsContent>
            <TabsContent value="videos">
              {loading ? (
                <LoadingRows />
              ) : videoItems.length > 0 ? (
                <VideoGrid
                  items={videoItems}
                  className="grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2"
                />
              ) : (
                <EmptyHint>Nenhum vídeo registrado pra este produto.</EmptyHint>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>

      <div className="border-t border-foreground/10 p-4">
        <Link
          href={`/produtos/${product.id}`}
          className="flex items-center justify-center gap-1 rounded-lg bg-muted/40 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/70 hover:text-foreground"
        >
          Ver página completa
          <ChevronRightIcon className="size-4" />
        </Link>
      </div>
    </>
  )
}

function CreatorsList({ creators }: { creators: MarketProductCreator[] }) {
  if (creators.length === 0) {
    return (
      <EmptyHint>Nenhum criador registrado pra este produto ainda.</EmptyHint>
    )
  }
  return (
    <div className="flex flex-col">
      {creators.map((creator, index) => (
        <div
          key={creator.id}
          className="flex items-center justify-between gap-3 border-b border-foreground/5 py-2.5 last:border-0"
        >
          <MediaCell
            title={creator.name}
            subtitle={creator.niche}
            seed={index}
            shape="circle"
          />
          <div className="flex items-center gap-5 text-right">
            <Metric value={formatCompact(creator.productSales)} label="vendas" />
            <Metric
              value={formatCompact(creator.followers)}
              label="seguidores"
            />
          </div>
        </div>
      ))}
    </div>
  )
}

function ProductThumb({
  image,
  name,
}: {
  image?: string | null
  name: string
}) {
  if (image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- CDN externo (echosell), sem next/image config
      <img
        src={image}
        alt={name}
        loading="lazy"
        className="size-14 shrink-0 rounded-lg bg-muted object-cover ring-1 ring-foreground/10"
      />
    )
  }
  return (
    <div className="flex size-14 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500/25 to-rose-500/15 font-heading text-base font-semibold text-cyan-200 ring-1 ring-foreground/10">
      {getInitials(name)}
    </div>
  )
}

function Stat({
  label,
  value,
  hint,
  loading,
}: {
  label: string
  value: ReactNode
  hint?: ReactNode
  loading?: boolean
}) {
  return (
    <div className="flex flex-col gap-1 rounded-lg bg-muted/40 p-3">
      <span className="text-xs text-muted-foreground">{label}</span>
      {loading ? (
        <span className="h-6 w-16 animate-pulse rounded bg-muted" />
      ) : (
        <span className="font-heading text-lg font-semibold tracking-tight">
          {value}
        </span>
      )}
      {hint && !loading ? (
        <span className="text-[11px] text-muted-foreground/70">{hint}</span>
      ) : null}
    </div>
  )
}

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-sm font-medium">{value}</span>
      <span className="text-[11px] text-muted-foreground/70">{label}</span>
    </div>
  )
}

function LoadingRows() {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: 4 }, (_, index) => (
        <div
          key={index}
          className="h-12 w-full animate-pulse rounded-lg bg-muted/50"
        />
      ))}
    </div>
  )
}

function EmptyHint({ children }: { children: ReactNode }) {
  return <p className="py-6 text-center text-sm text-muted-foreground">{children}</p>
}

/** Faixa de preço em BRL: "R$ 44,30" ou "R$ 44,30–R$ 56,26". */
function priceLabel(min: number | null, max: number | null): string {
  if (min == null) return "—"
  if (max == null || min === max) return formatBrl(min)
  return `${formatBrl(min)}–${formatBrl(max)}`
}

/** Vídeo do produto → item do VideoGrid (player via videoId; vendas no slot verde). */
function toVideoItem(video: MarketProductVideo): VideoItem {
  const handle = video.creatorHandle
  return {
    title:
      video.description ||
      video.hashtags.map((tag) => `#${tag}`).join(" ") ||
      "Vídeo do produto",
    creator: handle ? `@${handle}` : "",
    creatorUrl: handle ? `https://www.tiktok.com/@${handle}` : null,
    href: handle ? `https://www.tiktok.com/@${handle}/video/${video.id}` : null,
    views: formatCompact(video.views),
    gmv:
      video.productSales > 0
        ? `${formatCompact(video.productSales)} vendas`
        : null,
    cover: video.cover,
    videoId: video.id,
    likes: formatCompact(video.likes),
    comments: formatCompact(video.comments),
    shares: formatCompact(video.shares),
    favorites: formatCompact(video.favorites),
  }
}
