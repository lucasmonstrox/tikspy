import type { Metadata } from "next"

import { CriadoresPage } from "@/features/concorrencia"

export const metadata: Metadata = { title: "Criadores" }

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  return <CriadoresPage searchParams={await searchParams} />
}
