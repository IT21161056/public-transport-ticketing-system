import { useState, useEffect } from 'react';
import { MainLayout } from './layouts/MainLayout';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { FlowStepper } from './components/FlowStepper';
import { NotificationToast } from './components/NotificationToast';
import { VerifyOtpPage } from './pages/VerifyOtpPage';
import { LocalQrPage } from './pages/LocalQrPage';
import { TopUpCreditsPage } from './pages/TopUpCreditsPage';
import { ProfilePage } from './pages/ProfilePage';
import { GuestPeriodPage } from './pages/GuestPeriodPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { PaymentPage } from './pages/PaymentPage';
import { GuestQrPage } from './pages/GuestQrPage';
import { GateScannerModal } from './pages/GateScannerModal';

import type { 
  AppRoute, 
  AccessDurationDays, 
  GuestSession, 
  GuestTransportToken,
  CreditTransaction 
} from './types';
import { 
  getGuestTokens,
  getTransactions,
  issueGuestToken, 
  getOrCreateGuestSession,
  DURATION_OPTIONS 
} from './utils/storage';
import { getOrCreateDeviceUuid } from './utils/deviceUuid';
import { tokenApi } from './api/tokenApi';
import { useAuth } from './hooks/useAuth';
import { useTheme } from './hooks/useTheme';

export function App() {
  const { theme, toggleTheme } = useTheme();
  const {
    user,
    otpData,
    toastCode,
    setToastCode,
    requestOtp,
    verifyOtp,
    logout,
    updateUserState,
  } = useAuth();

  const [currentRoute, setCurrentRoute] = useState<AppRoute>('home');
  const [guestSession, setGuestSession] = useState<GuestSession | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<AccessDurationDays>(3);
  const [guestTokens, setGuestTokens] = useState<GuestTransportToken[]>(() => getGuestTokens());
  const [activeGuestToken, setActiveGuestToken] = useState<GuestTransportToken | null>(null);
  const [transactions, setTransactions] = useState<CreditTransaction[]>(() => getTransactions());
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannerToken, setScannerToken] = useState<string>('');

  const refreshGuestAndTxs = () => {
    setGuestTokens(getGuestTokens());
    setTransactions(getTransactions());
  };

  // When user is authenticated on initial load or change, route to dashboard if at login or register
  useEffect(() => {
    if (user && (currentRoute === 'login' || currentRoute === 'register')) {
      setCurrentRoute('dashboard');
    }
  }, [user, currentRoute]);

  const handleStartGuest = async () => {
    const deviceUuid = getOrCreateDeviceUuid();
    try {
      const activeRes = await tokenApi.getActiveGuestPass(deviceUuid);
      if (activeRes.success && activeRes.data) {
        const pass = activeRes.data;
        const days = pass.passTier.includes('7') ? 7 : (pass.passTier.includes('3') ? 3 : 1);
        const guestTok: GuestTransportToken = {
          tokenId: pass.signedToken,
          guestId: pass.deviceUuid,
          orderId: `ORD-${pass.id.slice(0, 8)}`,
          days: days as AccessDurationDays,
          durationLabel: pass.passTier,
          price: 0,
          issuedAt: new Date().toISOString(),
          startsAt: new Date().toISOString(),
          expiresAt: pass.expiresAtUtc,
          status: 'active',
          scanCount: 0,
          signedToken: pass.signedToken,
        };
        setActiveGuestToken(guestTok);
        setCurrentRoute('guest-qr');
        return;
      }
    } catch {
      // Proceed to guest pass selection
    }

    const session = getOrCreateGuestSession();
    setGuestSession(session);
    setCurrentRoute('guest-period');
  };

  const handleRequestOtp = async (fullName: string, phone: string, mode: 'register' | 'login') => {
    await requestOtp(fullName, phone, mode);
    setCurrentRoute('verify-phone');
  };

  const handleLogout = () => {
    logout();
    setCurrentRoute('home');
  };

  const handleSelectPeriod = (days: AccessDurationDays) => {
    setSelectedDuration(days);
    setCurrentRoute('guest-checkout');
  };

  const handleProceedToPayment = () => {
    setCurrentRoute('guest-payment');
  };

  const handleGuestPaymentSuccess = async () => {
    const deviceUuid = getOrCreateDeviceUuid();
    const session = guestSession || getOrCreateGuestSession();
    const tierLabel = `${selectedDuration}-Day`;
    const option = DURATION_OPTIONS.find((o) => o.days === selectedDuration);
    const amount = option?.price || 0;

    let signedTokenStr = '';
    try {
      const res = await tokenApi.purchaseGuestPass(deviceUuid, tierLabel, amount);
      if (res.success && res.data) {
        signedTokenStr = res.data.token;
      }
    } catch (e) {
      console.warn('Backend guest pass purchase failed, falling back to local simulation', e);
    }

    const token = issueGuestToken(session.guestId, selectedDuration, signedTokenStr);
    refreshGuestAndTxs();
    setActiveGuestToken(token);
    setCurrentRoute('guest-qr');
  };

  const handleOpenScanner = (token?: string) => {
    setScannerToken(token || user?.persistentQrToken || 'MET-SAMPLE-TOKEN');
    setIsScannerOpen(true);
  };

  // Stepper progress for guest flow
  const guestSteps = [
    { id: '1', label: 'Duration' },
    { id: '2', label: 'Review' },
    { id: '3', label: 'Payment' },
    { id: '4', label: 'Guest QR' },
  ];

  let currentStepIndex = -1;
  if (currentRoute === 'guest-period') currentStepIndex = 0;
  if (currentRoute === 'guest-checkout') currentStepIndex = 1;
  if (currentRoute === 'guest-payment') currentStepIndex = 2;
  if (currentRoute === 'guest-qr') currentStepIndex = 3;

  // Standalone Auth layout routes
  if (currentRoute === 'login') {
    return (
      <>
        <NotificationToast
          otpCode={toastCode}
          phoneNumber={otpData?.phoneNumber}
          onClose={() => setToastCode(null)}
        />
        <Login onNavigate={setCurrentRoute} onRequestOtp={handleRequestOtp} />
      </>
    );
  }

  if (currentRoute === 'register') {
    return (
      <>
        <NotificationToast
          otpCode={toastCode}
          phoneNumber={otpData?.phoneNumber}
          onClose={() => setToastCode(null)}
        />
        <Register onNavigate={setCurrentRoute} onRequestOtp={handleRequestOtp} />
      </>
    );
  }

  if (currentRoute === 'verify-phone' && otpData) {
    return (
      <>
        <NotificationToast
          otpCode={toastCode}
          phoneNumber={otpData?.phoneNumber}
          onClose={() => setToastCode(null)}
        />
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
          <VerifyOtpPage
            phoneNumber={otpData.phoneNumber}
            fullName={otpData.fullName}
            expectedOtp={otpData.code}
            mode={otpData.mode}
            onNavigate={setCurrentRoute}
            onVerifySuccess={() => {
              refreshGuestAndTxs();
              setCurrentRoute('dashboard');
            }}
            onVerifyCode={async (code: string) => {
              const res = await verifyOtp(code);
              if (res.success) {
                refreshGuestAndTxs();
                setCurrentRoute('dashboard');
              }
              return res;
            }}
            onResendOtp={async () => {
              if (otpData) {
                await requestOtp(otpData.fullName, otpData.phoneNumber, otpData.mode);
              }
            }}
          />
        </div>
      </>
    );
  }

  return (
    <MainLayout
      currentRoute={currentRoute}
      onNavigate={setCurrentRoute}
      user={user}
      onLogout={handleLogout}
      onOpenScanner={() => handleOpenScanner()}
      theme={theme}
      onToggleTheme={toggleTheme}
    >
      {/* Simulated SMS Notification */}
      <NotificationToast
        otpCode={toastCode}
        phoneNumber={otpData?.phoneNumber}
        onClose={() => setToastCode(null)}
      />

      {/* Guest Progress Stepper */}
      {currentStepIndex >= 0 && (
        <FlowStepper steps={guestSteps} currentStepIndex={currentStepIndex} />
      )}

      {/* Core Pages */}
      {(currentRoute === 'home' || currentRoute === 'landing') && (
        <Home
          onNavigate={setCurrentRoute}
          onStartGuest={handleStartGuest}
          user={user}
          onOpenScanner={() => handleOpenScanner()}
        />
      )}

      {currentRoute === 'dashboard' && user && (
        <Dashboard
          user={user}
          transactions={transactions}
          onNavigate={setCurrentRoute}
          onOpenScanner={handleOpenScanner}
        />
      )}

      {/* Local Commuter Registered Routes */}
      {currentRoute === 'account-qr' && user && (
        <LocalQrPage
          user={user}
          onNavigate={setCurrentRoute}
          onOpenScanner={handleOpenScanner}
        />
      )}

      {currentRoute === 'account-credits' && user && (
        <TopUpCreditsPage
          user={user}
          onNavigate={setCurrentRoute}
          onUpdateUser={(updated) => {
            updateUserState(updated);
            refreshGuestAndTxs();
          }}
        />
      )}

      {currentRoute === 'profile' && user && (
        <ProfilePage
          user={user}
          transactions={transactions}
          onNavigate={setCurrentRoute}
          onOpenScanner={handleOpenScanner}
        />
      )}

      {/* Guest Visitor Flows */}
      {currentRoute === 'guest-period' && (
        <GuestPeriodPage
          guestSession={guestSession}
          user={user}
          onNavigate={setCurrentRoute}
          onSelectPeriod={handleSelectPeriod}
        />
      )}

      {currentRoute === 'guest-checkout' && (
        <CheckoutPage
          durationDays={selectedDuration}
          guestSession={guestSession}
          user={user}
          onNavigate={setCurrentRoute}
          onProceedToPayment={handleProceedToPayment}
        />
      )}

      {currentRoute === 'guest-payment' && (
        <PaymentPage
          durationDays={selectedDuration}
          onNavigate={setCurrentRoute}
          onPaymentSuccess={handleGuestPaymentSuccess}
        />
      )}

      {currentRoute === 'guest-qr' && (
        <GuestQrPage
          token={
            activeGuestToken ||
            guestTokens[0] ||
            issueGuestToken(guestSession?.guestId || 'GST-DEFAULT', selectedDuration)
          }
          onNavigate={setCurrentRoute}
          onOpenScanner={handleOpenScanner}
        />
      )}

      {/* Gate Turnstile Scanner View */}
      {currentRoute === 'scanner' && (
        <div className="py-6">
          <GateScannerModal
            initialToken={scannerToken}
            onClose={() => setCurrentRoute(user ? 'dashboard' : 'home')}
            onScanCompleted={refreshGuestAndTxs}
          />
        </div>
      )}

      {/* Floating Scanner Modal */}
      {isScannerOpen && (
        <GateScannerModal
          initialToken={scannerToken}
          onClose={() => setIsScannerOpen(false)}
          onScanCompleted={refreshGuestAndTxs}
        />
      )}
    </MainLayout>
  );
}

export default App;
