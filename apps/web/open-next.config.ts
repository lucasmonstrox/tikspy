// OpenNext → Cloudflare Workers (infra-alvo: Cloudflare).
// buildCommand força webpack: os chunks do Turbopack ainda não são suportados
// pelo runtime do OpenNext (ChunkLoadError [root-of-the-server]__*).
import { defineCloudflareConfig } from "@opennextjs/cloudflare"

export default {
  ...defineCloudflareConfig(),
  buildCommand: "bunx next build --webpack",
}
