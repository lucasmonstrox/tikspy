import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

/** Rotas públicas que não exigem sessão. */
const PUBLIC_PATHS = [
  "/login",
  "/registro",
  "/recuperar-senha",
  "/auth",
  "/definir-senha",
]

/**
 * Refresca a sessão Supabase em cada request e redireciona para /login
 * quem não está autenticado fora das rotas públicas.
 *
 * Chamado pelo middleware.ts da raiz (Edge runtime, exigido pelo OpenNext).
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  // Com Fluid compute, nunca guardar este cliente numa variável global:
  // criar sempre um novo por request.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  // Não correr código entre createServerClient e getClaims().
  // Um erro simples pode fazer users serem deslogados aleatoriamente.
  const { data } = await supabase.auth.getClaims()
  const user = data?.claims

  const { pathname } = request.nextUrl
  const isPublic = PUBLIC_PATHS.some((path) => pathname.startsWith(path))

  if (!user && !isPublic) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    return NextResponse.redirect(url)
  }

  // Se já há sessão e o user vai para /login ou /registro, manda para o dashboard.
  if (user && (pathname.startsWith("/login") || pathname.startsWith("/registro"))) {
    const url = request.nextUrl.clone()
    url.pathname = "/"
    return NextResponse.redirect(url)
  }

  // IMPORTANTE: devolver sempre o supabaseResponse intacto para preservar os cookies.
  return supabaseResponse
}
