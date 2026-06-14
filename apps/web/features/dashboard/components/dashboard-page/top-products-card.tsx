import { Suspense } from "react"
import Link from "next/link"

import { ChevronRightIcon } from "lucide-react"

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"

import { SkeletonTable } from "@/shared"
import type { SkeletonColumn } from "@/shared"

import { TOP_PRODUCTS_LIMIT } from "../../consts"
import { getTopProducts } from "../../services/dashboard"

import { TopProductsTable } from "./top-products-table"

const SKELETON_COLUMNS: SkeletonColumn[] = [
  { header: "#", cell: "rank", className: "w-10" },
  { header: "Produto", cell: "media" },
  { header: "Vendas 24h", cell: "text", align: "right" },
  { header: "Tendência", cell: "sparkline", align: "right" },
  { header: "Variação 24h", cell: "badge", align: "right" },
  { header: "Score", cell: "score", align: "right" },
]

export function TopProductsCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Produtos mais vendidos</CardTitle>
        <CardDescription>
          Maiores volumes de venda nas últimas 24h
        </CardDescription>
        <CardAction>
          <Link
            href="/produtos"
            className="flex items-center gap-0.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Ver todos
            <ChevronRightIcon className="size-4" />
          </Link>
        </CardAction>
      </CardHeader>
      <CardContent>
        <Suspense
          fallback={
            <SkeletonTable
              bare
              columns={SKELETON_COLUMNS}
              rows={TOP_PRODUCTS_LIMIT}
            />
          }
        >
          <TopProductsData />
        </Suspense>
      </CardContent>
    </Card>
  )
}

async function TopProductsData() {
  const products = await getTopProducts(TOP_PRODUCTS_LIMIT)
  return <TopProductsTable products={products} />
}
