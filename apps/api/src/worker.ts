/**
 * Entry de Cloudflare Workers da API (Elysia no workerd).
 *
 * O Elysia expõe um handler fetch compatível com o workerd — este arquivo é só
 * o adaptador. O servidor Bun continua em index.ts (guard `import.meta.main`);
 * este arquivo nunca roda sob Bun.
 *
 * Sem Hyperdrive: a API fala com o Supabase via @supabase/supabase-js (HTTP /
 * PostgREST) e com EchoTik/Evolution via fetch — tudo HTTP, nativo no workerd.
 */
export default {
  async fetch(request: Request, env: Record<string, string>) {
    // O workerd entrega config/segredos via `env`, não via process.env — propaga
    // antes do primeiro handler tocar (nodejs_compat só popula parcialmente).
    for (const [k, v] of Object.entries(env)) {
      if (typeof v === "string" && process.env[k] === undefined) process.env[k] = v
    }
    // Import preguiçoso: avaliar os schemas (TypeBox/zod) no escopo de módulo
    // pode estourar o limite de CPU de startup do deploy.
    application ??= (await import("./index")).app
    return application.fetch(request)
  },
}

let application: { fetch: (req: Request) => Promise<Response> | Response } | undefined
