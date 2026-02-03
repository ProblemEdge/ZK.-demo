import { useState, useEffect, useRef, useCallback } from 'react';
import type { FacingMode } from '../_types';

/**
 * カメラ機能を管理するカスタムフック
 */
export const useCamera = (isPhotoConfirmed: boolean, isLimitReached: boolean) => {
  const [facingMode, setFacingMode] = useState<FacingMode>('environment');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const stopStream = useCallback(() => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('カメラアクセスエラー:', err);
    }
  };

  // カメラ起動
  useEffect(() => {
    if (isLimitReached) {
      stopStream();
      return;
    }
    if (!isPhotoConfirmed) {
      startCamera();
    } else {
      stopStream();
    }
    return () => {
      stopStream();
    };
  }, [facingMode, isPhotoConfirmed, stopStream, isLimitReached]);

  const toggleFacingMode = () => {
    setFacingMode(prev => (prev === 'environment' ? 'user' : 'environment'));
  };

  return {
    facingMode,
    videoRef,
    canvasRef,
    fileInputRef,
    toggleFacingMode,
    stopStream,
  };
};
