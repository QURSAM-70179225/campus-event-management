import { useState } from 'react';
import { getCategoryMeta } from '../utils/categories';

/**
 * Event artwork: the admin-supplied image when it loads, otherwise a
 * category-coloured gradient with a large icon so every event still looks finished.
 */
export default function CategoryVisual({ event, className = '', iconSize = 'h-16 w-16', children }) {
  const meta = getCategoryMeta(event.category);
  const [imageFailed, setImageFailed] = useState(false);
  const Icon = meta.icon;
  const showImage = event.image_url && !imageFailed;

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{ backgroundImage: `linear-gradient(135deg, ${meta.from} 0%, ${meta.to} 100%)` }}
    >
      {showImage ? (
        <>
          <img
            src={event.image_url}
            alt=""
            loading="lazy"
            onError={() => setImageFailed(true)}
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/10 to-transparent" />
        </>
      ) : (
        <>
          {/* Soft concentric rings give the gradient some depth */}
          <div
            aria-hidden
            className="absolute inset-0 opacity-25"
            style={{
              backgroundImage:
                'repeating-radial-gradient(circle at 85% 20%, rgba(255,255,255,.35) 0 1px, transparent 1px 22px)',
            }}
          />
          <Icon aria-hidden className={`absolute -right-3 -bottom-3 rotate-[-8deg] text-white/25 ${iconSize}`} strokeWidth={1.4} />
        </>
      )}
      {children}
    </div>
  );
}
