import React, { useState, useEffect, Suspense, lazy } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import OverviewScreen from './components/OverviewScreen';
import PlannerScreen from './components/PlannerScreen';
import InvoiceGuardScreen from './components/InvoiceGuardScreen';
import AuditLedgerScreen from './components/AuditLedgerScreen';
import AdminPanel from './components/AdminPanel';
import VoiceGatewayScreen from './components/VoiceGatewayScreen';
import EnclaveScreen from './components/EnclaveScreen';
import ApprovalModal from './components/ApprovalModal';
import CredentialsModal from './components/CredentialsModal';
import OAuthModal from './components/OAuthModal';
import JudgeExplainerModal from './components/JudgeExplainerModal';
import { Lock, Shield, ArrowRight } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [systemStatus, setSystemStatus] = useState(null);
  const [planData, setPlanData] = useState(null);
  const [inspections, setInspections] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedInvoiceForApproval, setSelectedInvoiceForApproval] = useState(null);
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [showOAuthModal, setShowOAuthModal] = useState(false);
  const [showJudgeExplainer, setShowJudgeExplainer] = useState(false);
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
      const res = await fetch('/api/auth/session');
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
  }, []);

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

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar
        systemStatus={systemStatus}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenCredentials={() => setShowCredentialsModal(true)}
        onSelectScenario={handleSelectScenario}
        isRefreshing={isRefreshing}
        onRefresh={loadData}
        userSession={userSession}
        onOpenOAuth={() => setShowOAuthModal(true)}
        onLogout={handleLogout}
        onOpenJudgeExplainer={() => setShowJudgeExplainer(true)}
      />

      <main style={{ maxWidth: '1440px', width: '100%', margin: '0 auto', padding: '24px', flex: 1 }}>
        {activeTab === 'overview' && (
          <OverviewScreen
            planData={planData}
            systemStatus={systemStatus}
            onNavigate={setActiveTab}
            onSimulateDeposit={handleSimulateDeposit}
          />
        )}

        {activeTab === 'enclave' && (
          <EnclaveScreen />
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
                The FlowGuard Treasury Admin Console governs liquidity reserve floors, Airwallex multi-currency corridors, ArmorIQ intent assurance policies, and team permissions.
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
      </main>

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

      {/* Judge Explainer & Veo 3 Video Suite Modal */}
      {showJudgeExplainer && (
        <JudgeExplainerModal
          onClose={() => setShowJudgeExplainer(false)}
          onSelectScenario={handleSelectScenario}
          activeScenario={systemStatus?.activeScenario}
        />
      )}

      {/* Global Responsive Footer */}
      <Footer onNavigate={setActiveTab} />
    </div>
  );
}
