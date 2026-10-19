import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ARCHIVO 2026: exportación estática (HTML puro, sin servidor ni Firestore).
  // Se publica como subcarpeta del sitio principal en /archivo/2026,
  // por eso basePath + trailingSlash (URLs tipo /archivo/2026/invitados/).
  output: 'export',
  basePath: '/archivo/2026',
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
