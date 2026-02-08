import type { Quest, ShotTokens } from '../_types';

interface CameraViewProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  fileInputRef: React.RefObject<HTMLInputElement>;
  tokens: ShotTokens | null;
  quests: Quest[];
  isQuestMode: boolean;
  selectedQuestId: string | null;
  facingMode?: 'user' | 'environment';
  onCapture: () => void;
  onToggleFacingMode: () => void;
  onCancel: () => void;
  onToggleQuestMode: () => void;
  onOpenQuestSelector: () => void;
}

/**
 * カメラ撮影ビュー
 */
export default function CameraView({
  videoRef,
  canvasRef,
  fileInputRef,
  tokens,
  quests,
  isQuestMode,
  selectedQuestId,
  facingMode,
  onCapture,
  onToggleFacingMode,
  onCancel,
  onToggleQuestMode,
  onOpenQuestSelector,
}: CameraViewProps) {
  return (
    <div className='relative w-full h-[100vh] bg-black overflow-hidden'>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className='absolute inset-0 w-full h-full object-contain object-center'
        style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : undefined }}
      />

      <canvas ref={canvasRef} className='hidden' />

      {/* オーバーレイ */}
      <div className='absolute inset-0 pointer-events-none'>
        <div className='absolute left-4 top-4' style={{ paddingTop: 'var(--safe-area-top)' }}>
          <button
            type='button'
            onClick={onCancel}
            className='pointer-events-auto'
            aria-label='キャンセル'
          >
            <img src='/icon/cancel.svg' alt='キャンセル' className='w-6 h-6' />
          </button>
        </div>
        <div className='absolute right-4 top-4' style={{ paddingTop: 'var(--safe-area-top)' }}>
          <div className='pointer-events-auto bg-[#4b5563] rounded-md px-1 py-1'>
            <div className='flex gap-1'>
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
      <div className='absolute bottom-[140px] left-0 right-0 flex flex-col items-center gap-2 pointer-events-auto'>
        <button
          type='button'
          onClick={() => {
            onToggleQuestMode();
            if (!isQuestMode) {
              onOpenQuestSelector();
            }
          }}
          className='flex items-center justify-center'
          aria-label='投稿モード切替'
        >
          <img
            src={isQuestMode ? '/icon/button_quest_post.svg' : '/icon/button_normal_post.svg'}
            alt={isQuestMode ? 'クエスト投稿' : '通常投稿'}
            className='h-9'
          />
        </button>
        <div className='text-white text-sm font-semibold'>
          {isQuestMode
            ? quests.find((q) => q.id.toString() === selectedQuestId)?.title || ''
            : '松本を撮ろう！'}
        </div>
      </div>

      {/* 下部ボタン */}
      <div className='absolute bottom-8 left-0 right-0 flex items-center justify-center pointer-events-auto'>
        <div className='relative flex items-center justify-center w-full'>
          <button
            type='button'
            onClick={onToggleFacingMode}
            className='absolute left-10'
            aria-label='カメラ反転'
          >
            <img src='/icon/Refresh cw.svg' alt='反転' className='w-7 h-7' />
          </button>
          <button
            type='button'
            onClick={onCapture}
            className='w-20 h-20 rounded-full border-4 border-white bg-white/10'
            aria-label='撮影'
          />
        </div>
      </div>

      {/* フォールバック */}
      <input
        ref={fileInputRef}
        type='file'
        accept='image/*'
        capture='environment'
        className='hidden'
      />
    </div>
  );
}
