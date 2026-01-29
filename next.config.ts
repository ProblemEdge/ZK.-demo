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
  productionBrowserSourceMaps: false,
  swcMinify: true,
  poweredByHeader: false,
  // 静的生成を有効化
  staticPageGenerationTimeout: 60,
  // 画像の最適化
  images: {
    unoptimized: false,
    formats: ['image/webp', 'image/avif'],
  },
};

export default nextConfig;
