import { WorkflowEntrypoint, type WorkflowStep } from "cloudflare:workers"
import type { WorkflowEvent } from "cloudflare:workers"

import {
  createDeliveriesForEvents,
  evaluateRuleAgainstMarket,
  type AlertRuleRow,
} from "../alerts/engine"
import { quietHoursWaitMs } from "../alerts/quiet-hours"
import { type Env, propagateEnv } from "../lib/env"
import { supabaseAdmin } from "../lib/supabase"

type Params = { snapshotDt?: string }

/** Teto de delay de mensagem da Queue (12h). Janelas de quiet-hours realistas cabem. */
const MAX_QUEUE_DELAY_S = 43200

/**
 * Avaliação diária de alertas (cron "30 9 * * *" no wrangler.jsonc).
 *
 * Substitui o trio de tasks do Trigger.dev (evaluateAlerts/evaluateRule/cron) por
 * passos duráveis: cada `step.do` tem o resultado persistido — se o Workflow cair
 * e resumir, passos concluídos NÃO re-rodam (idempotência por nome de passo, no
 * lugar do idempotencyKey). A entrega em si é fan-out para a Queue whatsapp-send.
 */
export class EvaluateAlertsWorkflow extends WorkflowEntrypoint<Env, Params> {
  async run(event: WorkflowEvent<Params>, step: WorkflowStep) {
    propagateEnv(this.env)
    const db = supabaseAdmin()

    // Sem dt explícito, usa o último dia com score — nunca assume "ontem" (se a
    // ingestão atrasar, avaliar dado velho re-dispara janela errada).
    const snapshotDt = await step.do("resolve-snapshot-dt", async () => {
      if (event.payload?.snapshotDt) return event.payload.snapshotDt
      const { data, error } = await db
        .from("product_scores")
        .select("dt")
        .order("dt", { ascending: false })
        .limit(1)
      if (error) throw new Error(`max(dt): ${error.message}`)
      return (data?.[0]?.dt as string | undefined) ?? null
    })
    if (!snapshotDt) return { rules: 0, snapshotDt: null, queued: 0 }

    // Regras buscadas FORA de step.do: AlertRuleRow.condition é `unknown` e não
    // passa pela serialização exigida pelo step. Re-buscar no resume é barato e
    // idempotente — só os passos por-regra (abaixo) precisam ser duráveis.
    const { data: ruleData, error: rulesError } = await db
      .from("alert_rules")
      .select("*")
      .eq("enabled", true)
    if (rulesError) throw new Error(`alert_rules: ${rulesError.message}`)
    const rules = (ruleData ?? []) as AlertRuleRow[]
    if (!rules.length) return { rules: 0, snapshotDt, queued: 0 }

    let queued = 0
    for (const rule of rules) {
      // 1 passo por regra: nome determinístico (rule:id:dt) garante que um resume
      // não reavalia regra já processada no dia.
      queued += await step.do(`rule:${rule.id}:${snapshotDt}`, async () => {
        const summary = await evaluateRuleAgainstMarket(db, rule, snapshotDt)
        const { queuedIds } = await createDeliveriesForEvents(db, rule, summary.inserted)

        // Quiet-hours → ADIA a entrega via delay da mensagem (não trava o consumer
        // concurrency:1). O consumer ainda re-checa na hora (cobre cap de 12h/skew).
        const delaySeconds = Math.min(
          Math.ceil(quietHoursWaitMs(rule.quiet_hours) / 1000),
          MAX_QUEUE_DELAY_S,
        )
        for (const deliveryId of queuedIds) {
          await this.env.WHATSAPP_QUEUE.send(
            { deliveryId },
            delaySeconds > 0 ? { delaySeconds } : undefined,
          )
        }
        return queuedIds.length
      })
    }

    return { rules: rules.length, snapshotDt, queued }
  }
}
