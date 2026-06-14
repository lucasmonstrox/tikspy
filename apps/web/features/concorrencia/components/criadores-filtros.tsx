"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"

import type { CreatorFilters } from "../schemas/criadores-filtros"

const SORTS = [
  { value: "followers", label: "Seguidores" },
  { value: "gmv", label: "GMV estimado" },
  { value: "efficiency", label: "Eficiência" },
  { value: "videos", label: "Nº de vídeos" },
] as const

// influencer_category_name espera o NOME da categoria como o EchoTik conhece
// (en-US) — não o id nem o nome pt-BR. Lista curada (calibrar com dados reais).
const NICHES = [
  { value: "all", label: "Todos os nichos" },
  { value: "Beauty & Personal Care", label: "Beleza" },
  { value: "Womenswear & Underwear", label: "Moda feminina" },
  { value: "Phones & Electronics", label: "Eletrônicos" },
  { value: "Home Supplies", label: "Casa" },
  { value: "Health", label: "Saúde" },
  { value: "Sports & Outdoor", label: "Esporte & lazer" },
  { value: "Food & Beverages", label: "Alimentos" },
] as const

const MIN_FOLLOWERS = [
  { value: "all", label: "Qualquer alcance" },
  { value: "10000", label: "10 mil+ seguidores" },
  { value: "100000", label: "100 mil+ seguidores" },
  { value: "500000", label: "500 mil+ seguidores" },
  { value: "1000000", label: "1 mi+ seguidores" },
] as const

type CriadoresFiltrosProps = {
  filters: CreatorFilters
}

export function CriadoresFiltros({ filters }: CriadoresFiltrosProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  /** Aplica um patch na querystring (valor falsy remove a chave) e navega. */
  function update(patch: Record<string, string | undefined>) {
    const params = new URLSearchParams(searchParams.toString())
    for (const [key, value] of Object.entries(patch)) {
      if (value) params.set(key, value)
      else params.delete(key)
    }
    const qs = params.toString()
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Select
        value={filters.niche ?? "all"}
        onValueChange={(value) =>
          update({ niche: value === "all" ? undefined : value })
        }
      >
        <SelectTrigger size="sm" className="w-[180px]">
          <SelectValue placeholder="Nicho" />
        </SelectTrigger>
        <SelectContent>
          {NICHES.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.minFollowers ? String(filters.minFollowers) : "all"}
        onValueChange={(value) =>
          update({ minFollowers: value === "all" ? undefined : value })
        }
      >
        <SelectTrigger size="sm" className="w-[190px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {MIN_FOLLOWERS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.sort}
        onValueChange={(value) => update({ sort: value })}
      >
        <SelectTrigger size="sm" className="w-[170px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {SORTS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              Ordenar: {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
