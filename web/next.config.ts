import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Required for the multi-stage Docker build (web/Dockerfile stage 3).
  // Produces a self-contained .next/standalone directory with a minimal
  // Node server (server.js) and only the node_modules it actually needs.
  output: "standalone",

  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
      },
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
