import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['192.168.10.174'],
  // Only small static logos go through next/image; serving them as-is avoids
  // needing a platform-specific `sharp` binary on the self-hosted server.
  images: { unoptimized: true },
};

export default nextConfig;
