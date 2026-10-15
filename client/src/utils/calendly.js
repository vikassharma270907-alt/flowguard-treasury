/**
 * Calendly & Universal Booking Lazy Loader & Trigger Helper
 * 
 * Rules:
 * - Lazy-load Calendly widget.js and CSS (https://assets.calendly.com/assets/external/widget.js)
 *   ONLY on hover or click. Never load on first paint.
 * - Opens Calendly popup modal with window.Calendly.initPopupWidget({ url }) when Calendly domain is detected.
 * - Handles cal.id / cal.com and other scheduling providers gracefully with popup windows.
 * - Progressive fallback: native <a href={url} target="_blank" rel="noopener noreferrer">.
 * - Returns focus to the trigger element on close.
 */

let calendlyPromise = null;

export function loadCalendlyAssets() {
  if (calendlyPromise) return calendlyPromise;

  calendlyPromise = new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(false);
      return;
    }

    if (window.Calendly) {
      resolve(true);
      return;
    }

    // Load Calendly stylesheet
    const existingLink = document.querySelector('link[href*="calendly.com/assets/external/widget.css"]');
    if (!existingLink) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://assets.calendly.com/assets/external/widget.css';
      document.head.appendChild(link);
    }

    // Load Calendly widget.js
    const existingScript = document.querySelector('script[src*="calendly.com/assets/external/widget.js"]');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(true), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://assets.calendly.com/assets/external/widget.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      console.warn('Calendly script failed to load, falling back to direct tab.');
      resolve(false);
    };
    document.body.appendChild(script);
  });

  return calendlyPromise;
}

export async function openCalendly(url, triggerElement) {
  if (!url) return;

  const isCalendly = url.includes('calendly.com');

  if (isCalendly) {
    try {
      const loaded = await loadCalendlyAssets();
      if (loaded && window.Calendly?.initPopupWidget) {
        window.Calendly.initPopupWidget({ url });

        // Mutation observer to detect when calendly-overlay is removed from DOM to return focus
        const observer = new MutationObserver(() => {
          const overlay = document.querySelector('.calendly-overlay');
          if (!overlay) {
            triggerElement?.focus();
            observer.disconnect();
          }
        });
        observer.observe(document.body, { childList: true, subtree: true });
        return;
      }
    } catch (err) {
      console.warn('Could not launch Calendly popup, falling back to window:', err);
    }
  }

  // Provider fallback (cal.id, cal.com, or general scheduling)
  const popup = window.open(url, 'BookingPopup', 'width=840,height=750,scrollbars=yes,resizable=yes');
  if (popup) {
    const timer = setInterval(() => {
      if (popup.closed) {
        clearInterval(timer);
        triggerElement?.focus();
      }
    }, 500);
  } else {
    // Standard tab fallback
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}
