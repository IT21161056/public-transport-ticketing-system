import { useState, useCallback, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { 
  Home,
  Login,
  Register,
  Dashboard,
  VerifyOtpPage,
  LocalQrPage,
  TopUpCreditsPage,
  ProfilePage,
  GuestPeriodPage,
  CheckoutPage,
  PaymentPage,
  GuestQrPage,
  GateScannerModal,
  AdminDashboard,
  AdminLogin 
} from './pages';
import { MainLayout, AdminLayout } from './layouts';
import { FlowStepper, NotificationToast } from './components';
import { useAuth, useAdminAuth, useTheme } from './hooks';

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
import { ROUTE_PATHS, ADMIN_PATHS, pathToRoute, homePathFor } from './routes';
import { TicketInspectionPage } from './pages/TicketInspectionPage';
import { ReportsPage } from './pages/ReportsPage';

export function App() {
  const { theme, toggleTheme } = useTheme();
  const {
    user,
    otpData,
    toastCode,
    setToastCode,
    requestOtp,
    verifyOtp,
    completeRegistration,
    logout,
    updateUserState,
  } = useAuth();

  const { adminUser, login: adminLogin, logout: adminLogout } = useAdminAuth();

  const navigate = useNavigate();
  const location = useLocation();

  // Logical route derived from the URL (used for navbar highlighting & guest stepper)
  const currentRoute: AppRoute = pathToRoute(location.pathname);

  // Components still navigate via logical route names; this maps them to URLs.
  const goTo = useCallback(
    (route: AppRoute) => navigate(ROUTE_PATHS[route]),
    [navigate]
  );

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

  // Flow 1 Step 4: Storage & Auto-Recovery
  // Whenever a visitor reopens the portal on their phone, the system checks their Device ID
  // and automatically restores their active QR code and remaining validity time without needing a login.
  useEffect(() => {
    if (!user) {
      const deviceUuid = getOrCreateDeviceUuid();
      tokenApi
        .getActiveGuestPass(deviceUuid)
        .then((activeRes) => {
          if (activeRes.success && activeRes.data) {
            const pass = activeRes.data;
            const days = pass.passTier.includes('7') ? 7 : pass.passTier.includes('3') ? 3 : 1;
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
          }
        })
        .catch(() => {
          const localTokens = getGuestTokens();
          if (localTokens.length > 0) {
            const valid = localTokens.find((t) => new Date(t.expiresAt).getTime() > Date.now());
            if (valid) {
              setActiveGuestToken(valid);
            }
          }
        });
    }
  }, [user]);

  const handleStartGuest = async () => {
    // If active guest pass is already restored, show it immediately
    if (activeGuestToken && new Date(activeGuestToken.expiresAt).getTime() > Date.now()) {
      goTo('guest-qr');
      return;
    }

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
        goTo('guest-qr');
        return;
      }
    } catch {
      // Proceed to guest pass selection
    }

    const session = getOrCreateGuestSession();
    setGuestSession(session);
    goTo('guest-period');
  };

  const handleRequestOtp = async (fullName: string, phone: string, mode: 'register' | 'login') => {
    await requestOtp(fullName, phone, mode);
    goTo('verify-phone');
  };

  const handleLogout = () => {
    logout();
    goTo('home');
  };

  const handleSelectPeriod = (days: AccessDurationDays) => {
    setSelectedDuration(days);
    goTo('guest-checkout');
  };

  const handleProceedToPayment = () => {
    goTo('guest-payment');
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
    goTo('guest-qr');
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

  const toast = (
    <NotificationToast
      otpCode={toastCode}
      phoneNumber={otpData?.phoneNumber}
      onClose={() => setToastCode(null)}
    />
  );

  // Route guards
  const requireAuth = (element: React.ReactElement) =>
    user ? element : <Navigate to={ROUTE_PATHS.login} replace />;

  return (
    <Routes>
      {/* ===== Admin flow: fully separate router tree ===== */}
      <Route
        path={ADMIN_PATHS.login}
        element={
          adminUser ? (
            <Navigate to={ADMIN_PATHS.home} replace />
          ) : (
            <AdminLogin
              onLogin={async (id, pw) => {
                const res = await adminLogin(id, pw);
                if (res.success) navigate(ADMIN_PATHS.home, { replace: true });
                return res;
              }}
            />
          )
        }
      />
      <Route
        path="/admin/*"
        element={
          adminUser ? (
            <AdminLayout
              admin={adminUser}
              onLogout={() => {
                adminLogout();
                navigate(ADMIN_PATHS.login, { replace: true });
              }}
              onOpenScanner={() => handleOpenScanner()}
            >
              <Routes>
                <Route index element={<AdminDashboard user={adminUser} onOpenScanner={() => handleOpenScanner()} />} />
                <Route path="inspection" element={<TicketInspectionPage />} />
                <Route path="reports" element={<ReportsPage />} />
                <Route path="*" element={<Navigate to={ADMIN_PATHS.home} replace />} />
              </Routes>

              {/* Floating Gate Scanner Modal for Admin Test Clearance */}
              {isScannerOpen && (
                <GateScannerModal
                  initialToken={scannerToken}
                  onClose={() => setIsScannerOpen(false)}
                  onScanCompleted={refreshGuestAndTxs}
                />
              )}
            </AdminLayout>
          ) : (
            <Navigate to={ADMIN_PATHS.login} replace />
          )
        }
      />

      {/* Standalone Auth layout routes */}
      <Route
        path={ROUTE_PATHS.login}
        element={
          user ? (
            <Navigate to={homePathFor(user)} replace />
          ) : (
            <>
              {toast}
              <Login
                onNavigate={goTo}
                onRequestOtp={handleRequestOtp}
              />
            </>
          )
        }
      />

      <Route
        path={ROUTE_PATHS.register}
        element={
          user ? (
            <Navigate to={homePathFor(user)} replace />
          ) : (
            <>
              {toast}
              <Register onNavigate={goTo} onRequestOtp={handleRequestOtp} />
            </>
          )
        }
      />

      <Route
        path={ROUTE_PATHS['verify-phone']}
        element={
          otpData ? (
            <>
              {toast}
              <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
                <VerifyOtpPage
                  phoneNumber={otpData.phoneNumber}
                  fullName={otpData.fullName}
                  expectedOtp={otpData.code}
                  mode={otpData.mode}
                  onNavigate={goTo}
                  onVerifySuccess={() => {
                    refreshGuestAndTxs();
                    goTo('dashboard');
                  }}
                  onVerifyCode={async (code: string) => {
                    const res = await verifyOtp(code);
                    if (res.success && otpData.mode === 'login') {
                      refreshGuestAndTxs();
                      goTo('dashboard');
                    }
                    return res;
                  }}
                  onCompleteRegistration={async (phone, name, credit, medium, payMethod) => {
                    const res = await completeRegistration(phone, name, credit, medium, payMethod);
                    if (res.success) {
                      refreshGuestAndTxs();
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
          ) : (
            <Navigate to={user ? homePathFor(user) : ROUTE_PATHS.login} replace />
          )
        }
      />

      {/* Main application shell */}
      <Route
        path="/*"
        element={
          <MainLayout
            currentRoute={currentRoute}
            onNavigate={goTo}
            user={user}
            onLogout={handleLogout}
            theme={theme}
            onToggleTheme={toggleTheme}
          >
            {/* Simulated SMS Notification */}
            {toast}

            {/* Guest Progress Stepper */}
            {currentStepIndex >= 0 && (
              <FlowStepper steps={guestSteps} currentStepIndex={currentStepIndex} />
            )}

            <Routes>
              <Route
                path="/"
                element={
                  <Home
                    onNavigate={goTo}
                    onStartGuest={handleStartGuest}
                    user={user}
                    activeGuestPass={activeGuestToken}
                  />
                }
              />

              <Route
                path={ROUTE_PATHS.dashboard}
                element={requireAuth(
                  <Dashboard
                    user={user!}
                    transactions={transactions}
                    onNavigate={goTo}
                  />
                )}
              />

              {/* Local Commuter Registered Routes */}
              <Route
                path={ROUTE_PATHS['account-qr']}
                element={requireAuth(
                  <LocalQrPage
                    user={user!}
                    onNavigate={goTo}
                  />
                )}
              />

              <Route
                path={ROUTE_PATHS['account-credits']}
                element={requireAuth(
                  <TopUpCreditsPage
                    user={user!}
                    onNavigate={goTo}
                    onUpdateUser={(updated) => {
                      updateUserState(updated);
                      refreshGuestAndTxs();
                    }}
                  />
                )}
              />

              <Route
                path={ROUTE_PATHS.profile}
                element={requireAuth(
                  <ProfilePage
                    user={user!}
                    transactions={transactions}
                    onNavigate={goTo}
                  />
                )}
              />

              {/* Guest Visitor Flows */}
              <Route
                path={ROUTE_PATHS.guest}
                element={
                  activeGuestToken && new Date(activeGuestToken.expiresAt).getTime() > Date.now() ? (
                    <Navigate to={ROUTE_PATHS['guest-qr']} replace />
                  ) : (
                    <Navigate to={ROUTE_PATHS['guest-period']} replace />
                  )
                }
              />

              <Route
                path={ROUTE_PATHS['guest-period']}
                element={
                  <GuestPeriodPage
                    guestSession={guestSession}
                    user={user}
                    onNavigate={goTo}
                    onSelectPeriod={handleSelectPeriod}
                  />
                }
              />

              <Route
                path={ROUTE_PATHS['guest-checkout']}
                element={
                  <CheckoutPage
                    durationDays={selectedDuration}
                    guestSession={guestSession}
                    user={user}
                    onNavigate={goTo}
                    onProceedToPayment={handleProceedToPayment}
                  />
                }
              />

              <Route
                path={ROUTE_PATHS['guest-payment']}
                element={
                  <PaymentPage
                    durationDays={selectedDuration}
                    onNavigate={goTo}
                    onPaymentSuccess={handleGuestPaymentSuccess}
                  />
                }
              />

              <Route
                path={ROUTE_PATHS['guest-qr']}
                element={
                  <GuestQrPage
                    token={
                      activeGuestToken ||
                      guestTokens[0] ||
                      issueGuestToken(guestSession?.guestId || 'GST-DEFAULT', selectedDuration)
                    }
                    onNavigate={goTo}
                  />
                }
              />

              {/* Unknown URLs fall back to home */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </MainLayout>
        }
      />
    </Routes>
  );
}

export default App;
