import { type NextRequest } from "next/server"

import { updateSession } from "@/lib/supabase/proxy"

// Middleware (não `proxy.ts`): o OpenNext/Cloudflare Workers só suporta
// middleware em runtime Edge, e no Next 16 o `proxy.ts` é travado em Node.js.
// O arquivo legado `middleware.ts` roda em Edge — e o updateSession do Supabase
// é edge-safe (só @supabase/ssr + cookies).
export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match em todas as rotas exceto:
     * - _next/static (ficheiros estáticos)
     * - _next/image (otimização de imagens)
     * - favicon.ico
     * - ficheiros de imagem
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
