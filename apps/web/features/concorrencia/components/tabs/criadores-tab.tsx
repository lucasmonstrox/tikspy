import { Suspense } from "react"

import { Skeleton } from "@workspace/ui/components/skeleton"

import { CREATORS_LIMIT } from "../../consts"
import type { CreatorFilters } from "../../schemas/criadores-filtros"
import { getCreators } from "../../services/criadores"
import { CriadorCard } from "../criador-card"
import { CriadoresFiltros } from "../criadores-filtros"

type CriadoresTabProps = {
  filters: CreatorFilters
}

export function CriadoresTab({ filters }: CriadoresTabProps) {
  // Re-suspende a grid (mostra skeleton) sempre que um filtro muda.
  const filtersKey = `${filters.sort}|${filters.niche ?? ""}|${filters.minFollowers ?? ""}`

  return (
    <>
      <CriadoresFiltros filters={filters} />
      <Suspense key={filtersKey} fallback={<SkeletonCreatorGrid />}>
        <CriadoresGrid filters={filters} />
      </Suspense>
    </>
  )
}

async function CriadoresGrid({ filters }: { filters: CreatorFilters }) {
  const creators = await getCreators(filters)

  if (creators.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Nenhum criador encontrado pros filtros atuais.
      </p>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {creators.map((creator, index) => (
        <CriadorCard key={creator.id} creator={creator} seed={index} />
      ))}
    </div>
  )
}

function SkeletonCreatorGrid() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: CREATORS_LIMIT }).map((_, index) => (
        <Skeleton key={index} className="h-44 rounded-xl" />
      ))}
    </div>
  )
}
