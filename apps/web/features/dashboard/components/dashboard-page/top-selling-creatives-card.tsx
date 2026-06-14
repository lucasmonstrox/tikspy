import { Suspense } from "react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"

import { SkeletonVideoGrid, VideoGrid } from "@/shared"

import { TOP_SELLING_CREATIVES_LIMIT } from "../../consts"
import { getTopSellingCreatives } from "../../services/dashboard"
import { formatBrlCompact, formatCompact } from "../../utils/format"

export function TopSellingCreativesCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Criativos que mais venderam</CardTitle>
        <CardDescription>
          Vídeos com maior GMV atribuído nas últimas 24h
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Suspense
          fallback={<SkeletonVideoGrid count={TOP_SELLING_CREATIVES_LIMIT} />}
        >
          <TopSellingCreativesGrid />
        </Suspense>
      </CardContent>
    </Card>
  )
}

async function TopSellingCreativesGrid() {
  const creatives = await getTopSellingCreatives(TOP_SELLING_CREATIVES_LIMIT)

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
        gmv: formatBrlCompact(creative.estimatedGmv),
      }))}
    />
  )
}
