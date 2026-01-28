'use client';

import { useEffect, useRef } from 'react';
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
  user: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
}

export default function FeedMap({ posts }: { posts: MapPost[] }) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const isInitialized = useRef(false);

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
      const marker = L.marker([post.latitude, post.longitude]).addTo(mapInstance.current!);
      
      const popupContent = `
        <div class="space-y-2">
          <div class="flex items-center gap-2">
            <div class="w-10 h-10 rounded-full overflow-hidden bg-gray-800 border border-gray-700 flex items-center justify-center text-sm font-bold text-gray-300">
              ${post.user.avatarUrl 
                ? `<img src="${post.user.avatarUrl}" alt="${post.user.username}" class="w-full h-full object-cover" />`
                : post.user.username[0].toUpperCase()
              }
            </div>
            <div>
              <p class="text-sm font-bold text-white">${post.user.displayName || post.user.username}</p>
              <p class="text-xs text-gray-400">@${post.user.username}</p>
              <p class="text-[10px] text-gray-500">${new Date(post.postedAt).toLocaleString()}</p>
            </div>
          </div>
          <div class="rounded-lg overflow-hidden border border-gray-700">
            <img src="${post.imageUrl}" alt="${post.caption}" class="w-full h-36 object-cover" />
          </div>
          ${post.locationName ? `<p class="text-xs font-semibold text-green-300">📍 ${post.locationName}</p>` : ''}
          <p class="text-xs text-white whitespace-pre-wrap leading-snug line-clamp-3">${post.caption}</p>
          ${post.questId ? `<p class="text-[11px] text-purple-300 font-semibold">✨ クエスト投稿</p>` : ''}
        </div>
      `;
      
      marker.bindPopup(popupContent, { maxWidth: 260, minWidth: 220 });
    });
  }, [posts]);

  return (
    <div className="h-[70vh] rounded-xl overflow-hidden border border-gray-700">
      <div ref={mapContainer} className="h-full w-full" />
    </div>
  );
}
