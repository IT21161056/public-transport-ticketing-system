import React from 'react';
import { 
  Train, 
  LayoutDashboard, 
  QrCode, 
  Coins, 
  User as UserIcon, 
  LogOut, 
  X, 
  Sun, 
  Moon, 
  ShieldCheck, 
  PlusCircle, 
  ChevronRight
} from 'lucide-react';
import type { AppRoute, RegisteredUser } from '../types';

export interface CommuterSidebarProps {
  currentRoute: AppRoute;
  onNavigate: (route: AppRoute) => void;
  user: RegisteredUser;
  onLogout: () => void;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const CommuterSidebar: React.FC<CommuterSidebarProps> = ({
  currentRoute,
  onNavigate,
  user,
  onLogout,
  theme,
  onToggleTheme,
  isOpenMobile = false,
  onCloseMobile,
}) => {
  const handleNav = (route: AppRoute) => {
    onNavigate(route);
    if (onCloseMobile) onCloseMobile();
  };

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpenMobile && onCloseMobile) {
        onCloseMobile();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpenMobile, onCloseMobile]);

  const navItems = [
    {
      id: 'dashboard' as AppRoute,
      label: 'Dashboard',
      description: 'Overview & recent trips',
      icon: LayoutDashboard,
      activeColor: 'text-cyan-400',
      activeBg: 'bg-cyan-500/10 border-cyan-500/30',
    },
    {
      id: 'account-qr' as AppRoute,
      label: 'My QR Pass',
      description: 'Contactless gate code',
      icon: QrCode,
      badge: 'Live',
      badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      activeColor: 'text-emerald-400',
      activeBg: 'bg-emerald-500/10 border-emerald-500/30',
    },
    {
      id: 'account-credits' as AppRoute,
      label: 'Top Up Credits',
      description: 'Wallet reload & cards',
      icon: Coins,
      activeColor: 'text-amber-400',
      activeBg: 'bg-amber-500/10 border-amber-500/30',
    },
    {
      id: 'profile' as AppRoute,
      label: 'Profile & History',
      description: 'Account & ride logs',
      icon: UserIcon,
      activeColor: 'text-indigo-400',
      activeBg: 'bg-indigo-500/10 border-indigo-500/30',
    },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-slate-950/95 border-r border-slate-800/80 backdrop-blur-xl text-slate-100 select-none">
      {/* 1. Brand Logo Header */}
      <div className="px-5 py-4 border-b border-slate-800/80 flex items-center justify-between gap-3">
        <button
          onClick={() => handleNav('dashboard')}
          className="flex items-center gap-3 text-left group focus:outline-none cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform duration-200 border border-cyan-400/30">
            <Train className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-base text-white tracking-tight group-hover:text-cyan-400 transition-colors">
                UrbanTransit
              </span>
              <span className="px-1.5 py-0.2 text-[9px] font-semibold bg-cyan-950 text-cyan-400 border border-cyan-800/50 rounded-md">
                Commuter
              </span>
            </div>
            <p className="text-[10px] text-slate-400">Rapid Contactless Metro</p>
          </div>
        </button>

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

      {/* 2. Transit Wallet Quick Card */}
      <div className="p-3.5 mx-3 my-2.5 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-900/50 border border-slate-800/80 shadow-md shrink-0">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Transit Wallet
          </span>
          <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            Active
          </span>
        </div>
        <div className="text-xl font-bold font-mono text-white tracking-tight">
          {(user.creditBalance ?? 0).toFixed(2)}{' '}
          <span className="text-xs font-sans text-cyan-400 font-semibold">Credits</span>
        </div>
        <button
          onClick={() => handleNav('account-credits')}
          className="mt-2 w-full py-1.5 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>Top Up Credits</span>
        </button>
      </div>

      {/* 3. Navigation Links List */}
      <div className="flex-1 min-h-0 overflow-y-auto px-3 space-y-1 py-1">
        <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
          Navigation
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentRoute === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNav(item.id)}
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
                      ? 'bg-slate-900 text-cyan-400'
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
      </div>

      {/* 4. Footer: User Identity & Controls */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/90 space-y-2 shrink-0">
        {/* User Identity Pill */}
        <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-900/60 border border-slate-800/70">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-sm border border-cyan-400/30">
              {user.fullName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 text-left leading-tight">
              <div className="text-xs font-semibold text-white truncate">{user.fullName}</div>
              <div className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                <ShieldCheck className="w-2.5 h-2.5 text-emerald-400" />
                <span>Verified</span>
              </div>
            </div>
          </div>

          {/* Theme Toggle */}
          {onToggleTheme && (
            <button
              onClick={onToggleTheme}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800 cursor-pointer"
              title={theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}
            >
              {theme === 'dark' ? (
                <Sun className="w-3.5 h-3.5 text-amber-400" />
              ) : (
                <Moon className="w-3.5 h-3.5 text-indigo-400" />
              )}
            </button>
          )}
        </div>

        {/* Sign Out Button */}
        <button
          onClick={() => {
            if (onCloseMobile) onCloseMobile();
            onLogout();
          }}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold text-rose-300 bg-rose-950/30 hover:bg-rose-950/60 border border-rose-900/40 hover:border-rose-800 transition-colors cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
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
          aria-label="Commuter navigation menu"
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

export default CommuterSidebar;
