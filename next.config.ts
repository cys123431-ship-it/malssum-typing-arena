import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Sites serves public assets directly; its runtime does not expose Next's
  // /_next/image optimizer route. Keep every game illustration on its original
  // static URL so fighters, enemies, and effects load in production.
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
