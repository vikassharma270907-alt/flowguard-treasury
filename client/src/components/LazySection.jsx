import React, { useState, useEffect, useRef } from 'react';

export default function LazySection({ children, fallback = null, rootMargin = '50px', minHeight = '300px' }) {
  const [shouldMount, setShouldMount] = useState(() => {
    if (typeof window === 'undefined') return true;
    // If navigating directly to a deep anchor hash, mount immediately
    return Boolean(window.location.hash);
  });
  const containerRef = useRef(null);

  useEffect(() => {
    if (shouldMount || typeof window === 'undefined') return;

    if (!('IntersectionObserver' in window)) {
      setShouldMount(true);
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      if (entries.some(e => e.isIntersecting)) {
        setShouldMount(true);
        observer.disconnect();
      }
    }, { rootMargin });

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    // Mount on first user scroll, touch, or keyboard navigation
    const triggerEvents = ['scroll', 'touchstart', 'pointerdown', 'keydown', 'wheel'];
    const handleUserInteraction = () => {
      setShouldMount(true);
      triggerEvents.forEach(e => window.removeEventListener(e, handleUserInteraction));
    };
    triggerEvents.forEach(e => window.addEventListener(e, handleUserInteraction, { once: true, passive: true }));

    // Defensive fallback timeout (15s) for crawlers without interaction
    const timerHandle = setTimeout(() => {
      setShouldMount(true);
    }, 15000);

    return () => {
      observer.disconnect();
      triggerEvents.forEach(e => window.removeEventListener(e, handleUserInteraction));
      clearTimeout(timerHandle);
    };
  }, [shouldMount, rootMargin]);

  return (
    <div ref={containerRef} style={{ minHeight: shouldMount ? undefined : minHeight }}>
      {shouldMount ? children : fallback}
    </div>
  );
}
