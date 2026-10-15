/**
 * WebGL Support & Accessibility Utilities for 3D Elements
 * 
 * Verifies WebGL availability before attempting Three.js initialization,
 * and checks user preference for reduced motion.
 */

/**
 * Checks whether WebGL / WebGL2 rendering is supported and available in the current browser.
 * @returns {boolean} true if WebGL context can be created, false otherwise.
 */
export function isWebGLAvailable() {
  if (typeof window === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    return Boolean(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl') || canvas.getContext('webgl2'))
    );
  } catch (err) {
    return false;
  }
}

/**
 * Checks if the user prefers reduced motion for accessibility (WCAG 2.1 compliance).
 * @returns {boolean} true if prefers-reduced-motion is active.
 */
export function prefersReducedMotion() {
  if (typeof window === 'undefined') return false;
  return Boolean(
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

/**
 * Standard fallback card shown when WebGL is unavailable on older devices or software renderers.
 */
import React from 'react';
import { Shield, Box, AlertCircle } from 'lucide-react';

export function WebGLFallback({ title = '3D Cryptographic Enclave', description = 'Hardware-accelerated 3D rendering unavailable in this browser.' }) {
  return (
    <div style={{
      width: '100%',
      height: '100%',
      minHeight: '260px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--card)',
      border: '1px dashed var(--border)',
      borderRadius: '12px',
      padding: '24px',
      textAlign: 'center',
      color: 'var(--foreground)'
    }}>
      <div style={{
        width: '54px',
        height: '54px',
        borderRadius: '50%',
        background: 'var(--secondary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '12px',
        border: '1px solid var(--border)'
      }}>
        <Box size={26} color="var(--accent)" />
      </div>
      <h4 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 6px 0' }}>{title}</h4>
      <p style={{ fontSize: '0.82rem', color: 'var(--muted-foreground)', maxWidth: '320px', margin: 0 }}>
        {description}
      </p>
      <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', color: 'var(--muted-foreground)' }}>
        <AlertCircle size={12} color="#f59e0b" />
        <span>ArmorIQ Cryptographic Enforcement Active</span>
      </div>
    </div>
  );
}
