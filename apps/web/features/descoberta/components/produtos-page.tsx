import { Suspense } from "react"

import { Skeleton } from "@workspace/ui/components/skeleton"

import { PageHeader, PageShell } from "@/shared"

import { PRODUCTS_LIMIT } from "../consts"
import {
  parseProductFilters,
  type ProductFilters,
} from "../schemas/produtos-filtros"
import { getProductCategories, getProducts } from "../services/produtos"
import { ProdutoCard } from "./produto-card"
import { ProdutosFiltros } from "./produtos-filtros"

type ProdutosPageProps = {
  searchParams: Record<string, string | string[] | undefined>
}

export async function ProdutosPage({ searchParams }: ProdutosPageProps) {
  const filters = parseProductFilters(searchParams)
  const categories = await getProductCategories()
  // Re-suspende a grid (mostra skeleton) sempre que um filtro muda.
  const filtersKey = `${filters.q ?? ""}|${filters.category ?? ""}|${filters.momentum}|${filters.minCommission ?? ""}|${filters.sort}`

  return (
    <PageShell>
      <PageHeader
        title="Produtos"
        description="Descoberta de produtos no TikTok Shop Brasil — filtre por categoria, comissão e momento (em alta ou emergentes)."
      />
      <ProdutosFiltros filters={filters} categories={categories} />
      <Suspense key={filtersKey} fallback={<SkeletonProductGrid />}>
        <ProdutosGrid filters={filters} />
      </Suspense>
    </PageShell>
  )
}

async function ProdutosGrid({ filters }: { filters: ProductFilters }) {
  const products = await getProducts(filters)

  if (products.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Nenhum produto encontrado pros filtros atuais.
      </p>
    )
  }

  // Rank só faz sentido em ordenação por volume; em "Score" o número confundiria.
  const ranked = filters.sort !== "score" && filters.sort !== "price"

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((produto, index) => (
        <ProdutoCard
          key={produto.id}
          produto={produto}
          seed={index}
          rank={ranked ? index + 1 : undefined}
        />
      ))}
    </div>
  )
}

function SkeletonProductGrid() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: PRODUCTS_LIMIT }).map((_, index) => (
        <Skeleton key={index} className="h-72 rounded-xl" />
      ))}
    </div>
  )
}
