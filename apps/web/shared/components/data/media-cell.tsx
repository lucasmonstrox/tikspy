import { cn } from "@workspace/ui/lib/utils"

import { getInitials } from "../../utils/chart"

const TONES = [
  "from-cyan-500/30 to-cyan-500/5 text-cyan-300",
  "from-rose-500/30 to-rose-500/5 text-rose-300",
  "from-violet-500/30 to-violet-500/5 text-violet-300",
  "from-amber-500/30 to-amber-500/5 text-amber-300",
  "from-emerald-500/30 to-emerald-500/5 text-emerald-300",
  "from-sky-500/30 to-sky-500/5 text-sky-300",
]

type MediaCellProps = {
  title: string
  subtitle?: string
  /** URL da imagem; quando ausente cai no gradiente com iniciais. */
  image?: string | null
  seed?: number
  shape?: "square" | "circle"
  className?: string
}

export function MediaCell({
  title,
  subtitle,
  image,
  seed = 0,
  shape = "square",
  className,
}: MediaCellProps) {
  const shapeClass = shape === "circle" ? "size-8 rounded-full" : "size-9 rounded-md"
  return (
    <div className={cn("flex items-center gap-3", className)}>
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element -- CDN externo (echosell), sem next/image config
        <img
          src={image}
          alt={title}
          loading="lazy"
          className={cn("shrink-0 bg-muted object-cover", shapeClass)}
        />
      ) : (
        <div
          className={cn(
            "flex shrink-0 items-center justify-center bg-gradient-to-br text-xs font-semibold",
            shapeClass,
            TONES[seed % TONES.length],
          )}
        >
          {getInitials(title)}
        </div>
      )}
      <div className="flex min-w-0 flex-col">
        <span className="max-w-44 truncate text-sm font-medium">{title}</span>
        {subtitle ? (
          <span className="max-w-44 truncate text-xs text-muted-foreground">
            {subtitle}
          </span>
        ) : null}
      </div>
    </div>
  )
}
