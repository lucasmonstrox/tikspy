// O trial do EchoTik devolve no máximo ~20 vídeos (2 páginas × 10); o limite
// só faz teto, o adapter retorna o que houver.
export const VIDEOS_LIMIT = 20

// Lives: teto de linhas na tabela. O adapter varre as top lojas (≤10 lives cada)
// e já corta no topo por GMV; aqui só limitamos o que chega à UI.
export const LIVES_LIMIT = 12

// Criadores: teto de cards exibidos. O adapter pagina influencer/list (≤10/pág)
// e o filtro/ordenação são server-side; aqui só limitamos o que chega à UI.
export const CREATORS_LIMIT = 20
