# Fornecedores e Serviços Externos — TIKSPY

**Data:** 2026-06-10
**Status:** Registro vivo de fornecedores de dados e serviços externos (o que usamos, o que avaliamos, o que descartamos)

> Este documento é o **registro de decisão por fornecedor**: quem é, o que entrega, como integra, limites e pendências. Os *trade-offs* de arquitetura entre as opções de aquisição de dados vivem em [infra.md §3](./infra.md). Preços e limites são snapshots de junho/2026 — reconfirme na fonte.

---

## 1. Dados de mercado (fonte primária do produto)

> A fonte de dados de mercado é **uma camada substituível** (interface `DataSource`, ver infra.md §1) e pode ser composta por **mais de um fornecedor ao mesmo tempo** (ex.: um como fonte primária, outro para reconciliação/fallback). Os fornecedores abaixo são candidatos; nenhum é decisão fechada até passar pelas validações de trial.

### 1.1 EchoTik — **em uso (trial validado)** ✅

Fornecedor de dados de mercado do TikTok Shop via API. É o candidato mais forte para o MVP por ser o único player com **API self-service formal e documentada** — Kalodata e FastMoss só licenciam dados em contrato enterprise custom. **Validado empiricamente em 2026-06-10** com credencial de trial: autenticação OK e **cobertura do Brasil confirmada** (produtos em pt-BR com vendas/GMV diários reais). Integrado no `apps/api` (Elysia/Bun) atrás da interface `MarketDataSource`.

| Campo | Valor |
|---|---|
| Site | https://echotik.live |
| Página da API | https://echotik.live/en/api-service |
| Documentação técnica | https://opendoc.echotik.live (em 2026-06-10 estava instável/503 — reconfirmar) |
| Autenticação | **Basic Auth** — credenciais ativadas via customer service da EchoTik |
| Trial | **100 requests grátis** para teste |
| Preço | Por requisição; no plano anual chega a ~¥0,001/req (~US$0,0001) |
| Rate limits | **Não publicados** — definidos no contrato; confirmar na ativação |

**Dados que a API entrega** (categorias de endpoint):

- **Produtos:** lista, detalhes, tendência de preço, análise de vendas, rankings, criadores/vídeos/lives associados ao produto.
- **Lojas (shops):** lista, detalhes, tendências, rankings, produtos/criadores/vídeos/lives associados à loja.
- **Criadores:** GMV estimado, perfil de audiência, tendência de engajamento, seguidores, lista de vídeos e lives.
- **Vídeos:** views, likes, engajamento, comentários, legenda.
- **Lives:** espectadores em tempo real, picos, GMV estimado da live.
- **Mercado:** tendências por categoria, tópicos virais, insights de keywords.

**Endpoints mapeados empiricamente (2026-06-10)** — a opendoc passou o dia instável (503); o que está em produção foi validado por chamadas reais:

| Endpoint | Params obrigatórios | Notas |
|---|---|---|
| `GET /api/v2/product/list` | `region`, `page_num` | 100+ campos por produto: vendas/GMV por janela (1d/7d/15d/30d/60d/90d), vídeos, lives, views, comissão, rating. Params de sort aparentemente ignorados neste plano. |
| `GET /api/v2/product/ranklist` | `region`, `page_num`, `page_size`, `product_rank_field` (Integer, 1=vendas), `rank_type` (1=diário), `date` (`yyyy-MM-dd`) | Ranking diário. Resposta enxuta: vendas, GMV, nº vídeos/lives do dia. |
| `GET /api/v2/video/list` | `region`, `page_num` | Views/engajamento por janela + GMV do vídeo. **Sem título do vídeo** e sem sort aparente. |

**Limitações observadas no trial:**

- `page_size` máximo **10** (profundidade via paginação).
- JSON de resposta pode vir com **control chars crus** (descrições de produto) — sanitizar antes do parse.
- `/video/list` veio sem GMV>0 nos itens default e sem campo de título — falta mapear sort por GMV/endpoint de detalhe.
- Sem série temporal diária pronta (trend do dashboard segue mock até mapear endpoint de trends/categoria).
- Consumo do trial nesta validação: ~25 das 100 chamadas.

**Pendências para fechar contrato** (ver também infra.md §3.3):

- [x] Ativar conta de API com o customer service e obter credenciais.
- [x] **Validar cobertura do Brasil** — confirmada em 2026-06-10 (ranking diário BR real, produtos pt-BR).
- [ ] **Ler a licença/ToS** confirmando que exibir os dados dentro de um SaaS (revenda) é permitido.
- [ ] Confirmar rate limits, limites de page_size por plano e SLA no contrato.
- [ ] Mapear na opendoc (quando estabilizar): sort de `/video/list`, endpoint de trends/categoria, nomes de categoria, título de vídeo.
- [ ] Lembrete de posicionamento: os dados são **estimativas** — comunicar como "estimativas de venda em tempo quase real".

### 1.2 Demais candidatos

| Fornecedor | Status | Notas |
|---|---|---|
| **Apify** (apify.com) | Candidato | Actors prontos de TikTok Shop e de Creative Center (~US$2–10/1.000 resultados). Cobertura majoritariamente US — validar BR. Pode entrar como segunda fonte (reconciliação/fallback) ou até primária se o trial da EchoTik decepcionar. |
| **Kalodata** (kalodata.com) | Improvável como fonte | Produto final concorrente; não licencia dados brutos via API self-service (só enterprise custom — contato comercial possível, mas pouco plausível). Referência de UX/feature. |
| **FastMoss** (fastmoss.com) | Improvável como fonte | Mesmo caso da Kalodata. Maior cobertura histórica do mercado — benchmark de profundidade de dados. |
| **Scraping próprio** | Roadmap (escala) | Moat de longo prazo, foco em cobertura BR. Fora do MVP — ver infra.md §4. |

> Novos candidatos que aparecerem (outros data providers, marketplaces de dados, scrapers gerenciados) entram nesta tabela com status e notas — ver seção 3.

---

## 2. APIs oficiais do TikTok (complementares — nenhuma cobre inteligência de mercado)

Levantamento de 2026-06-10. Nenhuma API oficial entrega dados de mercado de terceiros (top produtos, GMV de concorrentes, criativos alheios) — por isso o fornecedor da seção 1. O que cada uma cobre e seus limites:

### 2.1 TikTok Shop Open API (Partner Center) — feature "conecte sua loja"

- **Docs:** https://partner.tiktokshop.com/docv2/page/rate-limits
- **Cobre:** produtos, pedidos, fulfillment, finanças, devoluções, promoções, afiliados, atendimento e webhooks — **somente de lojas que autorizaram o app via OAuth**.
- **Uso no TIKSPY:** alimenta o `/desempenho` (operação própria do cliente), nunca o Radar.
- **Opcional:** conectar/configurar a loja do TikTok Shop **não é obrigatório**. Toda a inteligência de mercado (Radar, Dashboard) funciona sem nenhuma loja conectada — a conexão via OAuth só desbloqueia o `/desempenho` (operação própria). Sem ela, o cliente usa o produto normalmente, apenas sem a camada de dados da própria operação.
- **Rate limit:** QPS **dinâmico** por `App ID × loja autorizada` — cresce com o número de lojas autorizadas; leituras ganham quota maior que escritas. Não há API para consultar a quota. Estouro → HTTP 429; retry com exponential backoff + jitter (1s dobrando até 60s). 503 = sobrecarga do backend, não rate limit. Para picos (datas de promoção), acionar o Account Manager antes.

### 2.2 Display API (developers.tiktok.com)

- **Cobre:** perfil e vídeos do usuário autenticado (`/v2/user/info/`, `/v2/video/list/`, `/v2/video/query/`).
- **Rate limit:** **600 req/min por endpoint**, janela deslizante de 1 min; 429 com `rate_limit_exceeded`; aumento negociável via suporte.
- **Uso no TIKSPY:** enriquecer criativos já identificados (metadados públicos de vídeo) e feature "conecte sua conta".

### 2.3 Content Posting API

- **Cobre:** publicar/agendar conteúdo em nome do usuário. ~**6 req/min por usuário**; apps não auditados só postam privado.
- **Uso no TIKSPY:** nenhum no MVP.

### 2.4 Research API — **inelegível** ❌

- Única API oficial com dados de TikTok Shop de terceiros, mas restrita a pesquisadores acadêmicos/ONGs aprovados; **proíbe uso comercial**. Quotas (referência): 1.000 req/dia, 100k registros/dia.

### 2.5 Commercial Content API

- Metadados de anúncios, exige aprovação (~2 dias úteis), cobre só ads da UE nesta fase. Possível enriquecimento de inteligência de ads no futuro — não no MVP.

### 2.6 Creative Center (sem API) — semente gratuita de tendências

- **URL:** https://ads.tiktok.com/business/creativecenter/top-products/pc/en
- "Top Products" e "Top Ads" por região/categoria/período, gratuito e sem login — mas **só UI, sem API oficial** e sem GMV/vendas orgânicas (métricas de ads: CTR, CVR, CPA). Acesso programático só via scrapers de terceiros (ex.: Apify). Camada complementar de sinal de criativo.

### 2.7 Marketing API (business-api.tiktok.com)

- Gestão e relatórios de anúncios **das próprias campanhas**. QPS por tier de app. Sem uso no MVP; relevante se o produto ganhar features de ads do próprio cliente.

---

## 3. Como adicionar um fornecedor a este registro

Ao avaliar/contratar qualquer serviço externo novo (dados, infra, alertas, billing…), registrar aqui: o que é, status da decisão (escolhido/avaliado/descartado/fallback), forma de integração (auth, docs), limites/preço e pendências. Serviços de plataforma (Neon, Upstash, Inngest, Resend etc.) já estão detalhados em [infra.md](./infra.md) — este documento aponta, não duplica.
