import { Suspense } from "react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"

import { SkeletonVideoGrid, type VideoItem } from "@/shared"

import { TOP_CREATIVES_LIMIT } from "../../../consts"
import {
  getTopSellingCreatives,
  getTrendingCreatives,
} from "../../../services/dashboard"
import { formatBrlCompact, formatCompact } from "../../../utils/format"
import { TopCreativesToggle } from "./top-creatives-toggle"

export function TopCreativesCard() {
  return (
    <Suspense fallback={<TopCreativesCardSkeleton />}>
      <TopCreativesCardContent />
    </Suspense>
  )
}

async function TopCreativesCardContent() {
  // As duas listas já eram buscadas (dois cards separados) — buscar ambas em
  // paralelo mantém o mesmo custo de cota da EchoTik e deixa o toggle do
  // cliente instantâneo (sem round-trip ao trocar de sort).
  const [topSelling, trending] = await Promise.all([
    getTopSellingCreatives(TOP_CREATIVES_LIMIT),
    getTrendingCreatives(TOP_CREATIVES_LIMIT),
  ])

  return (
    <TopCreativesToggle
      topSelling={topSelling.map((creative) => toVideoItem(creative, true))}
      trending={trending.map((creative) => toVideoItem(creative, false))}
    />
  )
}

type Creative = Awaited<ReturnType<typeof getTopSellingCreatives>>[number]

/** GMV só aparece em "Mais vendas" (ranking por views não mostra GMV). */
function toVideoItem(creative: Creative, withGmv: boolean): VideoItem {
  return {
    title: creative.title,
    creator: creative.creatorHandle,
    creatorUrl: `https://www.tiktok.com/${creative.creatorHandle}`,
    cover: creative.cover,
    videoId: creative.id,
    href: creative.tiktokUrl,
    views: formatCompact(creative.views),
    likes: creative.likes != null ? formatCompact(creative.likes) : undefined,
    comments:
      creative.comments != null ? formatCompact(creative.comments) : undefined,
    shares:
      creative.shares != null ? formatCompact(creative.shares) : undefined,
    gmv: withGmv ? formatBrlCompact(creative.estimatedGmv) : undefined,
  }
}

function TopCreativesCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Criativos que mais venderam</CardTitle>
        <CardDescription>
          Vídeos com maior GMV atribuído nas últimas 24h
        </CardDescription>
      </CardHeader>
      <CardContent>
        <SkeletonVideoGrid count={TOP_CREATIVES_LIMIT} />
      </CardContent>
    </Card>
  )
}
