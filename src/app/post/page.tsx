'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import QuestOverlayNew from '../components/QuestOverlayNew';

interface Quest {
  id: number;
  title: string;
}

interface ShotTokens {
  remaining: number;
  total: number;
}

export default function NewPostPage() {
  const router = useRouter();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [imageDataUrl, setImageDataUrl] = useState('');
  const [lastImageDataUrl, setLastImageDataUrl] = useState('');
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTagInput, setCustomTagInput] = useState('');
  const [visibilityScope, setVisibilityScope] = useState<'PUBLIC' | 'FRIENDS'>('PUBLIC');
  const [visibilityDuration, setVisibilityDuration] = useState<number | 'unlimited'>(1440);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [locationName, setLocationName] = useState('');
  const [locating, setLocating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showTagModal, setShowTagModal] = useState(false);
  const [isSwiping, setIsSwiping] = useState(false);
  const [swipeStartY, setSwipeStartY] = useState(0);
  const [swipeProgress, setSwipeProgress] = useState(0);
  const [isSending, setIsSending] = useState(false);
  const [sendingProgress, setSendingProgress] = useState(0);
  const [showPlane, setShowPlane] = useState(false);
  const submitDoneRef = useRef(false);
  const submitAbortRef = useRef<AbortController | null>(null);
  
  // カメラ関連
  const [isPhotoConfirmed, setIsPhotoConfirmed] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // クエスト関連
  const [isQuestMode, setIsQuestMode] = useState(false);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [selectedQuestId, setSelectedQuestId] = useState<string | null>(null);
  const [showQuestSelector, setShowQuestSelector] = useState(false);

  // ショットトークン
  const [tokens, setTokens] = useState<ShotTokens | null>(null);
  const [isLimitReached, setIsLimitReached] = useState(false);
  const [limitInfo, setLimitInfo] = useState<{ limit: number; resetAt?: string } | null>(null);

  const redirectToLimit = useCallback((limit?: number, resetAt?: string) => {
    const limitValue = limit ?? 5;
    const resetAtParam = resetAt ? encodeURIComponent(resetAt) : '';
    router.replace(`/post/limit?limit=${limitValue}&resetAt=${resetAtParam}`);
  }, [router]);

  // クエスト取得
  useEffect(() => {
    fetch('/api/quests/today')
      .then(res => res.json())
      .then(data => {
        if (data.quests) setQuests(data.quests);
      })
      .catch(err => console.error('クエスト取得エラー:', err));
  }, []);

  // ショットトークン取得と上限チェック
  useEffect(() => {
    fetch('/api/posts/shot-tokens')
      .then(res => res.json())
      .then(data => {
        if (data.remaining !== undefined) {
          const limit = data.limit ?? 5;
          setTokens({ remaining: data.remaining, total: limit });
          setLimitInfo({ limit, resetAt: data.resetAt });
          setIsLimitReached(data.remaining === 0);

          // 上限に達している場合は写真撮影画面に入れない
          if (data.remaining === 0) {
            redirectToLimit(limit, data.resetAt);
          }
        }
      })
      .catch(err => console.error('トークン取得エラー:', err));
  }, [redirectToLimit]);

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

  const stopStream = useCallback(() => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  }, []);

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
  }, [facingMode, isPhotoConfirmed, stopStream]);

  const handleCapture = useCallback(() => {
    if (isLimitReached) {
      redirectToLimit(limitInfo?.limit, limitInfo?.resetAt);
      return;
    }
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], 'photo.jpg', { type: 'image/jpeg' });
        setImageFile(file);
        setImagePreview(dataUrl);
        setImageDataUrl(dataUrl);
        setLastImageDataUrl('');
        setIsPhotoConfirmed(true);
        stopStream();
      }
    }, 'image/jpeg', 0.95);
  }, [isLimitReached, limitInfo, redirectToLimit, stopStream]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isLimitReached) {
      redirectToLimit(limitInfo?.limit, limitInfo?.resetAt);
      return;
    }
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      if (result) {
        setImagePreview(result);
        setImageDataUrl(result);
        setLastImageDataUrl('');
      }
    };
    reader.readAsDataURL(file);
    setIsPhotoConfirmed(true);
  };

  const handleAddCustomTag = () => {
    const trimmed = customTagInput.trim();
    if (trimmed && !selectedTags.includes(trimmed)) {
      setSelectedTags([...selectedTags, trimmed]);
      setCustomTagInput('');
      setShowTagModal(false);
    }
  };

  const handleRemoveTag = (tag: string) => {
    setSelectedTags(selectedTags.filter(t => t !== tag));
  };

  const handleRetakePhoto = () => {
    if (imageDataUrl) {
      setLastImageDataUrl(imageDataUrl);
    }
    setImageFile(null);
    setImagePreview('');
    setImageDataUrl('');
    setIsPhotoConfirmed(false);
  };

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

  const submitPost = async () => {
    if (!imageFile || isSending) return;
    if (isLimitReached) {
      redirectToLimit(limitInfo?.limit, limitInfo?.resetAt);
      return;
    }

    const limitRes = await fetch('/api/posts/shot-tokens');
    if (limitRes.ok) {
      const limitData = await limitRes.json();
      if (limitData?.remaining !== undefined) {
        const limit = limitData.limit ?? 5;
        setTokens({ remaining: limitData.remaining, total: limit });
        setLimitInfo({ limit, resetAt: limitData.resetAt });
        if (limitData.remaining === 0) {
          setIsLimitReached(true);
          redirectToLimit(limit, limitData.resetAt);
          return;
        }
      }
    }

    submitDoneRef.current = false;
    setIsSending(true);
    setSendingProgress(0);
    setShowPlane(false);
    setLoading(true);
    const controller = new AbortController();
    submitAbortRef.current = controller;
    try {
      const uploadData = new FormData();
      uploadData.append('image', imageFile);
      const uploadRes = await fetch('/api/upload/post', {
        method: 'POST',
        body: uploadData,
        signal: controller.signal
      });
      if (!uploadRes.ok) throw new Error('画像アップロード失敗');
      const uploadJson = await uploadRes.json();

      const postData: any = {
        imageUrl: uploadJson.imageUrl,
        title: title || undefined,
        caption,
        tags: selectedTags.join(','),
        visibilityScope,
        visibilityDuration: visibilityDuration === 'unlimited' ? null : visibilityDuration
      };

      if (latitude !== null && longitude !== null) {
        postData.latitude = latitude;
        postData.longitude = longitude;
        if (locationName) postData.locationName = locationName;
      }

      if (isQuestMode && selectedQuestId) {
        postData.questId = selectedQuestId;
      }

      console.log('投稿データ:', postData);
      console.log('isQuestMode:', isQuestMode, 'selectedQuestId:', selectedQuestId);

      const res = await fetch('/api/posts/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postData),
        signal: controller.signal
      });

      const responseData = await res.json();
      console.log('API レスポンス:', responseData, '状態:', res.status);

      if (!res.ok) throw new Error(responseData.error || '投稿作成失敗');

      submitDoneRef.current = true;
      setSendingProgress(100);
      setShowPlane(true);
      setTimeout(() => {
        router.push('/feed');
      }, 900);
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        // 中止時は何もしない
      } else {
        console.error(err);
        alert('投稿に失敗しました');
      }
      setIsSending(false);
      setSendingProgress(0);
      setShowPlane(false);
    } finally {
      setLoading(false);
      submitAbortRef.current = null;
    }
  };

  const handleCancelSending = () => {
    submitAbortRef.current?.abort();
    submitAbortRef.current = null;
    submitDoneRef.current = false;
    setIsSwiping(false);
    setSwipeProgress(0);
    setIsSending(false);
    setSendingProgress(0);
    setShowPlane(false);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitPost();
  };

  useEffect(() => {
    if (!isSending) return;
    const interval = window.setInterval(() => {
      setSendingProgress((prev) => {
        const cap = submitDoneRef.current ? 100 : 90;
        if (prev >= cap) return prev;
        return Math.min(prev + 6, cap);
      });
    }, 120);

    return () => window.clearInterval(interval);
  }, [isSending]);

  const dataUrlToFile = (dataUrl: string, filename: string) => {
    const arr = dataUrl.split(',');
    if (arr.length < 2) return null;
    const mimeMatch = arr[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  };

  const hasEdits = Boolean(
    imageDataUrl ||
      title ||
      caption ||
      selectedTags.length ||
      visibilityScope !== 'PUBLIC' ||
      visibilityDuration !== 1440 ||
      latitude !== null ||
      longitude !== null ||
      locationName ||
      isQuestMode ||
      selectedQuestId
  );

  const confirmLeave = () => {
    if (!hasEdits) return true;
    return window.confirm('編集中の内容は破棄されます。よろしいですか？');
  };

  const handleCancelFromCamera = () => {
    if (!confirmLeave()) return;
    if (lastImageDataUrl) {
      setImageDataUrl(lastImageDataUrl);
      setImagePreview(lastImageDataUrl);
      const file = dataUrlToFile(lastImageDataUrl, 'photo.jpg');
      if (file) setImageFile(file);
      setIsPhotoConfirmed(true);
      stopStream();
      return;
    }
    router.back();
  };

  const handleCancelFromEdit = () => {
    if (!confirmLeave()) return;
    router.back();
  };

  const handleSwipeStart = (clientY: number) => {
    if (isSending) return;
    setIsSwiping(true);
    setSwipeStartY(clientY);
    setSwipeProgress(0);
  };

  const handleSwipeMove = (clientY: number) => {
    if (!isSwiping) return;
    const delta = swipeStartY - clientY;
    const maxDistance = 240;
    const progress = Math.max(0, Math.min(delta / maxDistance, 1));
    setSwipeProgress(progress);
  };

  const handleSwipeEnd = () => {
    if (!isSwiping) return;
    setIsSwiping(false);
    if (swipeProgress >= 1) {
      submitPost();
    } else {
      setSwipeProgress(0);
    }
  };

  const hideNonPostUi = isSwiping || swipeProgress > 0;

  return (
    <div className="min-h-screen bg-black">
      {!isPhotoConfirmed ? (
        <div className="relative w-full h-[100vh] bg-black overflow-hidden">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="absolute inset-0 w-full h-full object-cover"
          />

          <canvas ref={canvasRef} className="hidden" />

          {/* オーバーレイ */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute left-4 top-4" style={{ paddingTop: 'var(--safe-area-top)' }}>
              <button
                type="button"
                onClick={handleCancelFromCamera}
                className="pointer-events-auto"
                aria-label="キャンセル"
              >
                <img src="/icon/cancel.svg" alt="キャンセル" className="w-6 h-6" />
              </button>
            </div>
            <div className="absolute right-4 top-4" style={{ paddingTop: 'var(--safe-area-top)' }}>
              <div className="pointer-events-auto bg-[#4b5563] rounded-md px-1 py-1">
                <div className="flex gap-1">
                  {Array.from({ length: 5 }).map((_, i) => {
                    const remaining = tokens?.remaining ?? 0;
                    return (
                      <div
                        key={i}
                        className={`h-3 w-6 rounded-sm ${i < remaining ? 'bg-[#22c55e]' : 'bg-[#0B0C0F]'}`}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* モード切替 */}
          <div className="absolute bottom-[140px] left-0 right-0 flex flex-col items-center gap-2 pointer-events-auto">
            <button
              type="button"
              onClick={() => {
                setIsQuestMode(prev => {
                  const next = !prev;
                  if (!next) {
                    setSelectedQuestId(null);
                    setShowQuestSelector(false);
                  } else {
                    setShowQuestSelector(true);
                  }
                  return next;
                });
              }}
              className="flex items-center justify-center"
              aria-label="投稿モード切替"
            >
              <img
                src={isQuestMode ? '/icon/button_quest_post.svg' : '/icon/button_normal_post.svg'}
                alt={isQuestMode ? 'クエスト投稿' : '通常投稿'}
                className="h-9"
              />
            </button>
            <div className="text-white text-sm font-semibold">
              {isQuestMode ? (quests.find(q => q.id.toString() === selectedQuestId)?.title || '') : '松本を撮ろう！'}
            </div>
          </div>

          {/* 下部ボタン */}
          <div className="absolute bottom-8 left-0 right-0 flex items-center justify-center pointer-events-auto">
            <div className="relative flex items-center justify-center w-full">
              <button
                type="button"
                onClick={() => setFacingMode(prev => (prev === 'environment' ? 'user' : 'environment'))}
                className="absolute left-10"
                aria-label="カメラ反転"
              >
                <img src="/icon/Refresh cw.svg" alt="反転" className="w-7 h-7" />
              </button>
              <button
                type="button"
                onClick={handleCapture}
                className="w-20 h-20 rounded-full border-4 border-white bg-white/10"
                aria-label="撮影"
              />
            </div>
          </div>

          {/* フォールバック */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleImageChange}
            className="hidden"
          />
        </div>
      ) : (
        <div className="min-h-screen bg-gradient-to-b from-[#0b0c0f] to-[#0f0f0f] px-4 pb-10" style={{ paddingTop: 'calc(1.5rem + var(--safe-area-top))' }}>
          {/* 左上の×ボタン */}
          <div className={`absolute left-4 top-4 z-10 transition-opacity duration-200 ${hideNonPostUi ? 'opacity-0 pointer-events-none' : 'opacity-100'}`} style={{ paddingTop: 'var(--safe-area-top)' }}>
            <button
              type="button"
              onClick={handleCancelFromEdit}
              className="pointer-events-auto"
              aria-label="キャンセル"
            >
              <img src="/icon/cancel.svg" alt="キャンセル" className="w-6 h-6" />
            </button>
          </div>

          <div className={`text-center text-white text-[28px] font-bold mb-4 transition-opacity duration-200 ${hideNonPostUi ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
            上にスワイプして投稿
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl mx-auto">
            <div
              className="bg-[#14161a] border-4 border-white rounded-2xl overflow-hidden"
              style={{
                transform: isSending ? 'translateY(-150vh)' : `translateY(${-swipeProgress * 624}px)`,
                touchAction: 'none',
                transition: isSwiping ? 'none' : isSending ? 'transform 0.9s ease-out' : 'transform 200ms ease',
                opacity: isSending && showPlane ? 0 : 1
              }}
              onTouchStart={(e) => handleSwipeStart(e.touches[0].clientY)}
              onTouchMove={(e) => {
                handleSwipeMove(e.touches[0].clientY);
              }}
              onTouchEnd={handleSwipeEnd}
              onMouseDown={(e) => handleSwipeStart(e.clientY)}
              onMouseMove={(e) => {
                if (!isSwiping) return;
                handleSwipeMove(e.clientY);
              }}
              onMouseUp={handleSwipeEnd}
              onMouseLeave={handleSwipeEnd}
            >
              <div className="relative">
                <img 
                  src={imagePreview} 
                  alt="preview" 
                  className="w-full h-[320px] object-cover cursor-pointer" 
                  onClick={() => setShowImageModal(true)}
                />
                <div className="absolute inset-0 flex items-center justify-center text-white/50 text-2xl font-bold pointer-events-none">
                  タップして拡大
                </div>
                <button
                  type="button"
                  onClick={handleRetakePhoto}
                  className="absolute bottom-4 left-1/2 -translate-x-1/2"
                  aria-label="再撮影"
                >
                  <img src="/icon/re_shot_button.svg" alt="再撮影" className="h-20" />
                </button>
              </div>

              <div className="p-4 border-t-4 border-white">
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className={`w-full bg-transparent text-white font-bold mb-2 outline-none ${title ? '' : 'underline decoration-white'}`}
                  style={{ fontSize: '16px' }}
                  placeholder="タイトル"
                  maxLength={60}
                />
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  className={`w-full bg-transparent text-white outline-none ${caption ? '' : 'underline decoration-white'}`}
                  style={{ fontSize: '16px' }}
                  rows={2}
                  placeholder="みんなに内容を教えよう"
                  maxLength={300}
                />

                <div className="flex flex-wrap gap-2 mt-3">
                  {selectedTags.map((tag) => (
                    <div
                      key={tag}
                      className="flex items-center gap-1 px-2 py-1 rounded-full border-2 border-[#4144ff] bg-[#87b4ff]"
                    >
                      <img src="/icon/hashtag.svg" alt="#" className="w-3 h-3" />
                      <span className="text-[#4144ff] text-xs font-semibold">{tag}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-1"
                        aria-label="タグ削除"
                      >
                        <img src="/icon/cancel.svg" alt="削除" className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setShowTagModal(true)}
                    className="flex items-center gap-1 px-2 py-1 rounded-full border-2 border-[#27ff7a] bg-[#0e3f10]"
                  >
                    <img src="/icon/cancel.svg" alt="追加" className="w-3 h-3 rotate-45" />
                    <span className="text-[#27ff7a] text-xs font-semibold">タグを追加</span>
                  </button>
                </div>

                <div className="flex gap-2 mt-3 opacity-60">
                  <div className="flex items-center gap-1 px-3 py-1 rounded-full border-2 border-[#ff73c7] bg-[#ffcffc]">
                    <span className="text-white">❤</span>
                    <span className="text-[#ff73c7] text-xs font-semibold">0</span>
                  </div>
                  <div className="flex items-center gap-1 px-3 py-1 rounded-full border-2 border-[#868686] bg-white">
                    <img src="/icon/Message square.svg" alt="コメント" className="w-4 h-4" />
                    <span className="text-[#868686] text-xs font-semibold">0</span>
                  </div>
                </div>
              </div>
            </div>

            <div className={`mt-6 flex items-start justify-between gap-4 transition-opacity duration-200 ${hideNonPostUi ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
              {/* 左側：モード切替 */}
              <div className="flex flex-col gap-[18px] items-center w-[141px]">
                <button
                  type="button"
                  onClick={() => {
                    setIsQuestMode(prev => {
                      const next = !prev;
                      if (!next) {
                        setSelectedQuestId(null);
                      } else {
                        setShowQuestSelector(true);
                      }
                      return next;
                    });
                  }}
                  className="h-[32px] w-[128px]"
                >
                  <img 
                    src={isQuestMode ? "/icon/button_quest_post.svg" : "/icon/button_normal_post.svg"} 
                    alt={isQuestMode ? "クエスト投稿" : "通常投稿"} 
                    className="w-full h-full"
                  />
                </button>
                <p className="text-white text-[16px] font-bold text-center whitespace-pre-wrap leading-normal">
                  {isQuestMode ? (quests.find(q => q.id.toString() === selectedQuestId)?.title || 'クエストを選択') : '松本に関係\nあるんだよね？'}
                </p>
              </div>

              {/* 右側：設定 */}
              <div className="flex flex-col gap-[7px] w-[200px]">
                {/* 友達のみ */}
                <div className="flex items-center gap-[19px]">
                  <span className="text-white text-[20px] font-bold">{visibilityScope === 'FRIENDS' ? '友達のみ' : '世界中　'}</span>
                  <button
                    type="button"
                    onClick={() => setVisibilityScope(prev => (prev === 'FRIENDS' ? 'PUBLIC' : 'FRIENDS'))}
                    className="relative w-[56.833px] h-[31px] flex-shrink-0"
                  >
                    <img 
                      src={visibilityScope === 'FRIENDS' ? "/icon/toggle_under_water.svg" : "/icon/toggle_under_blue.svg"} 
                      alt="トグル背景" 
                      className="absolute inset-0 w-full h-full"
                    />
                    <img 
                      src="/icon/toggle_value.svg" 
                      alt="トグル" 
                      className="absolute top-1/2 -translate-y-1/2 h-[24px] transition-all duration-200"
                      style={{ left: visibilityScope === 'FRIENDS' ? '28px' : '4px' }}
                    />
                  </button>
                </div>

                {/* 位置情報 */}
                <div className="flex items-center gap-[19px]">
                  <span className="text-white text-[20px] font-bold">位置情報</span>
                  <button
                    type="button"
                    onClick={handleUseCurrentLocation}
                    disabled={locating}
                    className="relative w-[56.833px] h-[31px] flex-shrink-0 cursor-pointer"
                  >
                    <img 
                      src={(latitude !== null && longitude !== null) ? "/icon/toggle_under_greensvg.svg" : "/icon/toggle_under_gray.svg"} 
                      alt="トグル背景" 
                      className="absolute inset-0 w-full h-full pointer-events-none"
                    />
                    <img 
                      src="/icon/toggle_value.svg" 
                      alt="トグル" 
                      className="absolute top-1/2 -translate-y-1/2 h-[24px] transition-all duration-200 pointer-events-none"
                      style={{ left: (latitude !== null && longitude !== null) ? '28px' : '4px' }}
                    />
                  </button>
                </div>

                {/* 公開時間 */}
                <div className="flex items-center gap-[19px]">
                  <span className="text-white text-[20px] font-bold">公開時間</span>
                  <div className="border-4 border-white rounded-[12px] h-[31px] w-[101px] flex items-center justify-center px-1">
                    <select
                      value={visibilityDuration === 'unlimited' ? 'unlimited' : visibilityDuration}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === 'unlimited') setVisibilityDuration('unlimited');
                        else setVisibilityDuration(Number(val));
                      }}
                      className="bg-transparent text-white text-[20px] font-bold border-0 outline-none w-full appearance-none text-center"
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'right center',
                        backgroundSize: '20px',
                        paddingRight: '24px'
                      }}
                    >
                      <option value={5}>5分</option>
                      <option value={10}>10分</option>
                      <option value={30}>30分</option>
                      <option value={60}>1時間</option>
                      <option value={120}>2時間</option>
                      <option value={180}>3時間</option>
                      <option value={360}>6時間</option>
                      <option value={720}>12時間</option>
                      <option value={1440}>24時間</option>
                      <option value={2880}>48時間</option>
                      <option value={10080}>7日間</option>
                      <option value="unlimited">無制限</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </form>

          {!isSending && (isSwiping || swipeProgress > 0) && (
            <div className="fixed left-0 right-0 bottom-0 z-30 px-6" style={{ paddingBottom: 'calc(1rem + var(--safe-area-bottom))' }}>
              <div className="h-4 w-full bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#27ff7a]"
                  style={{ width: `${Math.min(100, Math.round(swipeProgress * 100))}%` }}
                />
              </div>
            </div>
          )}

        </div>
      )}

      <QuestOverlayNew
        open={showQuestSelector}
        quests={quests}
        selectedQuestId={selectedQuestId}
        onSelect={(questId) => setSelectedQuestId(questId)}
        onClose={() => setShowQuestSelector(false)}
        onFallbackToNormal={() => {
          setIsQuestMode(false);
          setSelectedQuestId(null);
          setShowQuestSelector(false);
        }}
      />

      {/* 画像拡大モーダル */}
      {showImageModal && imagePreview && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={() => setShowImageModal(false)}
        >
          <div className="relative w-full h-full flex items-center justify-center p-4">
            <img 
              src={imagePreview} 
              alt="拡大表示" 
              className="max-w-full max-h-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              type="button"
              onClick={() => setShowImageModal(false)}
              className="absolute top-4 right-4"
              aria-label="閉じる"
            >
              <img src="/icon/cancel.svg" alt="閉じる" className="w-8 h-8" />
            </button>
          </div>
        </div>
      )}

      {/* タグ追加モーダル */}
      {showTagModal && (
        <div 
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
          onClick={() => {
            setShowTagModal(false);
            setCustomTagInput('');
          }}
        >
          <div 
            className="bg-[#0B0C0F] border-2 border-white rounded-2xl p-6 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white text-xl font-bold">タグを追加</h3>
              <button
                type="button"
                onClick={() => {
                  setShowTagModal(false);
                  setCustomTagInput('');
                }}
                className="text-gray-400 hover:text-white"
              >
                <img src="/icon/cancel.svg" alt="閉じる" className="w-6 h-6" />
              </button>
            </div>
            
            <input
              type="text"
              value={customTagInput}
              onChange={(e) => setCustomTagInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddCustomTag();
                }
              }}
              placeholder="タグ名を入力..."
              className="w-full px-4 py-3 bg-[#1f2937] border-2 border-gray-600 rounded-lg text-white placeholder-gray-400 outline-none focus:border-[#27ff7a] mb-4"
              autoFocus
            />
            
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowTagModal(false);
                  setCustomTagInput('');
                }}
                className="flex-1 px-4 py-3 bg-gray-600 hover:bg-gray-500 text-white rounded-lg font-semibold transition"
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={handleAddCustomTag}
                disabled={!customTagInput.trim()}
                className="flex-1 px-4 py-3 bg-[#27ff7a] hover:bg-[#22e06d] text-black rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                追加
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 送信中オーバーレイ */}
      {isSending && (
        <div className="fixed inset-0 z-[60] bg-black/90 flex flex-col items-center justify-center gap-6">
          <div className="text-white text-2xl font-bold">送信中....</div>
          <div className="w-[260px] h-3 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#27ff7a]"
              style={{ width: `${Math.round(sendingProgress)}%`, transition: 'width 120ms linear' }}
            />
          </div>
          <button
            type="button"
            onClick={handleCancelSending}
            className="px-6 py-2 rounded-full border-2 border-white text-white font-bold"
          >
            送信を中止
          </button>
          <div className="relative w-[140px] h-[80px] overflow-visible">
            <img
              src="/icon/Send.svg"
              alt="送信"
              className="w-10 h-10"
              style={{
                transform: showPlane ? 'translate(140px, -120px) rotate(-30deg)' : 'translate(0px, 0px) rotate(0deg)',
                transition: showPlane ? 'transform 900ms ease-out' : 'none'
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}