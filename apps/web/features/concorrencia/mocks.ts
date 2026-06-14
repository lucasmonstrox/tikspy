export type Criador = {
  nome: string
  nicho: string
  seguidores: string
  videos30d: string
  produtos: string
  gmv: string
  eficiencia: number
  spark: number[]
  up: boolean
}

export const CRIADORES: Criador[] = [
  { nome: "@camilamakes", nicho: "Beleza", seguidores: "2,4M", videos30d: "38", produtos: "21", gmv: "R$ 612 mil", eficiencia: 93, spark: [40, 46, 52, 61, 70, 82, 95], up: true },
  { nome: "@techdoluca", nicho: "Tech", seguidores: "1,2M", videos30d: "26", produtos: "14", gmv: "R$ 487 mil", eficiencia: 91, spark: [35, 41, 48, 55, 67, 78, 90], up: true },
  { nome: "@achadinhosdaduda", nicho: "Achados", seguidores: "890 mil", videos30d: "44", produtos: "33", gmv: "R$ 391 mil", eficiencia: 84, spark: [30, 34, 39, 47, 55, 64, 72], up: true },
  { nome: "@casadajuh", nicho: "Casa", seguidores: "760 mil", videos30d: "29", produtos: "18", gmv: "R$ 284 mil", eficiencia: 77, spark: [28, 32, 30, 38, 44, 51, 58], up: true },
  { nome: "@fitcomnanda", nicho: "Fitness", seguidores: "650 mil", videos30d: "22", produtos: "11", gmv: "R$ 213 mil", eficiencia: 71, spark: [25, 28, 27, 33, 37, 42, 47], up: true },
  { nome: "@reviewsdopedro", nicho: "Reviews", seguidores: "640 mil", videos30d: "18", produtos: "16", gmv: "R$ 198 mil", eficiencia: 72, spark: [30, 29, 33, 36, 40, 44, 49], up: true },
  { nome: "@modacomlais", nicho: "Moda", seguidores: "520 mil", videos30d: "31", produtos: "24", gmv: "R$ 154 mil", eficiencia: 63, spark: [33, 35, 34, 37, 39, 41, 44], up: true },
  { nome: "@cozinhapratica", nicho: "Cozinha", seguidores: "480 mil", videos30d: "15", produtos: "9", gmv: "R$ 87 mil", eficiencia: 48, spark: [42, 40, 41, 38, 36, 35, 33], up: false },
]

export type Loja = {
  nome: string
  categoria: string
  produtos: string
  criadores: string
  gmv30d: string
  crescimento: string
  up: boolean
  spark: number[]
}

export const LOJAS: Loja[] = [
  { nome: "Beleza Glow Store", categoria: "Beleza", produtos: "214", criadores: "1.842", gmv30d: "R$ 2,1M", crescimento: "+34%", up: true, spark: [40, 45, 51, 58, 67, 78, 90] },
  { nome: "TechMax Brasil", categoria: "Eletrônicos", produtos: "156", criadores: "987", gmv30d: "R$ 1,7M", crescimento: "+52%", up: true, spark: [28, 34, 41, 50, 62, 75, 92] },
  { nome: "Top Elétrico BR", categoria: "Eletrônicos", produtos: "98", criadores: "743", gmv30d: "R$ 1,3M", crescimento: "+28%", up: true, spark: [38, 42, 47, 53, 60, 66, 74] },
  { nome: "Moda Bella Oficial", categoria: "Moda feminina", produtos: "387", criadores: "1.204", gmv30d: "R$ 940 mil", crescimento: "+11%", up: true, spark: [44, 46, 45, 49, 52, 55, 58] },
  { nome: "Casa & Cia Decor", categoria: "Casa & decoração", produtos: "142", criadores: "512", gmv30d: "R$ 720 mil", crescimento: "+19%", up: true, spark: [32, 35, 38, 41, 46, 51, 56] },
  { nome: "Duda Cosméticos", categoria: "Beleza", produtos: "89", criadores: "634", gmv30d: "R$ 580 mil", crescimento: "+7%", up: true, spark: [40, 41, 43, 42, 45, 47, 49] },
  { nome: "Fit Store BR", categoria: "Fitness", produtos: "76", criadores: "298", gmv30d: "R$ 340 mil", crescimento: "-4%", up: false, spark: [48, 47, 45, 44, 42, 41, 40] },
  { nome: "Mega Imports", categoria: "Acessórios", produtos: "203", criadores: "187", gmv30d: "R$ 210 mil", crescimento: "-16%", up: false, spark: [55, 51, 48, 44, 40, 37, 34] },
]
