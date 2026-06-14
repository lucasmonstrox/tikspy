import { cache } from "react"

import { api } from "@/lib/api/client"

import { CREATORS_LIMIT } from "../consts"
import type { CreatorFilters } from "../schemas/criadores-filtros"

/**
 * Criadores filtrados/ordenados server-side. Os filtros viram query → EchoTik
 * influencer/list. cache() do React deduplica chamadas do mesmo request.
 */
export const getCreators = cache(async (filters: CreatorFilters) => {
  const { data, error } = await api.v1.market.creators.get({
    query: {
      sort: filters.sort,
      niche: filters.niche,
      minFollowers: filters.minFollowers,
      limit: CREATORS_LIMIT,
    },
  })
  if (error) {
    throw new Error(
      `API do TIKSPY indisponível (status ${String(error.status)}) — suba o apps/api com \`bun dev\``
    )
  }
  return data
})
