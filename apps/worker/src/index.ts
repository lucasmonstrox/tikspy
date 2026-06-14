/**
 * Entry do tikspy-worker (Cloudflare Workers / workerd).
 *
 * Um único script reúne os 3 primitivos:
 *   - Cron Trigger  → schedules no binding do Workflow (wrangler.jsonc), cria
 *                     uma instância de EvaluateAlertsWorkflow a cada disparo.
 *   - Workflow      → EvaluateAlertsWorkflow (durável, multi-step).
 *   - Queue         → consumer whatsapp-send (handler `queue`, max_concurrency:1).
 *
 * Substitui integralmente o Trigger.dev. Disparo manual (ops): `wrangler workflows
 * trigger tikspy-evaluate-alerts`.
 */
import type { MessageBatch } from "@cloudflare/workers-types"

import { type Env, type WhatsappJob } from "./lib/env"
import { handleWhatsappBatch } from "./queues/whatsapp-consumer"

export { EvaluateAlertsWorkflow } from "./workflows/evaluate-alerts"

export default {
  /** Consumer da fila whatsapp-send. */
  async queue(batch: MessageBatch<WhatsappJob>, env: Env) {
    return handleWhatsappBatch(batch, env)
  },
}
