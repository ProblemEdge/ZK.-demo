interface ImagePreviewModalProps {
  imageUrl: string | null;
  onClose: () => void;
}

/**
 * 画像プレビューモーダルコンポーネント
 */
export default function ImagePreviewModal({ imageUrl, onClose }: ImagePreviewModalProps) {
  if (!imageUrl) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4" 
      onClick={onClose}
    >
      <img src={imageUrl} className="max-w-full max-h-full object-contain" alt="Preview" />
    </div>
  );
}
