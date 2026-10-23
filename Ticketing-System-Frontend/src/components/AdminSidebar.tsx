import React from 'react';
import { 
  Shield, 
  LayoutDashboard,
  LogOut,
  X, 
  ChevronRight, 
  Server,
  Activity
} from 'lucide-react';
import type { RegisteredUser } from '../types';
import { useLocation, useNavigate } from 'react-router-dom';
import { ScanLine, Bus } from 'lucide-react';
import { BarChart3 } from 'lucide-react';

export type AdminTab = 'overview' | 'users' | 'journeys' | 'passes';

export interface AdminSidebarProps {
  currentTab: AdminTab;
  onSelectTab: (tab: AdminTab) => void;
  admin: RegisteredUser;
  onLogout: () => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  currentTab,
  onSelectTab,
  admin,
  onLogout,
  isOpenMobile = false,
  onCloseMobile,
}) => {
  const handleSelect = (tab: AdminTab) => {
    onSelectTab(tab);
    if (onCloseMobile) onCloseMobile();
  };

  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isInspectionActive = pathname === '/admin/inspection';
  const isReaderActive = pathname === '/admin/reader';
  const isReportsActive = pathname === '/admin/reports';

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpenMobile && onCloseMobile) {
        onCloseMobile();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpenMobile, onCloseMobile]);

  // Users / Journeys / Passes stay reachable through the tab bar on the dashboard itself
  const menuItems: {
    id: AdminTab;
    label: string;
    description: string;
    icon: typeof LayoutDashboard;
    activeColor: string;
    activeBg: string;
    badge?: string;
    badgeColor?: string;
  }[] = [
    {
      id: 'overview' as AdminTab,
      label: 'Operations Overview',
      description: 'KPI metrics & revenue float',
      icon: LayoutDashboard,
      activeColor: 'text-purple-400',
      activeBg: 'bg-purple-500/10 border-purple-500/30',
    },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-slate-950/95 border-r border-slate-800/80 backdrop-blur-xl text-slate-100 select-none">
      {/* 1. Header & Branding */}
      <div className="px-5 py-4 border-b border-slate-800/80 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-950/40 border border-purple-500/30">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-base text-white tracking-tight">UrbanTransit</span>
              <span className="px-1.5 py-0.2 text-[9px] font-semibold bg-purple-950 text-purple-300 border border-purple-800/60 rounded-md">
                Admin
              </span>
            </div>
            <p className="text-[10px] text-slate-400">Operations Command Center</p>
          </div>
        </div>

        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 border border-slate-800"
            aria-label="Close sidebar"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* 2. Live Grid Status Chip */}
      <div className="px-4 py-3 mx-3 my-3 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-[11px] font-medium text-slate-300">Live Grid Engine</span>
        </div>
        <span className="text-[10px] font-mono text-emerald-400 font-semibold bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-800/40">
          Connected
        </span>
      </div>

      {/* 3. Navigation Items */}
      <div className="flex-1 min-h-0 overflow-y-auto px-3 space-y-1 py-1">
        <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
          Operations
        </div>

        {menuItems.map((item) => {
          const Icon = item.icon;
          // Dashboard tabs only count as active on the dashboard itself, not on /admin/inspection, /admin/reader or /admin/reports
          const isActive = currentTab === item.id && (pathname === '/admin' || pathname === '/admin/');
          return (
            <button
              key={item.id}
              onClick={() => handleSelect(item.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all group cursor-pointer border ${
                isActive
                  ? `${item.activeBg} text-white shadow-sm font-semibold`
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/70'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                    isActive
                      ? 'bg-slate-900 text-purple-400'
                      : 'bg-slate-900/60 text-slate-400 group-hover:text-slate-200'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? item.activeColor : ''}`} />
                </div>
                <div className="text-left leading-tight">
                  <div className="font-semibold">{item.label}</div>
                  <div className="text-[10px] text-slate-500 group-hover:text-slate-400">
                    {item.description}
                  </div>
                </div>
              </div>

              {item.badge ? (
                <span
                  className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-semibold border ${item.badgeColor}`}
                >
                  {item.badge}
                </span>
              ) : (
                <ChevronRight
                  className={`w-3.5 h-3.5 text-slate-600 transition-transform group-hover:translate-x-0.5 ${
                    isActive ? 'text-slate-400' : ''
                  }`}
                />
              )}
            </button>
          );
        })}


        {/* Section: Field Operations (Ticket Inspector) */}
        <div className="pt-2">
          <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Field Operations
          </div>
          <button
            onClick={() => {
              if (onCloseMobile) onCloseMobile();
              navigate('/admin/inspection');
            }}
            aria-current={isInspectionActive ? 'page' : undefined}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer border ${
              isInspectionActive
                ? 'bg-amber-500/10 border-amber-500/30 text-white font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/70'
            }`}
          >
            <div className="w-7 h-7 rounded-lg bg-slate-900/60 flex items-center justify-center text-amber-400">
              <ScanLine className="w-3.5 h-3.5" />
            </div>
            <div className="text-left leading-tight">
              <div className="font-semibold">Ticket Inspection</div>
              <div className="text-[10px] text-slate-500">Scan passenger QR tokens</div>
            </div>
          </button>
          <button
            onClick={() => {
              if (onCloseMobile) onCloseMobile();
              navigate('/admin/reader');
            }}
            aria-current={isReaderActive ? 'page' : undefined}
            className={`mt-1 w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer border ${
              isReaderActive
                ? 'bg-emerald-500/10 border-emerald-500/30 text-slate-100 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/70'
            }`}
          >
            <div className="w-7 h-7 rounded-lg bg-slate-900/60 flex items-center justify-center text-emerald-400">
              <Bus className="w-3.5 h-3.5" />
            </div>
            <div className="text-left leading-tight">
              <div className="font-semibold">Bus Boarding Reader</div>
              <div className="text-[10px] text-slate-500">Tap in / tap out & fares</div>
            </div>
          </button>
        </div>

        {/* Section: Management (Manager Reports) */}
        <div className="pt-2">
          <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Management
          </div>
          <button
            onClick={() => {
              if (onCloseMobile) onCloseMobile();
              navigate('/admin/reports');
            }}
            aria-current={isReportsActive ? 'page' : undefined}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer border ${
              isReportsActive
                ? 'bg-purple-500/10 border-purple-500/30 text-white font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/70'
            }`}
          >
            <div className="w-7 h-7 rounded-lg bg-slate-900/60 flex items-center justify-center text-purple-400">
              <BarChart3 className="w-3.5 h-3.5" />
            </div>
            <div className="text-left leading-tight">
              <div className="font-semibold">Manager Reports</div>
              <div className="text-[10px] text-slate-500">Ridership, revenue & evasion</div>
            </div>
          </button>
        </div>

        {/* Section: System Metadata Card */}
        <div className="pt-3 px-2">
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-900 text-[11px] text-slate-400 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[10px] uppercase font-semibold text-slate-500">
                <Server className="w-3 h-3" /> Core Server
              </span>
              <span className="font-mono text-[10px] text-slate-300">.NET 10 API</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[10px] uppercase font-semibold text-slate-500">
                <Activity className="w-3 h-3" /> Security
              </span>
              <span className="font-mono text-[10px] text-purple-300">Bearer Guard</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Footer: Administrator Identity & Sign Out */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/90 space-y-2 shrink-0">
        <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-900/60 border border-slate-800/70">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-sm border border-purple-400/30">
              {admin.fullName ? admin.fullName.charAt(0).toUpperCase() : 'A'}
            </div>
            <div className="min-w-0 text-left leading-tight">
              <div className="text-xs font-semibold text-white truncate">{admin.fullName}</div>
              <div className="text-[10px] font-mono text-purple-300 truncate">
                {admin.userName || admin.email}
              </div>
            </div>
          </div>
          <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
            Admin
          </span>
        </div>

        <button
          onClick={() => {
            if (onCloseMobile) onCloseMobile();
            onLogout();
          }}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold text-rose-300 bg-rose-950/30 hover:bg-rose-950/60 border border-rose-900/40 hover:border-rose-800 transition-colors cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out Admin</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (Permanent) */}
      <aside className="hidden lg:block w-64 xl:w-72 shrink-0 h-screen sticky top-0 z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer (Collapsible) */}
      {isOpenMobile && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Administrator navigation menu"
          className="lg:hidden fixed inset-0 z-50 flex"
        >
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
            onClick={onCloseMobile}
          />
          {/* Drawer content */}
          <div className="relative w-72 max-w-[85vw] h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};

export default AdminSidebar;
