import { cache } from "react"

import { api } from "@/lib/api/client"

import { LIVES_LIMIT } from "../consts"

/** cache() do React deduplica chamadas do mesmo request entre componentes. */
export const getLives = cache(async () => {
  const { data, error } = await api.v1.market.lives.get({
    query: { limit: LIVES_LIMIT },
  })
  if (error) {
    throw new Error(
      `API do TIKSPY indisponível (status ${String(error.status)}) — suba o apps/api com \`bun dev\``,
    )
  }
  return data
})
