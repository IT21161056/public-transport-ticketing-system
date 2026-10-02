import React, { useState, useRef, useEffect } from 'react';
import { 
  Train, 
  QrCode, 
  User as UserIcon, 
  LogOut, 
  Menu, 
  X, 
  Sparkles, 
  LayoutDashboard,
  Sun,
  Moon,
  ChevronDown,
  Radio,
  ShieldCheck,
  PlusCircle
} from 'lucide-react';
import type { AppRoute, RegisteredUser } from '../types';
import Button from './Button';
import { useTheme } from '../hooks/useTheme';

export interface NavbarProps {
  currentRoute: AppRoute;
  onNavigate: (route: AppRoute) => void;
  user: RegisteredUser | null;
  onLogout: () => void;
  onOpenScanner?: () => void;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRoute,
  onNavigate,
  user,
  onLogout,
  onOpenScanner,
  theme,
  onToggleTheme,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const hookTheme = useTheme();
  const activeTheme = theme ?? hookTheme.theme;
  const handleToggleTheme = onToggleTheme ?? hookTheme.toggleTheme;

  // Handle outside click for user dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    if (userMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [userMenuOpen]);

  const handleNav = (route: AppRoute) => {
    onNavigate(route);
    setMobileMenuOpen(false);
    setUserMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-md transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <button
          onClick={() => handleNav(user ? 'dashboard' : 'home')}
          className="flex items-center gap-3 text-left group focus:outline-none shrink-0"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform duration-200 border border-cyan-400/30">
            <Train className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg text-white tracking-tight group-hover:text-cyan-400 transition-colors">
                UrbanTransit
              </span>
              <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-cyan-950 text-cyan-400 border border-cyan-800/50 rounded-md">
                FastPass
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Rapid Metro & Bus Contactless QR
            </p>
          </div>
        </button>

        {/* Center Primary Navigation Links (Desktop) */}
        {user && (
          <nav className="hidden md:flex items-center gap-1.5">
            <button
              onClick={() => handleNav('dashboard')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-sm font-medium transition-all ${
                currentRoute === 'dashboard'
                  ? 'bg-slate-800/90 text-cyan-400 shadow-sm border border-slate-700/60'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900/80'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 text-cyan-400" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => handleNav('account-qr')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-sm font-medium transition-all ${
                currentRoute === 'account-qr'
                  ? 'bg-slate-800/90 text-cyan-400 shadow-sm border border-slate-700/60'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900/80'
              }`}
            >
              <QrCode className="w-4 h-4 text-emerald-400" />
              <span>My QR Pass</span>
            </button>
          </nav>
        )}

        {/* Right Utility & Account Hub (Desktop) */}
        <div className="hidden md:flex items-center gap-2.5">
          {/* Turnstile Gate Simulator Badge Button */}
          {onOpenScanner && (
            <button
              onClick={onOpenScanner}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-950/60 hover:bg-cyan-900/70 border border-cyan-800/60 hover:border-cyan-700 text-cyan-300 text-xs font-mono font-medium transition-all shadow-sm active:scale-95 cursor-pointer"
              title="Simulate Turnstile Gate Tap"
            >
              <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              <span>Gate Simulator</span>
            </button>
          )}

          {/* Theme Toggle Button */}
          <button
            onClick={handleToggleTheme}
            title={activeTheme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
            aria-label="Toggle theme"
            className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 transition-all border border-slate-800 hover:border-slate-700 cursor-pointer shadow-sm active:scale-95"
          >
            {activeTheme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400 hover:rotate-45 transition-transform duration-300" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-500 hover:-rotate-12 transition-transform duration-300" />
            )}
          </button>

          {/* User Account Pill with Dropdown Menu */}
          {user ? (
            <div className="relative pl-1 border-l border-slate-800" ref={userMenuRef}>
              <button
                onClick={() => setUserMenuOpen((prev) => !prev)}
                className={`flex items-center gap-2.5 p-1 pl-1.5 pr-2.5 rounded-2xl border transition-all cursor-pointer shadow-sm active:scale-[0.98] ${
                  userMenuOpen
                    ? 'bg-slate-800/90 border-slate-700 ring-2 ring-cyan-500/20'
                    : 'bg-slate-900/90 hover:bg-slate-800/80 border-slate-800 hover:border-slate-700'
                }`}
                aria-expanded={userMenuOpen}
                aria-haspopup="true"
              >
                {/* Initials Avatar */}
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-600 flex items-center justify-center text-xs font-bold text-white shadow-sm shadow-cyan-500/20 border border-cyan-400/30 shrink-0">
                  {user.fullName.charAt(0).toUpperCase()}
                </div>

                {/* Name and Credit Balance */}
                <div className="flex flex-col text-left leading-tight">
                  <span className="text-xs font-semibold text-white truncate max-w-[120px]">
                    {user.fullName}
                  </span>
                  <span className="text-[11px] font-mono text-cyan-400 font-medium">
                    {(user.creditBalance ?? 0).toFixed(2)} Credits
                  </span>
                </div>

                <ChevronDown 
                  className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                    userMenuOpen ? 'rotate-180 text-cyan-400' : ''
                  }`} 
                />
              </button>

              {/* Dropdown Menu Panel */}
              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-slate-900/95 border border-slate-800 shadow-2xl backdrop-blur-xl py-2 z-50 divide-y divide-slate-800/80 animate-in fade-in zoom-in-95 duration-150">
                  {/* Header / Identity Info */}
                  <div className="px-4 py-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-white truncate">{user.fullName}</span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <ShieldCheck className="w-3 h-3" />
                        Verified
                      </span>
                    </div>
                    <p className="text-[11px] font-mono text-slate-400 mt-0.5">{user.phoneNumber}</p>
                    <p className="text-[10px] font-mono text-slate-500">Commuter ID: {user.userId}</p>
                  </div>

                  {/* Wallet Balance & Instant Top Up Card */}
                  <div className="p-3 bg-slate-950/60 mx-2 my-1 rounded-xl border border-slate-800/70">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                        Transit Wallet
                      </span>
                      <span className="text-xs font-mono font-bold text-emerald-400">
                        {(user.creditBalance ?? 0).toFixed(2)} Credits
                      </span>
                    </div>
                    <button
                      onClick={() => handleNav('account-credits')}
                      className="w-full py-1.5 px-3 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>Top Up Credits</span>
                    </button>
                  </div>

                  {/* Quick Navigation Items */}
                  <div className="py-1">
                    <button
                      onClick={() => handleNav('profile')}
                      className={`w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium transition-colors text-left ${
                        currentRoute === 'profile'
                          ? 'bg-slate-800 text-cyan-400'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                      }`}
                    >
                      <UserIcon className="w-4 h-4 text-indigo-400" />
                      <span>Profile & Ride History</span>
                    </button>

                    <button
                      onClick={() => handleNav('account-qr')}
                      className={`w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium transition-colors text-left ${
                        currentRoute === 'account-qr'
                          ? 'bg-slate-800 text-cyan-400'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                      }`}
                    >
                      <QrCode className="w-4 h-4 text-emerald-400" />
                      <span>Fullscreen QR Pass</span>
                    </button>
                  </div>

                  {/* Sign Out Action */}
                  <div className="pt-1">
                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        onLogout();
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 transition-colors text-left cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Log Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 pl-1 border-l border-slate-800">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleNav('login')}
              >
                Login
              </Button>
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Sparkles className="w-3.5 h-3.5" />}
                onClick={() => handleNav('register')}
              >
                Register
              </Button>
            </div>
          )}
        </div>

        {/* Mobile Header Controls */}
        <div className="flex md:hidden items-center gap-2">
          {/* Theme Toggle Button */}
          <button
            onClick={handleToggleTheme}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 cursor-pointer"
            title={activeTheme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
            aria-label="Toggle theme"
          >
            {activeTheme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-500" />
            )}
          </button>

          {/* Gate Simulator Quick Button */}
          {onOpenScanner && (
            <button
              onClick={onOpenScanner}
              className="p-2 rounded-xl bg-cyan-950/60 border border-cyan-800/60 text-cyan-400"
              title="Gate Simulator"
            >
              <Radio className="w-4 h-4 animate-pulse" />
            </button>
          )}

          {/* Mobile Menu Hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Toggle navigation"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5 text-white" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-800 bg-slate-950 px-4 py-4 space-y-4 animate-in slide-in-from-top-2 duration-150">
          {user ? (
            <>
              {/* Commuter Wallet Card in Drawer */}
              <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-600 flex items-center justify-center font-bold text-white text-sm">
                    {user.fullName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">{user.fullName}</div>
                    <div className="text-[11px] font-mono text-cyan-400">
                      {(user.creditBalance ?? 0).toFixed(2)} Credits
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleNav('account-credits')}
                  className="py-1.5 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold flex items-center gap-1 transition-colors"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Top Up</span>
                </button>
              </div>

              {/* Navigation Items */}
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => handleNav('dashboard')}
                  className={`text-left px-3 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2.5 ${
                    currentRoute === 'dashboard'
                      ? 'bg-slate-800 text-cyan-400'
                      : 'text-slate-300 hover:bg-slate-900'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4 text-cyan-400" />
                  <span>Dashboard</span>
                </button>

                <button
                  onClick={() => handleNav('account-qr')}
                  className={`text-left px-3 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2.5 ${
                    currentRoute === 'account-qr'
                      ? 'bg-slate-800 text-cyan-400'
                      : 'text-slate-300 hover:bg-slate-900'
                  }`}
                >
                  <QrCode className="w-4 h-4 text-emerald-400" />
                  <span>My QR Pass</span>
                </button>

                <button
                  onClick={() => handleNav('profile')}
                  className={`text-left px-3 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2.5 ${
                    currentRoute === 'profile'
                      ? 'bg-slate-800 text-cyan-400'
                      : 'text-slate-300 hover:bg-slate-900'
                  }`}
                >
                  <UserIcon className="w-4 h-4 text-indigo-400" />
                  <span>Profile & Ride History</span>
                </button>
              </div>

              {/* Log Out Button */}
              <div className="pt-2 border-t border-slate-800">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onLogout();
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-rose-950/40 border border-rose-900/50 text-rose-300 hover:bg-rose-900/40 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Log Out of Account</span>
                </button>
              </div>
            </>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <Button variant="secondary" size="sm" onClick={() => handleNav('login')}>
                Login
              </Button>
              <Button variant="primary" size="sm" onClick={() => handleNav('register')}>
                Register
              </Button>
            </div>
          )}

          {/* Mobile Theme Switch Row in Drawer */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5 font-medium">
              {activeTheme === 'dark' ? (
                <Moon className="w-4 h-4 text-indigo-400" />
              ) : (
                <Sun className="w-4 h-4 text-amber-500" />
              )}
              <span>Theme: <strong className="text-slate-200 capitalize font-semibold">{activeTheme} Mode</strong></span>
            </span>
            <button
              onClick={handleToggleTheme}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium cursor-pointer transition-colors"
            >
              Switch to {activeTheme === 'dark' ? 'Light' : 'Dark'}
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
