import React, { useState } from 'react';
import { 
  Train, 
  QrCode, 
  CreditCard, 
  User as UserIcon, 
  LogOut, 
  Menu, 
  X, 
  Sparkles, 
  LayoutDashboard,
  Sun,
  Moon
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
  const hookTheme = useTheme();
  const activeTheme = theme ?? hookTheme.theme;
  const handleToggleTheme = onToggleTheme ?? hookTheme.toggleTheme;

  const handleNav = (route: AppRoute) => {
    onNavigate(route);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-md transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <button
          onClick={() => handleNav(user ? 'dashboard' : 'home')}
          className="flex items-center gap-3 text-left group focus:outline-none"
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

        {/* Desktop Navigation Links */}
        {user && (
          <nav className="hidden md:flex items-center gap-1">
            <button
              onClick={() => handleNav('dashboard')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                currentRoute === 'dashboard'
                  ? 'bg-slate-800 text-cyan-400'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 text-cyan-400" />
              Dashboard
            </button>

            <button
              onClick={() => handleNav('account-qr')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                currentRoute === 'account-qr'
                  ? 'bg-slate-800 text-cyan-400'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900'
              }`}
            >
              <QrCode className="w-4 h-4 text-emerald-400" />
              My QR Pass
            </button>

            <button
              onClick={() => handleNav('account-credits')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                currentRoute === 'account-credits'
                  ? 'bg-slate-800 text-cyan-400'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900'
              }`}
            >
              <CreditCard className="w-4 h-4 text-amber-400" />
              Top Up
            </button>

            <button
              onClick={() => handleNav('profile')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                currentRoute === 'profile'
                  ? 'bg-slate-800 text-cyan-400'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900'
              }`}
            >
              <UserIcon className="w-4 h-4 text-indigo-400" />
              Profile
            </button>
          </nav>
        )}

        {/* Right CTA / User State */}
        <div className="hidden md:flex items-center gap-3">
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

          {onOpenScanner && (
            <Button
              variant="outline"
              size="sm"
              leftIcon={<QrCode className="w-4 h-4" />}
              onClick={onOpenScanner}
              title="Test Gate Scanner"
            >
              Gate Simulator
            </Button>
          )}

          {user ? (
            <div className="flex items-center gap-3 pl-3 border-l border-slate-800">
              <div className="text-right">
                <div className="text-xs font-semibold text-white flex items-center gap-1 justify-end">
                  <span>{user.fullName}</span>
                </div>
                <div className="text-[11px] font-mono text-cyan-400 font-medium">
                  {user.creditBalance.toFixed(2)} Credits
                </div>
              </div>

              <button
                onClick={onLogout}
                title="Log out"
                className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors border border-transparent hover:border-rose-900/50"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
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

        {/* Mobile Menu Button */}
        <div className="flex md:hidden items-center gap-2">
          {/* Mobile Theme Toggle Button */}
          <button
            onClick={handleToggleTheme}
            className="p-2 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 cursor-pointer"
            title={activeTheme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
            aria-label="Toggle theme"
          >
            {activeTheme === 'dark' ? (
              <Sun className="w-5 h-5 text-amber-400" />
            ) : (
              <Moon className="w-5 h-5 text-indigo-500" />
            )}
          </button>

          {onOpenScanner && (
            <button
              onClick={onOpenScanner}
              className="p-2 rounded-lg bg-slate-800 text-cyan-400 border border-slate-700"
              title="Gate Simulator"
            >
              <QrCode className="w-5 h-5" />
            </button>
          )}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-slate-300 hover:bg-slate-900"
            aria-label="Toggle navigation"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6 text-white" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-800 bg-slate-950 px-4 py-4 space-y-3">
          {user && (
            <div className="flex flex-col gap-1">
              <button
                onClick={() => handleNav('dashboard')}
                className="text-left px-3 py-2 rounded-lg text-sm text-cyan-400 hover:bg-slate-900 font-medium"
              >
                Dashboard
              </button>
              <button
                onClick={() => handleNav('account-qr')}
                className="text-left px-3 py-2 rounded-lg text-sm text-emerald-400 hover:bg-slate-900"
              >
                My QR Pass
              </button>
              <button
                onClick={() => handleNav('account-credits')}
                className="text-left px-3 py-2 rounded-lg text-sm text-amber-400 hover:bg-slate-900"
              >
                Top Up Credits
              </button>
              <button
                onClick={() => handleNav('profile')}
                className="text-left px-3 py-2 rounded-lg text-sm text-indigo-400 hover:bg-slate-900"
              >
                Profile & History
              </button>
            </div>
          )}

          <div className={`${user ? 'pt-3 border-t border-slate-800' : ''} flex flex-col gap-2`}>
            {user ? (
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-white">{user.fullName}</div>
                  <div className="text-xs text-cyan-400 font-mono">{user.creditBalance.toFixed(2)} Credits</div>
                </div>
                <Button variant="danger" size="sm" onClick={onLogout} leftIcon={<LogOut className="w-3.5 h-3.5" />}>
                  Log Out
                </Button>
              </div>
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
          </div>

          {/* Mobile Theme Switch Row in Drawer */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
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
