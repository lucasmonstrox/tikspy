import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  // Landing 100% estática → export HTML/CSS/JS em `out/`, servido como
  // assets no Cloudflare (sem Worker SSR). Mais barato e simples.
  output: "export",
  transpilePackages: ["@workspace/ui"],
}

export default nextConfig
