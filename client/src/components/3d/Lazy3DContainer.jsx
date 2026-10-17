import React, { useState, useEffect, useRef } from 'react';
import { shouldLoad3D, WebGLFallback } from './webglUtils';

/**
 * Lazy3DContainer
 *
 * Implements Step 1 of PSI Optimization:
 * - Mounts 3D scene only when near viewport (IntersectionObserver rootMargin: 200px)
 * - Defers mounting until browser idle (requestIdleCallback with 1500ms fallback)
 * - Completely skips 3D loading when prefers-reduced-motion, saveData, or on narrow low-power mobile viewports
 * - Preserves reserved layout dimensions (minHeight) to guarantee zero CLS
 */
export default function Lazy3DContainer({
  children,
  height = 320,
  fallbackTitle = '3D Cryptographic Enclave',
  fallbackDescription = 'Hardware-accelerated 3D rendering unavailable or disabled for efficiency.'
}) {
  const containerRef = useRef(null);
  const [shouldRender, setShouldRender] = useState(false);
  const [canLoad3D, setCanLoad3D] = useState(true);

  useEffect(() => {
    if (!shouldLoad3D()) {
      setCanLoad3D(false);
      return;
    }

    const container = containerRef.current;
    if (!container) return;

    let idleId = null;
    let timerId = null;

    const observer = new IntersectionObserver((entries) => {
      const entry = entries[0];
      if (entry && entry.isIntersecting) {
        observer.disconnect();

        // Mount after requestIdleCallback (fallback 1500ms)
        const mount = () => setShouldRender(true);

        if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
          idleId = window.requestIdleCallback(mount, { timeout: 1500 });
        } else {
          timerId = setTimeout(mount, 300);
        }
      }
    }, { rootMargin: '200px', threshold: 0.01 });

    observer.observe(container);

    return () => {
      observer.disconnect();
      if (idleId && typeof window !== 'undefined' && 'cancelIdleCallback' in window) {
        window.cancelIdleCallback(idleId);
      }
      if (timerId) clearTimeout(timerId);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        minHeight: `${height}px`,
        height: `${height}px`,
        position: 'relative'
      }}
    >
      {!canLoad3D ? (
        <WebGLFallback title={fallbackTitle} description={fallbackDescription} />
      ) : shouldRender ? (
        children
      ) : (
        <div style={{
          width: '100%',
          height: '100%',
          display: 'grid',
          placeItems: 'center',
          background: 'radial-gradient(circle at 50% 50%, rgba(99, 102, 241, 0.08), transparent 70%)',
          borderRadius: '12px',
          border: '1px solid var(--border)'
        }}>
          <div style={{ textAlign: 'center', color: 'var(--muted-foreground)', fontSize: '0.78rem' }}>
            <div style={{
              width: '48px',
              height: '48px',
              margin: '0 auto 8px',
              borderRadius: '50%',
              border: '1px dashed var(--accent)',
              opacity: 0.6
            }} />
            <span>Interactive 3D Enclave</span>
          </div>
        </div>
      )}
    </div>
  );
}
