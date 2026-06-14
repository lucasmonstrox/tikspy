import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import { cn } from "@workspace/ui/lib/utils"

export type DataColumn<T> = {
  header: string
  align?: "left" | "right" | "center"
  className?: string
  render: (row: T, index: number) => React.ReactNode
}

type DataTableProps<T> = {
  columns: DataColumn<T>[]
  rows: T[]
  /** Sem moldura própria — para uso dentro de um Card. */
  bare?: boolean
  className?: string
  /** Quando definido, a linha vira clicável (cursor + hover) e dispara isto. */
  onRowClick?: (row: T, index: number) => void
}

export function DataTable<T>({
  columns,
  rows,
  bare = false,
  className,
  onRowClick,
}: DataTableProps<T>) {
  return (
    <div
      className={cn(
        !bare && "overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10",
        className,
      )}
    >
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            {columns.map((column) => (
              <TableHead
                key={column.header}
                className={cn(alignClass(column.align), column.className)}
              >
                {column.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, rowIndex) => (
            <TableRow
              key={rowIndex}
              className={cn(
                "h-12",
                onRowClick &&
                  "cursor-pointer transition-colors hover:bg-accent/30",
              )}
              onClick={
                onRowClick ? () => onRowClick(row, rowIndex) : undefined
              }
            >
              {columns.map((column) => (
                <TableCell
                  key={column.header}
                  className={cn(alignClass(column.align), column.className)}
                >
                  <div
                    className={cn(
                      "flex items-center",
                      column.align === "right" && "justify-end",
                      column.align === "center" && "justify-center",
                    )}
                  >
                    {column.render(row, rowIndex)}
                  </div>
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

function alignClass(align?: "left" | "right" | "center") {
  if (align === "right") return "text-right"
  if (align === "center") return "text-center"
  return undefined
}
