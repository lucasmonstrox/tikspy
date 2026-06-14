import type { ReactNode } from "react"

import { notFound } from "next/navigation"
import { StarIcon } from "lucide-react"
import { format, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"

import type { MarketProductCreator, MarketProductVideo } from "api"

import { Badge } from "@workspace/ui/components/badge"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs"

import {
  DataTable,
  formatBrl,
  formatCompact,
  formatInteger,
  MediaCell,
  PageShell,
  VideoGrid,
} from "@/shared"
import type { DataColumn, VideoItem } from "@/shared"

import { getProductDetail } from "../../services/produtos"
import { ProdutoDetalheHeader } from "./produto-detalhe-header"

type ProdutoDetalhePageProps = {
  id: string
}

const CRIADORES_COLUMNS: DataColumn<MarketProductCreator>[] = [
  {
    header: "Criador",
    render: (row, index) => (
      <MediaCell
        title={row.name}
        subtitle={row.niche}
        seed={index}
        shape="circle"
      />
    ),
  },
  {
    header: "Seguidores",
    align: "right",
    render: (row) => (
      <span className="text-sm text-muted-foreground">
        {formatCompact(row.followers)}
      </span>
    ),
  },
  {
    header: "Vídeos",
    align: "right",
    render: (row) => (
      <span className="text-sm text-muted-foreground">
        {formatInteger(row.videos)}
      </span>
    ),
  },
  {
    header: "Vendas do produto",
    align: "right",
    render: (row) => (
      <span className="text-sm font-medium">
        {formatCompact(row.productSales)}
      </span>
    ),
  },
]

export async function ProdutoDetalhePage({ id }: ProdutoDetalhePageProps) {
  const detail = await getProductDetail(id)
  if (!detail) notFound()

  const videoItems: VideoItem[] = detail.videos.map(toVideoItem)

  return (
    <PageShell>
      <ProdutoDetalheHeader detail={detail} />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Preço" value={priceLabel(detail.priceMin, detail.priceMax)} />
        <Kpi
          label="Comissão"
          value={
            detail.commissionRate != null
              ? `${Math.round(detail.commissionRate * 100)}%`
              : "—"
          }
        />
        <Kpi
          label="Vendas 30d"
          value={formatCompact(detail.sales30d)}
          hint={`${formatCompact(detail.salesTotal)} no total`}
        />
        <Kpi
          label="Avaliação"
          value={
            detail.rating != null ? (
              <span className="inline-flex items-center gap-1">
                <StarIcon className="size-4 fill-amber-400 text-amber-400" />
                {detail.rating.toFixed(1)}
              </span>
            ) : (
              "—"
            )
          }
          hint={
            detail.reviewCount
              ? `${formatInteger(detail.reviewCount)} avaliações`
              : "Sem avaliações"
          }
        />
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span>{formatCompact(detail.creatorCount)} criadores no total</span>
        <span>{formatCompact(detail.videoCount)} vídeos</span>
        {detail.firstSeen ? (
          <span>No mercado desde {formatShortDate(detail.firstSeen)}</span>
        ) : null}
      </div>

      <Tabs defaultValue="criadores" className="gap-6">
        <TabsList>
          <TabsTrigger value="criadores">
            Criadores
            <Badge variant="secondary" className="ml-1.5">
              {detail.creators.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="videos">
            Vídeos
            <Badge variant="secondary" className="ml-1.5">
              {detail.videos.length}
            </Badge>
          </TabsTrigger>
        </TabsList>
        <TabsContent value="criadores">
          {detail.creators.length > 0 ? (
            <DataTable columns={CRIADORES_COLUMNS} rows={detail.creators} />
          ) : (
            <Empty>Nenhum criador registrado pra este produto ainda.</Empty>
          )}
        </TabsContent>
        <TabsContent value="videos">
          {videoItems.length > 0 ? (
            <VideoGrid items={videoItems} />
          ) : (
            <Empty>Nenhum vídeo registrado pra este produto.</Empty>
          )}
        </TabsContent>
      </Tabs>
    </PageShell>
  )
}

function Kpi({
  label,
  value,
  hint,
}: {
  label: string
  value: ReactNode
  hint?: string
}) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-border/60 bg-card p-4">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="font-heading text-xl font-semibold tracking-tight">
        {value}
      </span>
      {hint ? (
        <span className="text-[11px] text-muted-foreground/70">{hint}</span>
      ) : null}
    </div>
  )
}

function Empty({ children }: { children: ReactNode }) {
  return (
    <p className="py-6 text-sm text-muted-foreground">{children}</p>
  )
}

/** "d MMM" pt-BR a partir de "yyyy-MM-dd" (ou Date já revivido). */
function formatShortDate(date: string | Date): string {
  const value = typeof date === "string" ? parseISO(date) : date
  return format(value, "d MMM", { locale: ptBR })
}

/** Faixa de preço; "—" sem preço. NB: a fonte dá USD — ver pendência de conversão. */
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
