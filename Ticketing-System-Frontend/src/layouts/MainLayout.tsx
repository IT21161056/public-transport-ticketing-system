import React from 'react';
import type { AppRoute, RegisteredUser } from '../types';
import Navbar from '../components/Navbar';

export interface MainLayoutProps {
  children: React.ReactNode;
  currentRoute: AppRoute;
  onNavigate: (route: AppRoute) => void;
  user: RegisteredUser | null;
  onLogout: () => void;
  onOpenScanner?: () => void;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  currentRoute,
  onNavigate,
  user,
  onLogout,
  onOpenScanner,
  theme,
  onToggleTheme,
}) => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950">
      {/* Top Navigation */}
      <Navbar
        currentRoute={currentRoute}
        onNavigate={onNavigate}
        user={user}
        onLogout={onLogout}
        onOpenScanner={onOpenScanner}
        theme={theme}
        onToggleTheme={onToggleTheme}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col justify-start px-2 sm:px-4 py-4 max-w-7xl mx-auto w-full">
        {children}
      </main>

      {/* Modern Transit Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 backdrop-blur-sm py-6 text-center text-xs text-slate-500 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-400">UrbanTransit</span>
            <span>•</span>
            <span>Minimal-Data Transit Protocol</span>
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
};

export default MainLayout;
