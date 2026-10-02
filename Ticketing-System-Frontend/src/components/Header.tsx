import React from 'react';
import { Train, QrCode, LogOut, Coins, PlusCircle } from 'lucide-react';
import type { AppRoute, RegisteredUser } from '../types';

interface HeaderProps {
  currentRoute: AppRoute;
  onNavigate: (route: AppRoute) => void;
  user: RegisteredUser | null;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentRoute,
  onNavigate,
  user,
  onLogout,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand */}
        <button
          onClick={() => onNavigate('landing')}
          className="flex items-center gap-3 text-left group transition-all"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-teal-500 to-emerald-400 p-[1px] shadow-lg shadow-cyan-500/20 group-hover:shadow-cyan-500/40 transition-shadow">
            <div className="w-full h-full bg-slate-950 rounded-[11px] flex items-center justify-center">
              <Train className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                UrbanTransit
              </span>
              <span className="text-[10px] uppercase tracking-widest px-1.5 py-0.5 rounded font-mono font-bold bg-cyan-950/80 text-cyan-400 border border-cyan-800/60">
                Turnstile Gate
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-400">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[11px] text-slate-400 font-medium">Metropolitan Transit Ready</span>
            </div>
          </div>
        </button>

        {/* Right side navigation & quick actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Turnstile Gate Scanner Quick Access */}
          <button
            onClick={() => onNavigate('scanner')}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              currentRoute === 'scanner'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'bg-slate-900/90 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800'
            }`}
            title="Open transit turnstile QR scanner simulation"
          >
            <QrCode className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Gate Inspector</span>
          </button>

          {/* User profile with Credits or Guest indicator */}
          {user ? (
            <div className="flex items-center gap-2">
              {/* Account Credits Pill */}
              <button
                onClick={() => onNavigate('account-credits')}
                className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-950/40 hover:bg-emerald-900/40 border border-emerald-800/50 text-emerald-300 text-xs font-mono font-semibold transition-colors"
                title="Top-up credits"
              >
                <Coins className="w-3.5 h-3.5 text-emerald-400" />
                <span>{(user.creditBalance ?? 0).toFixed(0)} Credits</span>
                <PlusCircle className="w-3 h-3 text-emerald-400 opacity-75" />
              </button>

              {/* My QR Pass button */}
              <button
                onClick={() => onNavigate('account-qr')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  currentRoute === 'account-qr'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800'
                }`}
                title="Open persistent turnstile QR pass"
              >
                <QrCode className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden md:inline">My QR</span>
              </button>

              {/* Profile icon */}
              <button
                onClick={() => onNavigate('profile')}
                className={`inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  currentRoute === 'profile'
                    ? 'bg-slate-800 text-white border border-slate-700'
                    : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
                }`}
              >
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[10px]">
                  {user.fullName.charAt(0).toUpperCase()}
                </div>
                <span className="max-w-[90px] truncate hidden md:inline">{user.fullName}</span>
              </button>

              <button
                onClick={onLogout}
                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-900 rounded-lg transition-colors"
                title="Log out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onNavigate('login')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  currentRoute === 'login'
                    ? 'text-white bg-slate-800'
                    : 'text-slate-300 hover:text-white hover:bg-slate-900'
                }`}
              >
                Login
              </button>
              <button
                onClick={() => onNavigate('register')}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 hover:brightness-110 transition-all shadow-md shadow-emerald-500/10"
              >
                Register
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
