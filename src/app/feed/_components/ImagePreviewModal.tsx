interface ImagePreviewModalProps {
  imageUrl: string | null;
  onClose: () => void;
}

/**
 * 画像プレビューモーダルコンポーネント
 */
import ImageWithPlaceholder from '@/app/components/ImageWithPlaceholder';

export default function ImagePreviewModal({ imageUrl, onClose }: ImagePreviewModalProps) {
  if (!imageUrl) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4" 
      onClick={onClose}
    >
      <div className="max-w-full max-h-full w-full h-full flex items-center justify-center">
        <ImageWithPlaceholder src={imageUrl} alt="Preview" className="max-w-full max-h-full" />
      </div>
    </div>
  );
}
