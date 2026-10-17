import React, { useState, Suspense, lazy } from 'react';
import {
  ShieldCheck, ArrowRight, Video, Play, Info
} from 'lucide-react';
import LiveEnforcementStrip from './LiveEnforcementStrip';
import LazySection from './LazySection';
const BoundaryTestSection = lazy(() => import('./BoundaryTestSection'));
const HowWeUseArmorIQSection = lazy(() => import('./HowWeUseArmorIQSection'));
const ExplainerVideoSection = lazy(() => import('./ExplainerVideoSection'));
const OverviewBelowTheFold = lazy(() => import('./OverviewBelowTheFold'));
const InteractiveWalkthroughTour = lazy(() => import('./InteractiveWalkthroughTour'));

export default function OverviewScreen({
  planData,
  systemStatus,
  onNavigate,
  onSimulateDeposit
}) {
  const [showDemoVideo, setShowDemoVideo] = useState(false);

  const plan = planData?.plan;
  const totalLiquid = plan?.totalLiquidUsd || 0;
  const reserveFloor = plan?.reserveFloor || 15000;
  const approvedOutflow = plan?.forecastRunway?.approvedOutflowsUsd || 0;
  const deferredOutflow = plan?.forecastRunway?.deferredOutflowsUsd || 0;
  const freeBuffer = Math.max(0, totalLiquid - reserveFloor);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Sandbox Notice Banner - Mandatory Rule 5 */}
      <div style={{
        background: 'rgba(56, 189, 248, 0.08)',
        border: '1px solid rgba(56, 189, 248, 0.25)',
        borderRadius: '10px',
        padding: '10px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '10px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--brand-accent-text, #0284c7)', fontSize: '0.82rem', fontWeight: 600 }}>
          <Info size={16} />
          <span>Sandbox / test environment. No real funds or customer data.</span>
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
          Synthetic Airwallex balances & test orders (ORD-1001, ACC-4471)
        </div>
      </div>

      {/* TASK 1: Live Enforcement Strip on First Screen */}
      <LiveEnforcementStrip />

      {/* Hero Section: Positioned as Voice AI support agent governed by ArmorIQ */}
      <div style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: '16px',
        padding: 'clamp(24px, 5vw, 40px) clamp(16px, 4vw, 32px)',
        boxShadow: 'var(--card-shadow)'
      }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '4px 12px', borderRadius: '9999px', background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.3)', color: 'var(--success)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }}></span>
          Official Submission · ArmorIQ Flow State Hackathon
        </div>

        <h1 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 800, color: 'var(--foreground)', letterSpacing: '-0.03em', lineHeight: 1.2, margin: '0 0 16px 0' }}>
          Voice AI support agent governed by ArmorIQ
        </h1>

        {/* The 2 Mandated Sentences — Zero "Autonomous Treasury" wording in hero */}
        <p style={{ fontSize: 'clamp(1rem, 2vw, 1.15rem)', color: 'var(--foreground)', lineHeight: 1.6, margin: '0 0 8px 0', fontWeight: 500 }}>
          BeyondFlow is a voice AI support agent governed by ArmorIQ that handles live telephony inquiries, manages order verification, and secures high-value disbursements.
        </p>
        <p style={{ fontSize: 'clamp(0.9rem, 1.8vw, 1.05rem)', color: 'var(--muted-foreground)', lineHeight: 1.6, margin: '0 0 24px 0' }}>
          ArmorIQ cryptographically bounds every tool invocation to declared intent using Ed25519 tokens and blocks unauthorized bank diversions or prompt injections before any network execution.
        </p>

        {/* CTA Buttons */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
          <a
            href="#explainer-video"
            onClick={(e) => { e.preventDefault(); const el = document.getElementById('explainer-video'); if (el) el.scrollIntoView({ behavior: 'smooth' }); }}
            className="btn btn-primary mobile-tap-target"
            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px 20px', minHeight: '44px', fontSize: '0.9rem', fontWeight: 700 }}
          >
            <Video size={16} />
            <span>Watch Demo Video (3:49)</span>
          </a>


          <button
            onClick={() => setShowDemoVideo(!showDemoVideo)}
            className="btn btn-secondary mobile-tap-target"
            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px 18px', minHeight: '44px', fontSize: '0.9rem' }}
          >
            <Play size={16} fill="currentColor" />
            <span>{showDemoVideo ? 'Hide Walkthrough Steps' : 'Interactive 4-Phase Tour'}</span>
          </button>

          <a
            href="/judges"
            onClick={(e) => { e.preventDefault(); onNavigate('judges'); }}
            className="btn btn-secondary mobile-tap-target"
            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px 20px', minHeight: '44px', fontSize: '0.9rem' }}
          >
            <ShieldCheck size={16} color="var(--success)" />
            <span>Judge Inspection Dashboard (/judges)</span>
            <ArrowRight size={14} />
          </a>

          <a
            href="/#boundary-test"
            onClick={(e) => { e.preventDefault(); const el = document.getElementById('boundary-test'); if (el) el.scrollIntoView({ behavior: 'smooth' }); }}
            className="btn btn-secondary mobile-tap-target"
            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px 18px', minHeight: '44px', fontSize: '0.9rem' }}
          >
            <span>Skip to Boundary Test</span>
            <ArrowRight size={14} />
          </a>
        </div>

        {/* Interactive 60-Second Walkthrough Explainer (Lazy Loaded on Demand) */}
        {showDemoVideo && (
          <Suspense fallback={<div style={{ minHeight: '180px', display: 'grid', placeItems: 'center', color: 'var(--muted-foreground)', fontSize: '0.85rem' }}>Loading architectural tour…</div>}>
            <InteractiveWalkthroughTour onClose={() => setShowDemoVideo(false)} />
          </Suspense>
        )}
      </div>

      {/* Official 3-Minute Architectural Explainer Video */}
      <LazySection minHeight="260px">
        <Suspense fallback={<div style={{ minHeight: '260px' }} />}>
          <ExplainerVideoSection />
        </Suspense>
      </LazySection>

      {/* TIER 1 ITEM 5: Centerpiece Boundary Test Section */}
      <LazySection minHeight="360px">
        <Suspense fallback={<div style={{ minHeight: '360px' }} />}>
          <BoundaryTestSection />
        </Suspense>
      </LazySection>

      {/* TIER 1 ITEM 7: Architecture & Enforcement Flow Section */}
      <LazySection minHeight="300px">
        <Suspense fallback={<div style={{ minHeight: '300px' }} />}>
          <HowWeUseArmorIQSection />
        </Suspense>
      </LazySection>

      {/* Below-the-fold sections: Scenarios, Spotlight, 3D Vault, KPIs, Wallets, Runway */}
      <LazySection minHeight="600px">
        <Suspense fallback={<div style={{ minHeight: '600px' }} />}>
          <OverviewBelowTheFold
            systemStatus={systemStatus}
            onNavigate={onNavigate}
            onSimulateDeposit={onSimulateDeposit}
            plan={plan}
            totalLiquid={totalLiquid}
            reserveFloor={reserveFloor}
            approvedOutflow={approvedOutflow}
            deferredOutflow={deferredOutflow}
            freeBuffer={freeBuffer}
          />
        </Suspense>
      </LazySection>
    </div>
  );
}
