import { useState } from 'react';

/**
 * 位置情報を管理するカスタムフック
 */
export const useLocation = () => {
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [locationName, setLocationName] = useState('');
  const [locating, setLocating] = useState(false);

  const handleUseCurrentLocation = () => {
    // すでに位置情報が設定されている場合はオフにする
    if (latitude !== null && longitude !== null) {
      setLatitude(null);
      setLongitude(null);
      setLocationName('');
      return;
    }

    // 位置情報を取得
    if (!navigator.geolocation) {
      alert('位置情報がサポートされていません');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude);
        setLongitude(position.coords.longitude);
        setLocating(false);
      },
      (error) => {
        console.error('位置情報取得エラー:', error);
        alert('位置情報の取得に失敗しました');
        setLocating(false);
      }
    );
  };

  return {
    latitude,
    longitude,
    locationName,
    locating,
    setLocationName,
    handleUseCurrentLocation,
  };
};
