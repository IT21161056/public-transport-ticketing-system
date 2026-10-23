import React, { useState } from 'react';
import { 
  Menu, 
  Sun, 
  Moon 
} from 'lucide-react';
import type { AppRoute, RegisteredUser } from '../types';
import Navbar from '../components/Navbar';
import CommuterSidebar from '../components/CommuterSidebar';
import { useTheme } from '../hooks/useTheme';

export interface MainLayoutProps {
  children: React.ReactNode;
  currentRoute: AppRoute;
  onNavigate: (route: AppRoute) => void;
  user: RegisteredUser | null;
  onLogout: () => void;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  currentRoute,
  onNavigate,
  user,
  onLogout,
  theme,
  onToggleTheme,
}) => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const hookTheme = useTheme();
  const activeTheme = theme ?? hookTheme.theme;
  const handleToggleTheme = onToggleTheme ?? hookTheme.toggleTheme;

  const getRouteTitle = (route: AppRoute): { title: string; subtitle: string } => {
    switch (route) {
      case 'dashboard':
        return { title: 'Commuter Dashboard', subtitle: 'Live transit pass & quick actions' };
      case 'account-qr':
        return { title: 'Contactless QR Pass', subtitle: 'Dynamic high-speed turnstile gate token' };
      case 'account-credits':
        return { title: 'Transit Wallet & Top-Up', subtitle: 'Manage stored credits & auto-reload' };
      case 'profile':
        return { title: 'Profile & Journey Logs', subtitle: 'Ride history & personal commuter record' };
      case 'guest-period':
      case 'guest-checkout':
      case 'guest-payment':
      case 'guest-qr':
        return { title: 'Visitor Pass', subtitle: 'Temporary contactless metro pass' };
      default:
        return { title: 'UrbanTransit Network', subtitle: 'Metropolitan Public Transit System' };
    }
  };

  const { title, subtitle } = getRouteTitle(currentRoute);

  // ==========================================
  // 1. VISITOR & PUBLIC FLOW: NO SIDEBAR
  // Visitors and public landing/guest wizard routes see only the top navbar and full-width content
  // ==========================================
  const isPublicOrGuestRoute =
    !user ||
    currentRoute === 'home' ||
    currentRoute === 'landing' ||
    currentRoute.startsWith('guest');

  if (isPublicOrGuestRoute) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950">
        <Navbar
          currentRoute={currentRoute}
          onNavigate={onNavigate}
          user={user}
          onLogout={onLogout}
          theme={activeTheme}
          onToggleTheme={handleToggleTheme}
        />

        <main className="flex-1 flex flex-col justify-start px-4 sm:px-6 py-4 max-w-7xl mx-auto w-full">
          {children}
        </main>

        <footer className="border-t border-slate-900 bg-slate-950/80 backdrop-blur-sm py-6 text-center text-xs text-slate-500 mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-400">UrbanTransit</span>
              <span>•</span>
              <span>Minimal-Data Public Transit Protocol</span>
            </div>
            <div className="flex items-center gap-4 text-[11px]">
              <span className="text-emerald-400 font-mono flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Live Grid Active
              </span>
              <span className="text-slate-400">Metropolitan Transit Authority</span>
            </div>
          </div>
        </footer>
      </div>
    );
  }

  // ==========================================
  // 2. REGISTERED COMMUTER / LOCAL USER FLOW: DEDICATED SIDEBAR
  // All navigation options and routes live under the sidebar
  // ==========================================
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col lg:flex-row font-sans selection:bg-cyan-500 selection:text-slate-950">
      {/* Commuter Left Sidebar */}
      <CommuterSidebar
        currentRoute={currentRoute}
        onNavigate={onNavigate}
        user={user}
        onLogout={onLogout}
        theme={activeTheme}
        onToggleTheme={handleToggleTheme}
        isOpenMobile={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col min-h-screen">
        {/* Commuter Top Header Bar */}
        <header className="sticky top-0 z-20 border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-md px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* Mobile Sidebar Hamburger Toggle */}
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 border border-slate-800 cursor-pointer"
              aria-label="Open commuter sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Current Route Breadcrumb & Title */}
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-sm sm:text-base tracking-tight">
                  {title}
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-cyan-950/80 text-cyan-400 border border-cyan-800/60 font-mono">
                  Commuter
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden md:block">
                {subtitle}
              </p>
            </div>
          </div>

          {/* Header Quick Tools */}
          <div className="flex items-center gap-2">
            {/* Theme Toggle */}
            <button
              onClick={handleToggleTheme}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-slate-800 cursor-pointer transition-colors"
              title={activeTheme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
              aria-label="Toggle theme"
            >
              {activeTheme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-indigo-400" />
              )}
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>

        {/* Commuter Minimal Transit Footer */}
        <footer className="border-t border-slate-900/80 bg-slate-950 py-4 px-6 text-xs text-slate-500 mt-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 max-w-7xl mx-auto">
            <span>UrbanTransit FastPass • Minimal Data Commuter Network</span>
            <span className="font-mono text-[11px] text-emerald-400/80 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Live Grid Active
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default MainLayout;
