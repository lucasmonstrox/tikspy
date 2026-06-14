import { cache } from "react"

import { api } from "@/lib/api/client"

import { PRODUCTS_LIMIT } from "../consts"
import type { ProductFilters } from "../schemas/produtos-filtros"

function apiUnavailable(status: unknown): never {
  throw new Error(
    `API do TIKSPY indisponível (status ${String(status)}) — suba o apps/api com \`bun dev\``,
  )
}

/**
 * Produtos filtrados/ordenados server-side. Os filtros viram query → EchoTik
 * product/list (ou search/items quando há busca por nome). cache() do React
 * deduplica chamadas do mesmo request.
 */
export const getProducts = cache(async (filters: ProductFilters) => {
  const { data, error } = await api.v1.market.products.get({
    query: {
      query: filters.q,
      category: filters.category,
      minCommission: filters.minCommission,
      momentum: filters.momentum,
      sort: filters.sort,
      // "Menor preço" ordena ascendente; todo o resto é desc (maior primeiro).
      sortDir: filters.sort === "price" ? "asc" : "desc",
      limit: PRODUCTS_LIMIT,
    },
  })
  if (error) apiUnavailable(error.status)
  return data
})

/**
 * Categorias L1 pro filtro. Auxiliar: se a API falhar, devolve [] (o select
 * fica vazio) em vez de derrubar a página inteira de produtos.
 */
export const getProductCategories = cache(async () => {
  const { data, error } = await api.v1.market.categories.get()
  if (error) return []
  return data
})

/** Ficha completa de um produto (product/detail) — base do /produtos/[id]. */
export const getProductDetail = cache(async (id: string) => {
  const { data, error } = await api.v1.market.products({ id }).get()
  if (error) {
    // 404 = produto sem ficha no EchoTik; devolve null (a página sinaliza).
    if (error.status === 404) return null
    apiUnavailable(error.status)
  }
  return data
})
