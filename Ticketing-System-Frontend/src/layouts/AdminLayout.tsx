import React, { useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Menu, Sun, Moon } from 'lucide-react';
import type { RegisteredUser } from '../types';
import AdminSidebar, { type AdminTab } from '../components/AdminSidebar';
import { useTheme } from '../hooks/useTheme';

export interface AdminLayoutProps {
  admin: RegisteredUser;
  onLogout: () => void;
  children: React.ReactNode;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
}

/**
 * Enterprise Operations Shell for /admin/* pages.
 * Features a dedicated Administrator Sidebar with options for
 * Operations Overview, Commuter Management, Turnstile Journeys,
 * Guest Passes Fleet, Ticket Inspection, Boarding Reader, and Reports.
 */
export const AdminLayout: React.FC<AdminLayoutProps> = ({
  admin,
  onLogout,
  children,
  theme,
  onToggleTheme,
}) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const hookTheme = useTheme();
  const activeTheme = theme ?? hookTheme.theme;
  const handleToggleTheme = onToggleTheme ?? hookTheme.toggleTheme;

  const currentTab: AdminTab = (searchParams.get('tab') as AdminTab) || 'overview';

  // Dashboard tabs live on /admin, so selecting one from another admin page goes back there
  const handleSelectTab = (tab: AdminTab) => {
    navigate({ pathname: '/admin', search: `?tab=${tab}` });
  };

  const getTabTitle = (tab: AdminTab) => {
    if (pathname === '/admin/inspection') return 'Ticket Inspection';
    if (pathname === '/admin/reader') return 'Bus Boarding Reader';
    if (pathname === '/admin/reports') return 'Manager Reports';
    switch (tab) {
      case 'users':
        return 'Commuter & Account Management';
      case 'journeys':
        return 'Turnstile Journey Stream';
      case 'passes':
        return 'Guest Passes Fleet';
      case 'overview':
      default:
        return 'Operations Command Center';
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col lg:flex-row font-sans selection:bg-purple-600 selection:text-white">
      {/* Administrator Left Sidebar */}
      <AdminSidebar
        currentTab={currentTab}
        onSelectTab={handleSelectTab}
        admin={admin}
        onLogout={onLogout}
        isOpenMobile={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col min-h-screen">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-20 border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-md px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4 w-full">
          <div className="flex items-center gap-3">
            {/* Mobile Sidebar Hamburger Toggle */}
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 border border-slate-800 cursor-pointer"
              aria-label="Open sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Breadcrumb & Current View Title */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 hidden sm:inline">
                UrbanTransit
              </span>
              <span className="text-slate-600 hidden sm:inline">/</span>
              <span className="font-bold text-white text-sm sm:text-base tracking-tight">
                {getTabTitle(currentTab)}
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-950/80 text-purple-300 border border-purple-800/60 font-mono">
                Admin
              </span>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-3">
            {/* Live Grid Status Chip */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/80 border border-slate-800 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-slate-300 font-medium text-[11px]">Live Grid</span>
              <span className="text-emerald-400 text-[10px] font-mono font-semibold">Online</span>
            </div>

            {/* Theme Selector Toggle */}
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

        {/* Page Content - constrained to max-w-6xl matching normal user pages */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <div className="max-w-6xl mx-auto w-full space-y-6">
            {children}
          </div>
        </main>

        {/* Admin Minimal Footer */}
        <footer className="border-t border-slate-900/80 bg-slate-950 py-4 px-4 sm:px-6 lg:px-8 text-xs text-slate-500 mt-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 max-w-6xl mx-auto w-full">
            <span>UrbanTransit Authority Admin Console • System v2.6</span>
            <span className="font-mono text-[11px] text-purple-400/80">
              Session Authenticated via JWT Bearer
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default AdminLayout;
