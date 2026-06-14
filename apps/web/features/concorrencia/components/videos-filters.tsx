"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"

import type { MarketCategory } from "api"

import { Button } from "@workspace/ui/components/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { cn } from "@workspace/ui/lib/utils"

import type { VideoFilters } from "../schemas/video-filters"

const SORTS = [
  { value: "trending", label: "Em alta" },
  { value: "top-selling", label: "Mais vendas" },
] as const

const PERIODS = [
  { value: "day", label: "Hoje" },
  { value: "week", label: "Semana" },
  { value: "month", label: "Mês" },
] as const

const FORMATS = [
  { value: "all", label: "Todos os formatos" },
  { value: "human", label: "Criador humano" },
  { value: "ai", label: "Gerado por IA" },
] as const

type VideosFiltersProps = {
  filters: VideoFilters
  categories: MarketCategory[]
}

export function VideosFilters({ filters, categories }: VideosFiltersProps) {
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

  const categoryEnabled = filters.sort === "top-selling"

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Sort: segmented control (a doc do EchoTik separa views x vendas). */}
      <div className="inline-flex items-center gap-0.5 rounded-lg border border-input p-0.5">
        {SORTS.map((option) => (
          <Button
            key={option.value}
            type="button"
            size="sm"
            variant={filters.sort === option.value ? "default" : "ghost"}
            className="h-7"
            onClick={() =>
              update({
                sort: option.value,
                // Categoria não vale em "Em alta" → limpa ao trocar pra trending.
                category: option.value === "trending" ? undefined : filters.category,
              })
            }
          >
            {option.label}
          </Button>
        ))}
      </div>

      <Select
        value={filters.period}
        onValueChange={(value) => update({ period: value })}
      >
        <SelectTrigger size="sm" className="w-[120px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {PERIODS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.ai}
        onValueChange={(value) =>
          update({ ai: value === "all" ? undefined : value })
        }
      >
        <SelectTrigger size="sm" className="w-[160px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {FORMATS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.category ?? "all"}
        disabled={!categoryEnabled || categories.length === 0}
        onValueChange={(value) =>
          update({ category: value === "all" ? undefined : value })
        }
      >
        <SelectTrigger
          size="sm"
          className={cn("w-[180px]", !categoryEnabled && "opacity-60")}
          title={
            categoryEnabled
              ? undefined
              : "Categoria só filtra o ranking de vendas"
          }
        >
          <SelectValue placeholder="Categoria" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas as categorias</SelectItem>
          {categories.map((category) => (
            <SelectItem key={category.id} value={category.id}>
              {category.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
