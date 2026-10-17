/**
 * 3D Element 3: Interactive Intent Gyroscope (Reacts to Mouse & Scroll)
 * 
 * Multi-ring 3D gyroscopic enclave representing ArmorIQ's 3 Layers of Defense:
 * 1. Outer Ring: Platform Stored Policy Enforcement (ALLOW / DENY / HOLD)
 * 2. Middle Ring: Merkle Proof & CSRG-IAP Cryptographic Intent Binding
 * 3. Inner Ring: MCP Tool Action Delegation & Dual-Supervisor Quorum
 * 4. Center Core: Verified Execution Enclave
 * 
 * Interactivity:
 * - Mouse Tracking: Rings rotate independently on X, Y, and Z axes following mouse coordinates with smooth damping
 * - Scroll Reaction: Window/container scroll dynamically expands the gimbal rings into an exploded view
 * - Theme-reactive: Adapts materials, lighting, and emission between light and dark modes
 * - 60 FPS performance, ResizeObserver, prefers-reduced-motion compliance, and full GPU cleanup
 */

import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { isWebGLAvailable, prefersReducedMotion, WebGLFallback } from './webglUtils';
import { useTheme } from '../../context/ThemeContext';

export default function InteractiveIntentGyroscope({ height = 380, interactive = true }) {
  const containerRef = useRef(null);
  const { isDark } = useTheme();
  const [hasWebGL, setHasWebGL] = useState(true);
  const [activeLayer, setActiveLayer] = useState('ALL LAYERS ACTIVE');

  useEffect(() => {
    // 1. WebGL Support Verification
    if (!isWebGLAvailable()) {
      setHasWebGL(false);
      return;
    }

    const container = containerRef.current;
    if (!container) return;

    const reducedMotion = prefersReducedMotion();

    // 2. Scene, Camera, and Renderer Setup
    const scene = new THREE.Scene();
    const width = container.clientWidth || 400;
    const h = height;

    const camera = new THREE.PerspectiveCamera(45, width / h, 0.1, 100);
    camera.position.set(0, 0, 8.5);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    // 3. Lighting Setup
    const ambientLight = new THREE.AmbientLight(
      isDark ? 0xffffff : 0xffffff,
      isDark ? 1.0 : 1.5
    );
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(isDark ? 0x6366f1 : 0x2563eb, 2.5);
    dirLight1.position.set(5, 10, 7);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(isDark ? 0x10b981 : 0x059669, 2.0);
    dirLight2.position.set(-5, -5, -4);
    scene.add(dirLight2);

    // 4. Gyroscope Rings (3 Nested Gimbal Rings)
    // Outer Ring: Platform Policy (Indigo / Violet)
    const ring1Geo = new THREE.TorusGeometry(3.0, 0.08, 16, 100);
    const ring1Mat = new THREE.MeshStandardMaterial({
      color: isDark ? 0x8b5cf6 : 0x6d28d9,
      metalness: 0.8,
      roughness: 0.2,
      emissive: isDark ? 0x4c1d95 : 0x5b21b6,
      emissiveIntensity: 0.35
    });
    const ring1 = new THREE.Mesh(ring1Geo, ring1Mat);
    scene.add(ring1);

    // Middle Ring: Merkle Proofs & Plan Hash (Cyan / Emerald)
    const ring2Geo = new THREE.TorusGeometry(2.3, 0.07, 16, 100);
    const ring2Mat = new THREE.MeshStandardMaterial({
      color: isDark ? 0x38bdf8 : 0x0284c7,
      metalness: 0.85,
      roughness: 0.15,
      emissive: isDark ? 0x075985 : 0x0369a1,
      emissiveIntensity: 0.35
    });
    const ring2 = new THREE.Mesh(ring2Geo, ring2Mat);
    scene.add(ring2);

    // Inner Ring: MCP Action Bound Token (Emerald / Mint)
    const ring3Geo = new THREE.TorusGeometry(1.6, 0.06, 16, 100);
    const ring3Mat = new THREE.MeshStandardMaterial({
      color: isDark ? 0x10b981 : 0x059669,
      metalness: 0.9,
      roughness: 0.1,
      emissive: isDark ? 0x064e3b : 0x047857,
      emissiveIntensity: 0.4
    });
    const ring3 = new THREE.Mesh(ring3Geo, ring3Mat);
    scene.add(ring3);

    // Central Core: Verified Execution Enclave (Octahedron)
    const coreGeo = new THREE.OctahedronGeometry(0.85, 0);
    const coreMat = new THREE.MeshStandardMaterial({
      color: isDark ? 0xffffff : 0x0f172a,
      metalness: 0.95,
      roughness: 0.05,
      emissive: isDark ? 0x10b981 : 0x2563eb,
      emissiveIntensity: 0.3
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    scene.add(core);

    // 5. Interactive Mouse & Scroll State
    const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
    let scrollExpansion = 0;
    let targetScrollExpansion = 0;

    const handlePointerMove = (e) => {
      if (!interactive) return;
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      mouse.targetX = x * 1.2;
      mouse.targetY = y * 0.9;
    };

    const handleScroll = () => {
      const scrollY = window.scrollY || window.pageYOffset || 0;
      // Map scroll offset to subtle ring expansion / tilt (0 to 1 range)
      targetScrollExpansion = Math.min(1.0, scrollY / 600);
    };

    container.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('scroll', handleScroll, { passive: true });

    // 6. Responsive Resize Handling
    const handleResize = () => {
      if (!container) return;
      const newWidth = container.clientWidth || 400;
      camera.aspect = newWidth / height;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, height);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    // 7. Animation Loop (60 FPS)
    let animationFrameId;
    let clock = new THREE.Clock();

    const animate = () => {
      // Pause render loop if tab is hidden
      if (document.hidden) {
        animationFrameId = requestAnimationFrame(animate);
        return;
      }
      animationFrameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const speed = reducedMotion ? 0.08 : 0.75;

      // Mouse and Scroll Damping (lerp)
      mouse.x += (mouse.targetX - mouse.x) * 0.06;
      mouse.y += (mouse.targetY - mouse.y) * 0.06;
      scrollExpansion += (targetScrollExpansion - scrollExpansion) * 0.05;

      // Independent Gimbal Rotations
      ring1.rotation.x += delta * speed * 0.5 + mouse.y * 0.02;
      ring1.rotation.y += delta * speed * 0.3;

      ring2.rotation.y += delta * speed * 0.6 + mouse.x * 0.02;
      ring2.rotation.z += delta * speed * 0.4;

      ring3.rotation.z += delta * speed * 0.7;
      ring3.rotation.x += delta * speed * 0.45;

      core.rotation.y += delta * speed * 0.8;
      core.rotation.x += delta * speed * 0.4;

      // Scroll reaction: Rings expand outwards (exploded view) on scroll
      const explodeOffset = scrollExpansion * 0.6;
      ring1.position.z = explodeOffset * 1.2;
      ring2.position.z = explodeOffset * 0.5;
      ring3.position.z = -explodeOffset * 0.4;

      // Overall scene tilt
      scene.rotation.y = mouse.x * 0.4;
      scene.rotation.x = -mouse.y * 0.3;

      renderer.render(scene, camera);
    };

    animate();

    // 8. Strict Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      container.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('scroll', handleScroll);
      resizeObserver.disconnect();

      ring1Geo.dispose();
      ring2Geo.dispose();
      ring3Geo.dispose();
      coreGeo.dispose();

      ring1Mat.dispose();
      ring2Mat.dispose();
      ring3Mat.dispose();
      coreMat.dispose();

      renderer.dispose();
      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, [isDark, height, interactive]);

  if (!hasWebGL) {
    return <WebGLFallback title="Interactive Intent Gyroscope" description="3D Gyroscopic Cryptographic Enclave fallback." />;
  }

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        height: `${height}px`,
        overflow: 'hidden',
        cursor: interactive ? 'grab' : 'default',
        touchAction: 'none'
      }}
      title="Interactive 3D ArmorIQ Gyroscope: Move mouse to tilt gimbal rings; scroll page to view exploded enclave"
    >
      {/* Live Telemetry Overlay */}
      <div style={{
        position: 'absolute',
        top: '12px',
        right: '14px',
        background: 'var(--glass-bg)',
        border: '1px solid var(--border)',
        backdropFilter: 'blur(10px)',
        padding: '6px 12px',
        borderRadius: '8px',
        fontSize: '0.7rem',
        color: 'var(--foreground)',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        pointerEvents: 'none'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#34d399' }} />
          <span>ARMORIQ DEFENSE GIMBAL</span>
        </div>
        <div style={{ fontSize: '0.64rem', color: 'var(--muted-foreground)' }}>
          Ring 1: Policy · Ring 2: Merkle Proof · Ring 3: MCP Token
        </div>
      </div>

      <div style={{
        position: 'absolute',
        bottom: '12px',
        left: '14px',
        fontSize: '0.66rem',
        color: 'var(--muted-foreground)',
        background: 'var(--glass-bg)',
        padding: '3px 8px',
        borderRadius: '4px',
        border: '1px solid var(--border)',
        pointerEvents: 'none'
      }}>
        Mouse: Gimbal Tilt · Scroll: Exploded View
      </div>
    </div>
  );
}
