import { PageHeader, PageShell } from "@/shared"

import { parseVideoFilters } from "../schemas/video-filters"
import { VideosTab } from "./tabs/videos-tab"

type VideosPageProps = {
  searchParams: Record<string, string | string[] | undefined>
}

export function VideosPage({ searchParams }: VideosPageProps) {
  const filters = parseVideoFilters(searchParams)

  return (
    <PageShell>
      <PageHeader
        title="Vídeos & criativos"
        description="Criativos que estão convertendo agora, vinculados a produto e venda estimada."
      />
      <VideosTab filters={filters} />
    </PageShell>
  )
}
