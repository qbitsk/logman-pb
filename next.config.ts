import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["exceljs"],
  allowedDevOrigins: ['192.168.10.173'],
};

export default nextConfig;
