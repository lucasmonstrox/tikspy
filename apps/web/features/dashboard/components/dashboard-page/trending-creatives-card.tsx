import { Suspense } from "react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"

import { SkeletonVideoGrid, VideoGrid } from "@/shared"

import { TRENDING_CREATIVES_LIMIT } from "../../consts"
import { getTrendingCreatives } from "../../services/dashboard"
import { formatCompact } from "../../utils/format"

export function TrendingCreativesCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Criativos em alta</CardTitle>
        <CardDescription>
          Vídeos com maior aceleração de views e GMV atribuído
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Suspense
          fallback={<SkeletonVideoGrid count={TRENDING_CREATIVES_LIMIT} />}
        >
          <TrendingCreativesGrid />
        </Suspense>
      </CardContent>
    </Card>
  )
}

async function TrendingCreativesGrid() {
  const creatives = await getTrendingCreatives(TRENDING_CREATIVES_LIMIT)

  return (
    <VideoGrid
      items={creatives.map((creative) => ({
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
      }))}
    />
  )
}
