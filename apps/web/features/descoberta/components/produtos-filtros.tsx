"use client"

import { useRef } from "react"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { SearchIcon } from "lucide-react"

import type { MarketCategory } from "api"

import { Input } from "@workspace/ui/components/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"

import type { ProductFilters } from "../schemas/produtos-filtros"

const MOMENTA = [
  { value: "todos", label: "Todos os produtos" },
  { value: "consolidado", label: "Em alta" },
  { value: "emergente", label: "Emergentes" },
] as const

const COMMISSIONS = [
  { value: "all", label: "Qualquer comissão" },
  { value: "0.1", label: "Comissão 10%+" },
  { value: "0.2", label: "Comissão 20%+" },
  { value: "0.3", label: "Comissão 30%+" },
] as const

const SORTS = [
  { value: "sales30d", label: "Vendas 30d" },
  { value: "sales7d", label: "Vendas 7d" },
  { value: "sales", label: "Vendas totais" },
  { value: "score", label: "Score" },
  { value: "price", label: "Menor preço" },
] as const

type ProdutosFiltrosProps = {
  filters: ProductFilters
  categories: MarketCategory[]
}

export function ProdutosFiltros({ filters, categories }: ProdutosFiltrosProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const debounce = useRef<ReturnType<typeof setTimeout>>(undefined)

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

  // Debounce da busca: só navega 400ms após a última tecla (poupa requests). O
  // input é não-controlado com `key={filters.q}` → re-monta (e re-sincroniza)
  // quando a URL muda por fora (voltar/limpar), sem precisar de estado/efeito.
  function onSearch(value: string) {
    clearTimeout(debounce.current)
    debounce.current = setTimeout(
      () => update({ q: value.trim() || undefined }),
      400,
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative w-full max-w-xs">
        <SearchIcon className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground/60" />
        <Input
          key={filters.q ?? ""}
          defaultValue={filters.q ?? ""}
          onChange={(event) => onSearch(event.target.value)}
          placeholder="Buscar produto…"
          className="pl-9"
        />
      </div>

      <Select
        value={filters.category ?? "all"}
        disabled={categories.length === 0}
        onValueChange={(value) =>
          update({ category: value === "all" ? undefined : value })
        }
      >
        <SelectTrigger size="sm" className="w-[180px]">
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

      <Select
        value={filters.momentum}
        onValueChange={(value) =>
          update({ momentum: value === "todos" ? undefined : value })
        }
      >
        <SelectTrigger size="sm" className="w-[170px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {MOMENTA.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.minCommission ? String(filters.minCommission) : "all"}
        onValueChange={(value) =>
          update({ minCommission: value === "all" ? undefined : value })
        }
      >
        <SelectTrigger size="sm" className="w-[185px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {COMMISSIONS.map((option) => (
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
        <SelectTrigger size="sm" className="w-[180px]">
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
