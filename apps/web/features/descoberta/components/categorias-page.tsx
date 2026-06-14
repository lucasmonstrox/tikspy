import Link from "next/link"

import type { MarketCategoryStats } from "api"

import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"

import {
  Delta,
  formatBrlCompact,
  formatDeltaPct,
  formatInteger,
  MiniBars,
  PageHeader,
  PageShell,
} from "@/shared"

import { getMarketCategories } from "../services/categorias"

export async function CategoriasPage() {
  const { categories } = await getMarketCategories()

  return (
    <PageShell>
      <PageHeader
        title="Categorias"
        description="Desempenho por categoria do TikTok Shop Brasil no ranking diário de vendas."
      />
      {categories.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Ranking de categorias ainda não publicado para hoje. O EchoTik
            disponibiliza o ranking diário com 1 dia de atraso (T+1) — tente
            novamente mais tarde.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {categories.map((categoria) => (
            <CategoriaCard key={categoria.id} categoria={categoria} />
          ))}
        </div>
      )}
    </PageShell>
  )
}

function CategoriaCard({ categoria }: { categoria: MarketCategoryStats }) {
  const up = (categoria.gmvDelta ?? 0) >= 0
  // Distribuição só faz sentido com ≥3 produtos; com 1-2 o MiniBars vira um bloco
  // sólido feio. Aí mostra só uma linha-base sutil pra manter a altura do card.
  const temDistribuicao = categoria.gmvTrend.length >= 3

  return (
    <Link href={`/categorias/${categoria.id}`}>
      <Card
        size="sm"
        className="h-full transition-colors hover:border-foreground/20 hover:bg-accent/30"
      >
        <CardHeader>
          <CardTitle className="text-sm">{categoria.name}</CardTitle>
          {categoria.gmvDelta !== null && (
            <CardAction>
              <Delta value={formatDeltaPct(categoria.gmvDelta)} up={up} />
            </CardAction>
          )}
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {temDistribuicao ? (
            <MiniBars data={categoria.gmvTrend} highlightLast={up} />
          ) : (
            <div className="flex h-24 items-end" aria-hidden>
              <div className="h-px w-full bg-muted-foreground/15" />
            </div>
          )}
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-muted-foreground/70">GMV 24h</span>
              <span className="text-sm font-medium">
                {formatBrlCompact(categoria.gmv)}
              </span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-muted-foreground/70">No ranking</span>
              <span className="text-sm font-medium">
                {formatInteger(categoria.productCount)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
