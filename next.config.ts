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
  // 静的アセットのキャッシュ（ファビコンなど）
  async headers() {
    return [
      {
        source: '/favicon.ico',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable' // 1年キャッシュ
          }
        ]
      },
      {
        source: '/manifest.json',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=604800' // 1週間キャッシュ
          }
        ]
      }
    ];
  }
};

export default nextConfig;

