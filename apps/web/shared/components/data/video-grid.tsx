"use client"

import { useState } from "react"

import {
  BookmarkIcon,
  ExternalLinkIcon,
  EyeIcon,
  HeartIcon,
  MessageCircleIcon,
  PlayIcon,
  Share2Icon,
} from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import { cn } from "@workspace/ui/lib/utils"

const THUMB_TONES = [
  "from-cyan-500/25 via-slate-800 to-rose-500/20",
  "from-rose-500/25 via-slate-900 to-violet-500/20",
  "from-violet-500/25 via-slate-900 to-cyan-500/20",
  "from-amber-500/20 via-slate-900 to-emerald-500/15",
  "from-emerald-500/20 via-slate-900 to-sky-500/20",
  "from-sky-500/25 via-slate-900 to-amber-500/15",
]

export type VideoItem = {
  title: string
  creator: string
  views: string
  /** GMV formatado; omitido quando não faz sentido (ex.: ranking por views). */
  gmv?: string | null
  /** Capa do vídeo (URL assinada). Sem ela cai no gradiente. */
  cover?: string | null
  /** ID do vídeo no TikTok — usado pra embeber o player no modal. */
  videoId?: string | null
  /** Link do vídeo no TikTok (abrir em nova aba). */
  href?: string | null
  /** Link do PERFIL do criador no TikTok (abrir em nova aba). */
  creatorUrl?: string | null
  likes?: string | null
  comments?: string | null
  shares?: string | null
  favorites?: string | null
}

type VideoGridProps = {
  items: VideoItem[]
  className?: string
}

export function VideoGrid({ items, className }: VideoGridProps) {
  const [active, setActive] = useState<VideoItem | null>(null)

  return (
    <>
      <div
        className={cn(
          "grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6",
          className,
        )}
      >
        {items.map((item, index) => (
          <div key={item.videoId ?? index} className="flex flex-col gap-2.5">
            <button
              type="button"
              onClick={() => item.videoId && setActive(item)}
              disabled={!item.videoId}
              className={cn(
                "group relative aspect-[9/16] w-full overflow-hidden rounded-xl bg-gradient-to-br ring-1 ring-foreground/10",
                !item.cover && THUMB_TONES[index % THUMB_TONES.length],
                item.videoId && "cursor-pointer",
              )}
            >
              {item.cover ? (
                // eslint-disable-next-line @next/next/no-img-element -- CDN externo (echosell), sem next/image config
                <img
                  src={item.cover}
                  alt={item.title}
                  loading="lazy"
                  className="absolute inset-0 size-full object-cover"
                />
              ) : null}
              <span className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/30" />
              <PlayIcon
                className="absolute top-1/2 left-1/2 size-8 -translate-x-1/2 -translate-y-1/2 text-white/70 drop-shadow transition group-hover:scale-110 group-hover:text-white"
                fill="currentColor"
              />
              <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-full bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white/90">
                <EyeIcon className="size-3" />
                {item.views}
              </span>
            </button>
            <span className="truncate text-sm font-medium">{item.title}</span>
            <div className="flex items-center justify-between gap-2 text-xs">
              {item.creatorUrl ? (
                <a
                  href={item.creatorUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="truncate text-muted-foreground hover:text-foreground hover:underline"
                >
                  {item.creator}
                </a>
              ) : (
                <span className="truncate text-muted-foreground">
                  {item.creator}
                </span>
              )}
              {item.gmv ? (
                <span className="font-medium text-emerald-400">{item.gmv}</span>
              ) : null}
            </div>
            {item.likes || item.comments || item.shares || item.favorites ? (
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                {item.likes ? (
                  <span className="inline-flex items-center gap-0.5">
                    <HeartIcon className="size-3" />
                    {item.likes}
                  </span>
                ) : null}
                {item.comments ? (
                  <span className="inline-flex items-center gap-0.5">
                    <MessageCircleIcon className="size-3" />
                    {item.comments}
                  </span>
                ) : null}
                {item.shares ? (
                  <span className="inline-flex items-center gap-0.5">
                    <Share2Icon className="size-3" />
                    {item.shares}
                  </span>
                ) : null}
                {item.favorites ? (
                  <span className="inline-flex items-center gap-0.5">
                    <BookmarkIcon className="size-3" />
                    {item.favorites}
                  </span>
                ) : null}
              </div>
            ) : null}
          </div>
        ))}
      </div>

      <Dialog
        open={active !== null}
        onOpenChange={(open) => !open && setActive(null)}
      >
        <DialogContent
          showCloseButton={false}
          className="w-[340px] max-w-[calc(100%-2rem)] overflow-hidden p-0"
        >
          <DialogTitle className="sr-only">{active?.title}</DialogTitle>
          {active?.videoId ? (
            <iframe
              // autoplay=1: o modal abre por clique (gesto do usuário) + allow="autoplay"
              // → o player inicia sozinho. O iframe remonta a cada abertura (key),
              // garantindo que o autoplay dispare toda vez.
              key={active.videoId}
              src={`https://www.tiktok.com/player/v1/${active.videoId}?autoplay=1`}
              title={active.title}
              allow="autoplay; encrypted-media; fullscreen"
              className="aspect-[9/16] w-full border-0"
            />
          ) : null}
          {active?.href ? (
            <a
              href={active.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 border-t border-foreground/10 bg-muted/40 py-2.5 text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              Abrir no TikTok <ExternalLinkIcon className="size-3.5" />
            </a>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  )
}
