import React, { useImperativeHandle, useRef, useState } from 'react';

type AvatarEditorHandle = {
  getCroppedBlob: () => Promise<Blob | null>;
  reset: () => void;
};

const AvatarEditor = React.forwardRef<AvatarEditorHandle, { preview: string; fallbackInitial: string; containerSize?: number }>(
  ({ preview, fallbackInitial, containerSize = 200 }, ref) => {
    const imgRef = useRef<HTMLImageElement | null>(null);
    const naturalRef = useRef<{ w: number; h: number }>({ w: 0, h: 0 });
    const baseZoomRef = useRef<number>(1);
    const [scale, setScale] = useState(1);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const draggingRef = useRef(false);
    const lastRef = useRef<{ x: number; y: number } | null>(null);
    const touchState = useRef<any>(null);

    useImperativeHandle(ref, () => ({
      async getCroppedBlob() {
        const img = imgRef.current;
        if (!img || !naturalRef.current.w) return null;

        const outputSize = 512;
        const canvas = document.createElement('canvas');
        canvas.width = outputSize;
        canvas.height = outputSize;
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;

        const nw = naturalRef.current.w;
        const nh = naturalRef.current.h;
        const displayScale = baseZoomRef.current * scale;
        const displayW = nw * displayScale;
        const displayH = nh * displayScale;

        const imageDisplayLeft = (containerSize - displayW) / 2 + offset.x;
        const imageDisplayTop = (containerSize - displayH) / 2 + offset.y;

        // source rect in image pixels corresponding to viewport
        const srcX = Math.max(0, (-imageDisplayLeft) / displayW * nw);
        const srcY = Math.max(0, (-imageDisplayTop) / displayH * nh);
        const srcSize = Math.min(nw, nh, (containerSize / displayW) * nw, (containerSize / displayH) * nh);

        // clip to circle
        ctx.save();
        ctx.beginPath();
        ctx.arc(outputSize / 2, outputSize / 2, outputSize / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();

        ctx.drawImage(img, srcX, srcY, srcSize, srcSize, 0, 0, outputSize, outputSize);
        ctx.restore();

        return await new Promise<Blob | null>((resolve) => {
          canvas.toBlob((b) => {
            resolve(b);
          }, 'image/png');
        });
      },
      reset() {
        setScale(1);
        setOffset({ x: 0, y: 0 });
      }
    }));

    const onImgLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
      const img = e.currentTarget;
      naturalRef.current = { w: img.naturalWidth, h: img.naturalHeight };
      // base zoom so the image covers the viewport
      baseZoomRef.current = Math.max(containerSize / img.naturalWidth, containerSize / img.naturalHeight);
      setScale(1);
      setOffset({ x: 0, y: 0 });
    };

    // Pointer drag handlers
    const onPointerDown = (e: React.PointerEvent) => {
      (e.target as Element).setPointerCapture(e.pointerId);
      draggingRef.current = true;
      lastRef.current = { x: e.clientX, y: e.clientY };
    };
    const onPointerMove = (e: React.PointerEvent) => {
      if (!draggingRef.current || !lastRef.current) return;
      const dx = e.clientX - lastRef.current.x;
      const dy = e.clientY - lastRef.current.y;
      lastRef.current = { x: e.clientX, y: e.clientY };
      setOffset((s) => ({ x: s.x + dx, y: s.y + dy }));
    };
    const onPointerUp = (e: React.PointerEvent) => {
      try {
        (e.target as Element).releasePointerCapture(e.pointerId);
      } catch {}
      draggingRef.current = false;
      lastRef.current = null;
    };

    // Touch pinch handlers
    const onTouchStart = (e: React.TouchEvent) => {
      if (e.touches.length === 2) {
        const [a, b] = [e.touches[0], e.touches[1]];
        const dx = b.clientX - a.clientX;
        const dy = b.clientY - a.clientY;
        touchState.current = { dist: Math.hypot(dx, dy), scale0: scale, center: { x: (a.clientX + b.clientX) / 2, y: (a.clientY + b.clientY) / 2 } };
      }
    };
    const onTouchMove = (e: React.TouchEvent) => {
      if (e.touches.length === 2 && touchState.current) {
        const [a, b] = [e.touches[0], e.touches[1]];
        const dx = b.clientX - a.clientX;
        const dy = b.clientY - a.clientY;
        const dist = Math.hypot(dx, dy);
        const ratio = dist / touchState.current.dist;
        const newScale = Math.max(0.5, Math.min(4, touchState.current.scale0 * ratio));
        setScale(newScale);
      }
    };

    return (
      <div>
        <div
          style={{ width: containerSize, height: containerSize }}
          className="relative rounded-full overflow-hidden bg-gray-800 mx-auto"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
        >
          {preview ? (
            <img
              ref={imgRef}
              src={preview}
              alt="avatar-edit"
              onLoad={onImgLoad}
              draggable={false}
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px)) scale(${baseZoomRef.current * scale})`,
                transformOrigin: 'center center',
                userSelect: 'none',
                touchAction: 'none',
                willChange: 'transform'
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-4xl text-gray-400">{fallbackInitial}</div>
          )}
        </div>

        <div className="mt-2 flex items-center space-x-2">
          <input
            type="range"
            min={0.5}
            max={4}
            step={0.01}
            value={scale}
            onChange={(e) => setScale(Number(e.target.value))}
            className="w-full"
          />
          <button
            type="button"
            onClick={() => {
              setScale(1);
              setOffset({ x: 0, y: 0 });
            }}
            className="px-3 py-1 bg-gray-700 text-white rounded"
          >
            リセット
          </button>
        </div>
      </div>
    );
  }
);

AvatarEditor.displayName = 'AvatarEditor';

export default AvatarEditor;
