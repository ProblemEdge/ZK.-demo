'use client';

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Leaflet のデフォルトアイコンをCDNに差し替え（Next.jsでのパス問題を回避）
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
});

export interface MapPost {
  id: string;
  imageUrl: string;
  caption: string;
  latitude: number;
  longitude: number;
  locationName?: string | null;
  postedAt: string;
  questId?: string | null;
  _count?: {
    likes: number;
  };
  user: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
}

// カスタムマーカー作成関数
function createCustomMarkerIcon(avatarUrl: string | null, isQuest: boolean) {
  const svgString = `
    <svg width="48" height="48" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" flood-opacity="0.4"/>
        </filter>
      </defs>
      <g filter="url(#shadow)">
        <circle cx="24" cy="18" r="16" fill="${isQuest ? '#a78bfa' : '#3b82f6'}" stroke="white" stroke-width="2"/>
        ${avatarUrl 
          ? `<image href="${avatarUrl}" x="8" y="2" width="32" height="32" clip-path="circle(16px at 16px 16px)"/>`
          : `<circle cx="24" cy="18" r="14" fill="#e5e7eb"/>`
        }
        ${isQuest ? '<text x="24" y="35" text-anchor="middle" font-size="14" font-weight="bold" fill="#a78bfa">✨</text>' : ''}
      </g>
    </svg>
  `;
  
  return L.icon({
    iconUrl: `data:image/svg+xml;base64,${Buffer.from(svgString).toString('base64')}`,
    iconSize: [48, 48],
    iconAnchor: [24, 24],
    popupAnchor: [0, -24],
    className: 'custom-marker'
  });
}

export default function FeedMap({ posts }: { posts: MapPost[] }) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const isInitialized = useRef(false);
  const [hoveredPostId, setHoveredPostId] = useState<string | null>(null);

  useEffect(() => {
    if (!mapContainer.current || isInitialized.current) return;

    const center = posts.length > 0
      ? ([posts[0].latitude, posts[0].longitude] as [number, number])
      : ([36.2374, 137.9709] as [number, number]); // 松本駅

    try {
      mapInstance.current = L.map(mapContainer.current, { 
        preferCanvas: true,
        maxBounds: L.latLngBounds(
          L.latLng(36.0667, 137.5833), // 南西コーナー（北緯36度04分、東経137度35分）
          L.latLng(36.4333, 138.1333)  // 北東コーナー（北緯36度26分、東経138度08分）
        ),
        maxBoundsViscosity: 1.0
      }).setView(center, 12);
      isInitialized.current = true;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
        minZoom: 10
      }).addTo(mapInstance.current);

      // CSS追加
      const style = document.createElement('style');
      style.textContent = `
        .custom-marker {
          transition: transform 0.2s ease-in-out;
        }
        .custom-marker:hover {
          transform: scale(1.2);
        }
        .leaflet-popup-content-wrapper {
          background: linear-gradient(135deg, #1f2937 0%, #0B0C0F 100%);
          border-radius: 12px;
          border: 1px solid #374151;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
        }
        .leaflet-popup-content {
          margin: 0;
          padding: 0;
        }
      `;
      document.head.appendChild(style);
    } catch (error) {
      console.error('Map initialization error:', error);
      isInitialized.current = false;
    }

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
        isInitialized.current = false;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapInstance.current || !isInitialized.current || posts.length === 0) return;

    // 既存のマーカーをクリア
    mapInstance.current.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        mapInstance.current?.removeLayer(layer);
      }
    });

    // 新しいマーカーを追加
    posts.forEach((post) => {
      const icon = createCustomMarkerIcon(post.user.avatarUrl, !!post.questId);
      const marker = L.marker([post.latitude, post.longitude], { icon }).addTo(mapInstance.current!);
      
      const formattedDate = new Date(post.postedAt).toLocaleDateString('ja-JP', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      const likeCount = post._count?.likes || 0;
      
      const popupContent = `
        <div class="w-72 bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg overflow-hidden">
          <!-- ユーザー情報ヘッダー -->
          <div class="flex items-center gap-3 p-4 pb-3 border-b border-gray-700">
            <div class="w-12 h-12 rounded-full overflow-hidden bg-gray-700 border-2 ${post.questId ? 'border-purple-400' : 'border-blue-400'} flex-shrink-0">
              ${post.user.avatarUrl 
                ? `<img src="${post.user.avatarUrl}" alt="${post.user.username}" class="w-full h-full object-cover" />`
                : `<div class="w-full h-full flex items-center justify-center font-bold text-lg text-gray-300">${post.user.username[0].toUpperCase()}</div>`
              }
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-bold text-white truncate">${post.user.displayName || post.user.username}</p>
              <p class="text-xs text-gray-400 truncate">@${post.user.username}</p>
              <p class="text-xs text-gray-500 mt-1">${formattedDate}</p>
            </div>
          </div>

          <!-- 画像 -->
          <div class="relative overflow-hidden bg-black">
            <img src="${post.imageUrl}" alt="${post.caption}" class="w-full h-48 object-cover hover:scale-105 transition-transform duration-200" />
            ${post.questId ? '<div class="absolute top-2 right-2 bg-purple-600 text-white text-xs font-bold px-2 py-1 rounded-full">✨ クエスト</div>' : ''}
          </div>

          <!-- 情報セクション -->
          <div class="p-4 space-y-3">
            <!-- キャプション -->
            <p class="text-sm text-gray-100 leading-relaxed line-clamp-3">${post.caption}</p>

            <!-- ロケーション -->
            ${post.locationName ? `
              <div class="flex items-center gap-2 text-xs text-green-400 font-semibold">
                <span class="text-lg">📍</span>
                <span>${post.locationName}</span>
              </div>
            ` : ''}

            <!-- いいね数 -->
            <div class="flex items-center gap-1 text-xs text-red-400 font-semibold pt-2 border-t border-gray-700">
              <span class="text-base">❤️</span>
              <span>${likeCount} ${likeCount === 1 ? 'like' : 'likes'}</span>
            </div>
          </div>

          <!-- 投稿ID (隠し) -->
          <div data-post-id="${post.id}" style="display:none;"></div>
        </div>
      `;
      
      marker.bindPopup(popupContent, { 
        maxWidth: 350, 
        minWidth: 300,
        className: 'custom-popup'
      });
    });
  }, [posts]);

  return (
    <div className="h-[70vh] rounded-xl overflow-hidden border border-gray-700 shadow-lg">
      <div ref={mapContainer} className="h-full w-full" />
    </div>
  );
}
