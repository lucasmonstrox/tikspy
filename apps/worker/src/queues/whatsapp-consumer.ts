import { getWhatsappChannel } from "@workspace/notifications"
import type { MessageBatch } from "@cloudflare/workers-types"

import { renderWhatsappMessage } from "../alerts/events"
import { quietHoursWaitMs } from "../alerts/quiet-hours"
import { type Env, propagateEnv, type WhatsappJob } from "../lib/env"
import { supabaseAdmin } from "../lib/supabase"

/** Backoff base entre re-tentativas de envio (s). max_retries→DLQ no wrangler.jsonc. */
const RETRY_DELAY_S = 30
const MAX_QUEUE_DELAY_S = 43200

type DeliverResult = { retry: false } | { retry: true; delaySeconds: number }

/**
 * Consumer da fila whatsapp-send (max_concurrency:1 → 1 número, sem rajada).
 * Substitui a task deliverNotification do Trigger.dev. `wait.until` (quiet-hours)
 * vira re-enfileiramento com delay; `wait.for` (jitter) vira setTimeout local.
 */
export async function handleWhatsappBatch(batch: MessageBatch<WhatsappJob>, env: Env) {
  propagateEnv(env)
  for (const message of batch.messages) {
    try {
      const result = await deliverOne(message.body.deliveryId)
      if (result.retry) message.retry({ delaySeconds: result.delaySeconds })
      else message.ack()
    } catch {
      // Falha inesperada/retryável → re-tenta com backoff (teto em max_retries → DLQ).
      message.retry({ delaySeconds: RETRY_DELAY_S })
    }
  }
}

async function deliverOne(deliveryId: string): Promise<DeliverResult> {
  const db = supabaseAdmin()

  const { data: delivery, error } = await db
    .from("notification_deliveries")
    .select("id, tenant_id, channel, status, attempts, alert_events(title, description, rule_id)")
    .eq("id", deliveryId)
    .maybeSingle()
  if (error) throw new Error(`delivery load: ${error.message}`)
  if (!delivery || delivery.status !== "queued") return { retry: false } // replay → no-op

  const event = delivery.alert_events as unknown as {
    title: string
    description: string
    rule_id: string
  } | null
  if (!event) throw new Error("entrega sem evento associado")

  // Quiet-hours: re-checa NA HORA do envio. Ainda em silêncio (cap 12h/skew) →
  // re-enfileira com o delay restante. Nunca descarta.
  const { data: rule } = await db
    .from("alert_rules")
    .select("quiet_hours")
    .eq("id", event.rule_id)
    .maybeSingle()
  const waitMs = quietHoursWaitMs(rule?.quiet_hours)
  if (waitMs > 0) {
    const resumeAt = new Date(Date.now() + waitMs)
    await db
      .from("notification_deliveries")
      .update({ scheduled_for: resumeAt.toISOString() })
      .eq("id", delivery.id)
    return { retry: true, delaySeconds: Math.min(Math.ceil(waitMs / 1000), MAX_QUEUE_DELAY_S) }
  }

  // Consentimento re-checado na hora (pode ter optado-out durante o delay).
  const { data: channelRow } = await db
    .from("notification_channels")
    .select("status, enabled, address")
    .eq("tenant_id", delivery.tenant_id)
    .eq("channel", "whatsapp")
    .maybeSingle()
  const phone = (channelRow?.address as { phone?: string } | null)?.phone
  if (!channelRow || channelRow.status !== "confirmed" || !channelRow.enabled || !phone) {
    await db
      .from("notification_deliveries")
      .update({ status: "skipped", skip_reason: "consent_revoked" })
      .eq("id", delivery.id)
    return { retry: false }
  }

  const channel = getWhatsappChannel()

  // Saúde do remetente: instância caída → falha (retry resolve queda transitória).
  if (channel.provider !== "log") {
    const health = await channel.health()
    if (health.state !== "open") {
      await db
        .from("notification_deliveries")
        .update({
          status: "failed",
          last_error: `instância WhatsApp ${health.state}`,
          failed_at: new Date().toISOString(),
          attempts: (delivery.attempts ?? 0) + 1,
        })
        .eq("id", delivery.id)
      throw new Error(`instância WhatsApp não conectada (${health.state})`) // → retry
    }
  }

  // Throttle anti-ban: jitter humano (a fila já é concurrency 1).
  await new Promise((resolve) => setTimeout(resolve, (3 + Math.random() * 5) * 1000))

  const result = await channel.sendText(
    phone,
    renderWhatsappMessage(event.title, event.description),
  )
  const now = new Date().toISOString()

  if (result.ok) {
    await db
      .from("notification_deliveries")
      .update({
        status: "sent",
        provider: channel.provider,
        provider_message_id: result.providerMessageId,
        sent_at: now,
        attempts: (delivery.attempts ?? 0) + 1,
      })
      .eq("id", delivery.id)
    return { retry: false }
  }

  await db
    .from("notification_deliveries")
    .update({
      status: "failed",
      last_error: result.error,
      failed_at: now,
      attempts: (delivery.attempts ?? 0) + 1,
    })
    .eq("id", delivery.id)
  if (result.retryable) throw new Error(result.error) // unique (event,channel) impede duplicar
  return { retry: false }
}
