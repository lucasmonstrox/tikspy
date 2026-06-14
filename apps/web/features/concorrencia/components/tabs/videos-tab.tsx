import { Suspense } from "react"

import {
  formatBrlCompact,
  formatCompact,
  SkeletonVideoGrid,
  VideoGrid,
} from "@/shared"

import { VIDEOS_LIMIT } from "../../consts"
import type { VideoFilters } from "../../schemas/video-filters"
import { getVideoCategories, getVideos } from "../../services/videos"
import { VideosFilters } from "../videos-filters"

type VideosTabProps = {
  filters: VideoFilters
}

export async function VideosTab({ filters }: VideosTabProps) {
  const categories = await getVideoCategories()
  // Re-suspende a grid (mostra skeleton) sempre que um filtro muda.
  const filtersKey = `${filters.sort}|${filters.period}|${filters.ai}|${filters.category ?? ""}`

  return (
    <>
      <VideosFilters filters={filters} categories={categories} />
      <Suspense
        key={filtersKey}
        fallback={<SkeletonVideoGrid count={VIDEOS_LIMIT} />}
      >
        <VideosGrid filters={filters} />
      </Suspense>
    </>
  )
}

async function VideosGrid({ filters }: { filters: VideoFilters }) {
  const videos = await getVideos(filters)

  return (
    <VideoGrid
      items={videos.map((video) => ({
        title: video.title,
        creator: video.creatorHandle,
        creatorUrl: `https://www.tiktok.com/${video.creatorHandle}`,
        cover: video.cover,
        videoId: video.id,
        href: video.tiktokUrl,
        views: formatCompact(video.views),
        likes: video.likes != null ? formatCompact(video.likes) : undefined,
        comments:
          video.comments != null ? formatCompact(video.comments) : undefined,
        shares: video.shares != null ? formatCompact(video.shares) : undefined,
        favorites:
          video.favorites != null ? formatCompact(video.favorites) : undefined,
        gmv: formatBrlCompact(video.estimatedGmv),
      }))}
    />
  )
}
