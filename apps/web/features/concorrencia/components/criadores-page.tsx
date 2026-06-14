import { PageHeader, PageShell } from "@/shared"

import { parseCreatorFilters } from "../schemas/criadores-filtros"
import { CriadoresTab } from "./tabs/criadores-tab"

type CriadoresPageProps = {
  searchParams: Record<string, string | string[] | undefined>
}

export function CriadoresPage({ searchParams }: CriadoresPageProps) {
  const filters = parseCreatorFilters(searchParams)

  return (
    <PageShell>
      <PageHeader
        title="Criadores"
        description="Quem está vendendo o quê — afiliados e criadores ranqueados por eficiência de venda."
      />
      <CriadoresTab filters={filters} />
    </PageShell>
  )
}
