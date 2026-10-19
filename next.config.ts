import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ARCHIVO 2026: exportación estática (HTML puro, sin servidor ni Firestore).
  output: 'export',
  images: { unoptimized: true },
};

export default nextConfig;
