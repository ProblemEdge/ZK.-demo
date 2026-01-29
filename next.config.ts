import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  devIndicators: false,
  turbopack: {
    root: process.cwd(),
  },
  // パフォーマンス最適化
  compress: true,
  poweredByHeader: false,
  // 画像の最適化
  images: {
    unoptimized: false,
    formats: ['image/webp', 'image/avif'],
  },
};

export default nextConfig;
