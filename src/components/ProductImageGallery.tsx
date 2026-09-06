import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, ImageOff } from 'lucide-react';
import { ProductImage } from '../types';

interface ProductImageGalleryProps {
  images: ProductImage[];
  /** Product name, used for alt text. */
  name: string;
  /** Aspect ratio class for the stage when the image dims are unknown. */
  fallbackAspectClass?: string;
  className?: string;
}

/**
 * Accessible image carousel for a product's gallery.
 *
 * Shows one image at a time with prev/next arrows, a counter, live thumbnails
 * and keyboard navigation. Images flagged `fit: 'contain'` (product renders on
 * white/transparent) are shown fully inside a padded stage; `fit: 'cover'`
 * photos fill the frame.
 */
export const ProductImageGallery: React.FC<ProductImageGalleryProps> = ({
  images,
  name,
  fallbackAspectClass = 'aspect-[4/3]',
  className = '',
}) => {
  const safeImages = images.length > 0 ? images : [{ src: '', fit: 'contain' as const, alt: name }];
  const [index, setIndex] = useState(0);
  const [loaded, setLoaded] = useState<Record<number, boolean>>({});
  const [stageAspect, setStageAspect] = useState<number | undefined>(undefined);
  const stageRef = useRef<HTMLDivElement>(null);

  const count = safeImages.length;
  const current = safeImages[Math.min(index, count - 1)];
  const isRender = current.fit === 'contain';

  // Size the stage to the current image's natural ratio so nothing is cropped
  // or over-letterboxed. Clamp to a sensible range so very wide drawings and
  // very tall portraits don't blow up the layout. transition happens via CSS.
  useEffect(() => {
    const w = current.width;
    const h = current.height;
    if (w && h && h > 0) {
      const ratio = w / h;
      // Clamp ratio to [0.72, 2.4] (portrait => wide landscape).
      const clamped = Math.max(0.72, Math.min(2.4, ratio));
      setStageAspect(clamped);
    } else {
      setStageAspect(undefined);
    }
  }, [current.src, current.width, current.height]);

  const goTo = useCallback(
    (i: number) => {
      setIndex(((i % count) + count) % count);
    },
    [count],
  );

  const next = useCallback(() => goTo(index + 1), [goTo, index]);
  const prev = useCallback(() => goTo(index - 1), [goTo, index]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        next();
      }
    },
    [prev, next],
  );

  // Reset to first image when the gallery identity changes (e.g. navigating
  // between products).
  useEffect(() => {
    setIndex(0);
    setLoaded({});
  }, [safeImages.map((i) => i.src).join('|')]);

  const showArrows = count > 1;

  const markLoaded = (i: number) => setLoaded((l) => ({ ...l, [i]: true }));

  return (
    <div
      className={`group/gallery relative select-none ${className}`}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="region"
      aria-roledescription="carousel"
      aria-label={`${name} image gallery`}
    >
      {/* Stage — white backdrop so white-based product renders blend in.
          (cover photos fill the frame, so the backdrop is behind them.) */}
      <div
        ref={stageRef}
        className={`relative overflow-hidden rounded-2xl gradient-border-card card-lift ${stageAspect ? '' : fallbackAspectClass}`}
        style={stageAspect ? { aspectRatio: stageAspect } : undefined}
      >
        {/* Ambient fill so the photo's own background reads seamlessly */}
        <div className="absolute inset-0 bg-white" />

        {current.src ? (
          <img
            key={current.src}
            src={current.src}
            alt={current.alt || `${name} — image ${index + 1}`}
            loading="eager"
            onLoad={() => markLoaded(index)}
            className={`relative z-10 w-full h-full ${
              isRender
                ? 'object-contain p-3 sm:p-4'
                : 'object-cover group-hover/gallery:scale-[1.02]'
            } transition-[aspect-ratio,transform] duration-500 ease-out ${
              loaded[index] ? 'opacity-100' : 'opacity-0'
            }`}
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-slate-600">
            <ImageOff className="w-8 h-8" />
            <span className="text-xs font-mono">Image unavailable</span>
          </div>
        )}

        {/* Bottom branding strip for supplier/name context */}
        <div className="absolute bottom-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
          <span className="px-3 py-1 text-[10px] font-mono tracking-wider uppercase rounded-full border backdrop-blur bg-[#06090F]/80 border-white/10 text-slate-300">
            {name}
          </span>
          {showArrows && (
            <span className="px-3 py-1 text-[10px] font-mono tracking-wider rounded-full border backdrop-blur bg-[#06090F]/80 border-white/10 text-slate-400">
              {index + 1} / {count}
            </span>
          )}
        </div>

        {/* Arrows */}
        {showArrows && (
          <>
            <button
              type="button"
              onClick={prev}
              aria-label="Previous image"
              className="absolute left-3 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full flex items-center justify-center bg-[#06090F]/70 backdrop-blur border border-white/10 text-slate-200 hover:text-white hover:border-primary/40 hover:bg-[#06090F]/90 transition-colors-opacity"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={next}
              aria-label="Next image"
              className="absolute right-3 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full flex items-center justify-center bg-[#06090F]/70 backdrop-blur border border-white/10 text-slate-200 hover:text-white hover:border-primary/40 hover:bg-[#06090F]/90 transition-colors-opacity"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {showArrows && (
        <div className="mt-4 flex items-center justify-center gap-2 flex-wrap">
          {safeImages.map((img, i) => (
            <button
              key={img.src}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Go to image ${i + 1}`}
              className={`relative w-16 h-16 rounded-lg overflow-hidden border transition-all duration-200 ${
                i === index
                  ? 'border-primary ring-1 ring-primary/40'
                  : 'border-white/10 opacity-60 hover:opacity-100'
              }`}
            >
              {img.src ? (
                <img
                  src={img.src}
                  alt=""
                  loading="lazy"
                  className={`w-full h-full ${
                    img.fit === 'contain' ? 'object-contain p-1 bg-white' : 'object-cover'
                  }`}
                />
              ) : (
                <div className="w-full h-full bg-white flex items-center justify-center">
                  <ImageOff className="w-4 h-4 text-slate-400" />
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
