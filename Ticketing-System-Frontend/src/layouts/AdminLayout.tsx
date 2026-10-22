import React, { useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Shield, Menu } from 'lucide-react';
import type { RegisteredUser } from '../types';
import AdminSidebar, { type AdminTab } from '../components/AdminSidebar';

export interface AdminLayoutProps {
  admin: RegisteredUser;
  onLogout: () => void;
  onOpenScanner?: () => void;
  children: React.ReactNode;
}

/**
 * Enterprise Operations Shell for /admin/* pages.
 * Features a dedicated Administrator Sidebar with options for
 * Operations Overview, Commuter Management, Turnstile Journeys,
 * Guest Passes Fleet, and Gate Simulator.
 */
export const AdminLayout: React.FC<AdminLayoutProps> = ({
  admin,
  onLogout,
  onOpenScanner,
  children,
}) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { pathname } = useLocation();

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
        onOpenScanner={onOpenScanner}
        isOpenMobile={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col min-h-screen">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-20 border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-md px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* Mobile Sidebar Hamburger Toggle */}
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 border border-slate-800 cursor-pointer"
              aria-label="Open sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Current View Title */}
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-sm sm:text-base tracking-tight">
                  {getTabTitle(currentTab)}
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-950/80 text-purple-300 border border-purple-800/60 font-mono">
                  Admin
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden md:block">
                Metropolitan Public Transit Network Operations
              </p>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-2.5">
            {/* Admin Profile Pill */}
            <div className="flex items-center gap-2 pl-2 text-right leading-tight">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-xs font-bold text-white shadow-sm border border-purple-500/30">
                <Shield className="w-4 h-4" />
              </div>
              <div className="text-left hidden sm:block">
                <div className="text-xs font-semibold text-white truncate max-w-[130px]">
                  {admin.fullName}
                </div>
                <div className="text-[10px] font-mono text-purple-300">
                  {admin.userName || 'Administrator'}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>

        {/* Admin Minimal Footer */}
        <footer className="border-t border-slate-900/80 bg-slate-950 py-4 px-6 text-xs text-slate-500 mt-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 max-w-7xl mx-auto">
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
