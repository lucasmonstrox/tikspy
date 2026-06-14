/**
 * Bindings do Worker (workerd) + propagação de env.
 *
 * O workerd entrega config/segredos via o objeto `env` (não via process.env). O
 * engine de alertas e o @workspace/notifications leem tudo de process.env, então
 * propagamos uma vez no início de cada handler (workflow / queue consumer).
 */
import type { Queue, Workflow } from "@cloudflare/workers-types"

export interface Env {
  /** Workflow de avaliação diária de alertas (cron no wrangler.jsonc). */
  ALERTS_WORKFLOW: Workflow
  /** Fila do remetente WhatsApp (serializada, anti-ban). */
  WHATSAPP_QUEUE: Queue<WhatsappJob>
  /** Segredos (propagados p/ process.env): SUPABASE_*, EVOLUTION_*, WHATSAPP_PROVIDER. */
  [key: string]: unknown
}

/** Mensagem da fila whatsapp-send: 1 entrega a enviar. */
export type WhatsappJob = { deliveryId: string }

/** Copia strings de `env` para process.env (sem sobrescrever o que já existe). */
export function propagateEnv(env: Record<string, unknown>): void {
  for (const [key, value] of Object.entries(env)) {
    if (typeof value === "string" && process.env[key] === undefined) {
      process.env[key] = value
    }
  }
}
