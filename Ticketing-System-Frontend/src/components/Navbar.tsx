import React, { useState, useEffect } from 'react';
import { 
  Train, 
  Menu, 
  X, 
  Sparkles, 
  Sun, 
  Moon, 
  LogIn, 
  UserPlus 
} from 'lucide-react';
import type { AppRoute, RegisteredUser } from '../types';
import Button from './Button';
import { useTheme } from '../hooks/useTheme';

export interface NavbarProps {
  currentRoute: AppRoute;
  onNavigate: (route: AppRoute) => void;
  user: RegisteredUser | null;
  onLogout: () => void;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
}

/**
 * Top navigation bar designed for visitors and unauthenticated users.
 * Focuses on quick pass issuance, transit network info, and login/registration.
 */
export const Navbar: React.FC<NavbarProps> = ({
  currentRoute,
  onNavigate,
  user,
  theme,
  onToggleTheme,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const hookTheme = useTheme();
  const activeTheme = theme ?? hookTheme.theme;
  const handleToggleTheme = onToggleTheme ?? hookTheme.toggleTheme;

  // Close mobile drawer on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);

  const handleNav = (route: AppRoute) => {
    onNavigate(route);
    setMobileMenuOpen(false);
  };

  return (
    <header
      role="banner"
      className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-md transition-all"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <button
          onClick={() => handleNav(user ? 'dashboard' : 'home')}
          className="flex items-center gap-3 text-left group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 rounded-xl shrink-0 cursor-pointer"
          aria-label="UrbanTransit Home"
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
              Rapid Metro & Bus Contactless Transit
            </p>
          </div>
        </button>

        {/* Right Utility & Auth CTA (Desktop) */}
        <div className="hidden md:flex items-center gap-3">
          {/* Theme Toggle Button */}
          <button
            onClick={handleToggleTheme}
            title={activeTheme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
            aria-label={activeTheme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 transition-all border border-slate-800 hover:border-slate-700 cursor-pointer shadow-sm active:scale-95"
          >
            {activeTheme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400 hover:rotate-45 transition-transform duration-300" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-400 hover:-rotate-12 transition-transform duration-300" />
            )}
          </button>

          {/* Login & Register Buttons */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<LogIn className="w-3.5 h-3.5" />}
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
              <Moon className="w-4 h-4 text-indigo-400" />
            )}
          </button>

          {/* Mobile Hamburger Toggle */}
          <button
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white cursor-pointer"
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-800/80 bg-slate-950/95 backdrop-blur-xl px-4 py-4 space-y-3 animate-in slide-in-from-top-2 duration-150">
          <div className="space-y-1">
            <button
              onClick={() => handleNav('home')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                currentRoute === 'home' || currentRoute === 'landing'
                  ? 'bg-slate-900 text-cyan-400'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900/60'
              }`}
            >
              <span>Network Overview</span>
            </button>

            <button
              onClick={() => handleNav('guest-period')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                currentRoute === 'guest-period' || currentRoute === 'guest-checkout'
                  ? 'bg-slate-900 text-cyan-400'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900/60'
              }`}
            >
              <span>Tourist & Guest Pass</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                Instant QR
              </span>
            </button>
          </div>

          <div className="pt-2 border-t border-slate-800 grid grid-cols-2 gap-2">
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<LogIn className="w-3.5 h-3.5" />}
              onClick={() => handleNav('login')}
              className="w-full"
            >
              Login
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<UserPlus className="w-3.5 h-3.5" />}
              onClick={() => handleNav('register')}
              className="w-full"
            >
              Register
            </Button>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;