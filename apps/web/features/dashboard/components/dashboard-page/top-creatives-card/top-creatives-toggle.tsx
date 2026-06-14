"use client"

import { useState } from "react"

import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"

import { VideoGrid, type VideoItem } from "@/shared"

type CreativeSort = "top-selling" | "trending"

// Default primeiro: o dashboard abre em "Mais vendas". Cada sort carrega seu
// próprio título/descrição (espelha os dois cards que existiam antes do merge).
const SORTS = [
  {
    value: "top-selling",
    label: "Mais vendas",
    title: "Criativos que mais venderam",
    description: "Vídeos com maior GMV atribuído nas últimas 24h",
  },
  {
    value: "trending",
    label: "Em alta",
    title: "Criativos em alta",
    description: "Vídeos com maior aceleração de views e GMV atribuído",
  },
] as const satisfies ReadonlyArray<{
  value: CreativeSort
  label: string
  title: string
  description: string
}>

type TopCreativesToggleProps = {
  topSelling: VideoItem[]
  trending: VideoItem[]
}

export function TopCreativesToggle({
  topSelling,
  trending,
}: TopCreativesToggleProps) {
  const [sort, setSort] = useState<CreativeSort>("top-selling")
  const view = SORTS.find((option) => option.value === sort) ?? SORTS[0]
  const items = sort === "top-selling" ? topSelling : trending

  return (
    <Card>
      <CardHeader>
        <CardTitle>{view.title}</CardTitle>
        <CardDescription>{view.description}</CardDescription>
        <CardAction>
          {/* Segmented control igual ao /videos (videos-filters.tsx). */}
          <div className="inline-flex items-center gap-0.5 rounded-lg border border-input p-0.5">
            {SORTS.map((option) => (
              <Button
                key={option.value}
                type="button"
                size="sm"
                variant={sort === option.value ? "default" : "ghost"}
                className="h-7"
                onClick={() => setSort(option.value)}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </CardAction>
      </CardHeader>
      <CardContent>
        <VideoGrid items={items} />
      </CardContent>
    </Card>
  )
}
