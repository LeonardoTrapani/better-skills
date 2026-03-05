import "@better-skills/env/web";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typedRoutes: true,
  reactCompiler: true,
  async redirects() {
    return [
      {
        source: "/vault/skills/:id/resources/:resourcePath*",
        destination: "/vault/skills/:id?resource=:resourcePath*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
