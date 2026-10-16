import React, { useState, useEffect, Suspense, lazy } from 'react';
import Header from './components/Header';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import OverviewScreen from './components/OverviewScreen';

// Route-level code splitting: only the overview screen ships in the initial
// bundle; every other screen (and the modals) loads on first navigation.
const PlannerScreen = lazy(() => import('./components/PlannerScreen'));
const InvoiceGuardScreen = lazy(() => import('./components/InvoiceGuardScreen'));
const AuditLedgerScreen = lazy(() => import('./components/AuditLedgerScreen'));
const AdminPanel = lazy(() => import('./components/AdminPanel'));
const VoiceGatewayScreen = lazy(() => import('./components/VoiceGatewayScreen'));
const EnclaveScreen = lazy(() => import('./components/EnclaveScreen'));
const ApprovalModal = lazy(() => import('./components/ApprovalModal'));
const CredentialsModal = lazy(() => import('./components/CredentialsModal'));
const OAuthModal = lazy(() => import('./components/OAuthModal'));
const LegalPages = lazy(() => import('./components/LegalPages'));
const PricingSection = lazy(() => import('./components/PricingSection'));
const JudgesPage = lazy(() => import('./components/JudgesPage'));
const ScenariosScreen = lazy(() => import('./components/ScenariosScreen'));
import { Lock, Shield, ArrowRight } from 'lucide-react';

const LEGAL_ROUTES = ['privacy', 'terms', 'refund-policy', 'grievance-officer', 'dpdp-compliance', 'dpdp-act'];

function getInitialTabFromUrl() {
  if (typeof window === 'undefined') return 'overview';
  const path = window.location.pathname.replace(/^\/+|\/+$/g, '');
  if (path === 'judges') return 'judges';
  if (path === 'scenarios') return 'scenarios';
  if (LEGAL_ROUTES.includes(path)) {
    return path === 'dpdp-act' ? 'dpdp-compliance' : path;
  }
  if (path === 'how-it-works' || path === 'enclave') return 'enclave';
  if (path === 'boundary-test' || path === 'boundary') return 'overview';
  if (path === 'pricing') return 'pricing';

  if (window.location.hash) {
    const hash = window.location.hash.replace('#', '');
    if (hash === 'judges') return 'judges';
    if (hash === 'scenarios') return 'scenarios';
    if (hash === 'pricing') return 'pricing';
    if (hash === 'how-it-works' || hash === 'enclave') return 'enclave';
    if (hash === 'boundary-test' || hash === 'boundary') return 'overview';
    if (hash === 'quickstart') return 'overview';
  }
  return 'overview';
}

export default function App() {
  const [activeTab, setActiveTab] = useState(getInitialTabFromUrl);
  const [systemStatus, setSystemStatus] = useState(null);
  const [planData, setPlanData] = useState(null);
  const [inspections, setInspections] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedInvoiceForApproval, setSelectedInvoiceForApproval] = useState(null);
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [showOAuthModal, setShowOAuthModal] = useState(false);
  const [userSession, setUserSession] = useState({ authenticated: false, user: null });

  const loadData = async () => {
    setIsRefreshing(true);
    try {
      const [statusRes, plannerRes, inspectionsRes] = await Promise.all([
        fetch('/api/status'),
        fetch('/api/planner'),
        fetch('/api/invoices/inspections')
      ]);

      const statusData = await statusRes.json();
      const planData = await plannerRes.json();
      const inspData = await inspectionsRes.json();

      setSystemStatus(statusData);
      setPlanData(planData);
      setInspections(inspData);
    } catch (err) {
      console.warn('Error connecting to backend:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const checkAuthSession = async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('armoriq_access_token') : null;
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      const res = await fetch('/api/auth/session', { headers });
      const data = await res.json();
      if (data.authenticated && data.user) {
        setUserSession({ authenticated: true, user: data.user });
      }
    } catch (err) {
      console.warn('Could not verify auth session:', err);
    }
  };

  useEffect(() => {
    loadData();
    checkAuthSession();

    const handleLocationChange = () => {
      setActiveTab(getInitialTabFromUrl());
    };
    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);

  // Smooth scroll handler for #boundary-test with prominent focus effect
  useEffect(() => {
    const scrollToBoundaryTest = () => {
      const hash = window.location.hash;
      const path = window.location.pathname.replace(/^\/+|\/+$/g, '');
      if (hash === '#boundary-test' || hash === '#boundary' || path === 'boundary-test') {
        setTimeout(() => {
          const el = document.getElementById('boundary-test');
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            el.style.transition = 'box-shadow 0.4s ease, border-color 0.4s ease';
            el.style.borderColor = '#38bdf8';
            el.style.boxShadow = '0 0 0 2px #38bdf8, 0 10px 30px rgba(56, 189, 248, 0.25)';
            setTimeout(() => {
              el.style.boxShadow = 'var(--card-shadow)';
              el.style.borderColor = 'var(--border)';
            }, 3000);
          }
        }, 120);
      }
    };

    scrollToBoundaryTest();
    window.addEventListener('hashchange', scrollToBoundaryTest);
    return () => window.removeEventListener('hashchange', scrollToBoundaryTest);
  }, [activeTab]);

  const handleNavigate = (tab) => {
    const rawTab = (tab || '').replace(/^\/+|\/?#|\/+$/g, '');

    if (rawTab === 'boundary' || rawTab === 'boundary-test') {
      setActiveTab('overview');
      window.history.pushState(null, '', '/#boundary-test');
      setTimeout(() => {
        const el = document.getElementById('boundary-test');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          el.style.transition = 'box-shadow 0.4s ease, border-color 0.4s ease';
          el.style.borderColor = '#38bdf8';
          el.style.boxShadow = '0 0 0 2px #38bdf8, 0 10px 30px rgba(56, 189, 248, 0.25)';
          setTimeout(() => {
            el.style.boxShadow = 'var(--card-shadow)';
            el.style.borderColor = 'var(--border)';
          }, 3000);
        }
      }, 100);
      return;
    }

    const targetTab = (rawTab === 'how-it-works' || rawTab === 'howitworks' || rawTab === 'enclave') ? 'enclave' : rawTab;
    setActiveTab(targetTab);

    if (LEGAL_ROUTES.includes(targetTab)) {
      window.history.pushState(null, '', `/${targetTab}`);
    } else if (targetTab === 'judges') {
      window.history.pushState(null, '', '/judges');
    } else if (targetTab === 'scenarios') {
      window.history.pushState(null, '', '/scenarios');
    } else if (targetTab === 'pricing') {
      window.history.pushState(null, '', '/#pricing');
    } else if (targetTab === 'enclave') {
      window.history.pushState(null, '', '/how-it-works');
    } else if (targetTab === 'overview') {
      window.history.pushState(null, '', '/');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOAuthSuccess = (sessionData) => {
    const session = sessionData?.authenticated !== undefined
      ? sessionData
      : { authenticated: true, user: sessionData };
    setUserSession(session);
    setActiveTab('admin');
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error(err);
    }
    if (typeof window !== 'undefined') {
      localStorage.removeItem('armoriq_access_token');
      localStorage.removeItem('armoriq_refresh_token');
    }
    setUserSession({ authenticated: false, user: null });
  };

  const handleRecalculateReserve = async (newFloor) => {
    try {
      const res = await fetch('/api/planner/recalculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reserveFloor: newFloor })
      });
      const data = await res.json();
      if (data.plan) {
        setPlanData({ ...planData, plan: data.plan });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectScenario = async (scenarioId) => {
    setIsRefreshing(true);
    try {
      await fetch('/api/scenarios/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario: scenarioId })
      });
      await loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleRegisterInvoice = async (newInv) => {
    try {
      await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newInv)
      });
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleExecutePayment = async (payload) => {
    try {
      const res = await fetch('/api/payments/approve-and-pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      await loadData();
      return data;
    } catch (err) {
      console.error(err);
      return { success: false, error: err.message };
    }
  };

  const handleTransitionStatus = async (transferId, nextStatus) => {
    try {
      const res = await fetch('/api/payments/transition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transferId, nextStatus })
      });
      const data = await res.json();
      await loadData();
      return data;
    } catch (err) {
      console.error(err);
      return { success: false, error: err.message };
    }
  };

  const handleSimulateDeposit = async (amount, currency) => {
    try {
      await fetch('/api/simulation/deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, currency, payerName: 'Simulated Inbound Advance' })
      });
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveCredentials = async (clientId, apiKey) => {
    const res = await fetch('/api/config/credentials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId, apiKey })
    });
    const data = await res.json();
    await loadData();
    return data;
  };

  const isLegalOrPricingOrJudges = LEGAL_ROUTES.includes(activeTab) || activeTab === 'pricing' || activeTab === 'judges';

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header activeTab={activeTab} onNavigate={handleNavigate} />
      {!isLegalOrPricingOrJudges && (
        <Navbar
          systemStatus={systemStatus}
          activeTab={activeTab}
          setActiveTab={handleNavigate}
          onOpenCredentials={() => setShowCredentialsModal(true)}
          onSelectScenario={handleSelectScenario}
          isRefreshing={isRefreshing}
          onRefresh={loadData}
          userSession={userSession}
          onOpenOAuth={() => setShowOAuthModal(true)}
          onLogout={handleLogout}
        />
      )}

      <main style={{ maxWidth: '1440px', width: '100%', margin: '0 auto', padding: '24px', flex: 1 }}>
        <Suspense fallback={
          <div style={{ minHeight: '60vh', display: 'grid', placeItems: 'center', color: 'var(--muted-foreground)', fontSize: '0.9rem' }}>
            Loading…
          </div>
        }>
        {activeTab === 'judges' && (
          <JudgesPage onNavigate={handleNavigate} />
        )}

        {activeTab === 'scenarios' && (
          <ScenariosScreen
            systemStatus={systemStatus}
            onSelectScenario={handleSelectScenario}
            onNavigate={handleNavigate}
          />
        )}

        {LEGAL_ROUTES.includes(activeTab) && (
          <LegalPages
            docKey={activeTab}
            onBackToHome={() => handleNavigate('overview')}
          />
        )}

        {activeTab === 'pricing' && (
          <PricingSection
            onBackToHome={() => handleNavigate('overview')}
          />
        )}

        {activeTab === 'overview' && (
          <OverviewScreen
            planData={planData}
            systemStatus={systemStatus}
            onNavigate={setActiveTab}
            onSimulateDeposit={handleSimulateDeposit}
          />
        )}

        {(activeTab === 'enclave' || activeTab === 'how-it-works') && (
          <EnclaveScreen onNavigate={handleNavigate} />
        )}

        {activeTab === 'planner' && (
          <PlannerScreen
            planData={planData}
            onRecalculateReserve={handleRecalculateReserve}
            onSelectForApproval={(inv) => setSelectedInvoiceForApproval(inv)}
            onNavigate={setActiveTab}
          />
        )}

        {activeTab === 'invoices' && (
          <InvoiceGuardScreen
            inspections={inspections}
            onRegisterInvoice={handleRegisterInvoice}
          />
        )}

        {activeTab === 'voice' && (
          <VoiceGatewayScreen userSession={userSession} />
        )}

        {activeTab === 'audit' && (
          <AuditLedgerScreen />
        )}

        {activeTab === 'admin' && (
          userSession?.authenticated ? (
            <AdminPanel
              userSession={userSession}
              onLogout={handleLogout}
              onRefreshStatus={loadData}
            />
          ) : (
            <div style={{
              maxWidth: '560px',
              margin: '80px auto',
              textAlign: 'center',
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              padding: '40px 32px',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.7)'
            }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '12px',
                background: 'var(--secondary)',
                border: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px auto'
              }}>
                <Lock size={26} color="#fafafa" />
              </div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#fafafa', marginBottom: '8px' }}>
                Admin Portal Access Required
              </h2>
              <p style={{ fontSize: '0.88rem', color: 'var(--muted-foreground)', lineHeight: 1.6, marginBottom: '24px' }}>
                The IntentGate Treasury Admin Console governs liquidity reserve floors, Airwallex multi-currency corridors, ArmorIQ intent assurance policies, and team permissions.
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
                <button
                  onClick={() => setShowOAuthModal(true)}
                  className="btn btn-primary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 24px' }}
                >
                  <Lock size={15} />
                  <span>Authenticate with OAuth</span>
                  <ArrowRight size={15} />
                </button>
              </div>
            </div>
          )
        )}
        </Suspense>
      </main>

      {/* Modals: lazy-loaded in a shared boundary */}
      <Suspense fallback={null}>
      {/* Human Approval Modal */}
      {selectedInvoiceForApproval && (
        <ApprovalModal
          invoice={selectedInvoiceForApproval}
          onClose={() => setSelectedInvoiceForApproval(null)}
          onExecutePayment={handleExecutePayment}
          onTransitionStatus={handleTransitionStatus}
        />
      )}

      {/* Sandbox Keys Modal */}
      {showCredentialsModal && (
        <CredentialsModal
          onClose={() => setShowCredentialsModal(false)}
          onSaveCredentials={handleSaveCredentials}
          currentStatus={systemStatus}
        />
      )}

      {/* OAuth Login Modal */}
      {showOAuthModal && (
        <OAuthModal
          onClose={() => setShowOAuthModal(false)}
          onLoginSuccess={handleOAuthSuccess}
        />
      )}
      </Suspense>

      {/* Global Responsive Footer */}
      <Footer onNavigate={handleNavigate} />
    </div>
  );
}
