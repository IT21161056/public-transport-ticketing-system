import React from 'react';
import { 
  Train, 
  QrCode, 
  CreditCard, 
  ShieldCheck, 
  ArrowRight, 
  Sparkles, 
  Compass, 
  Zap, 
  Smartphone 
} from 'lucide-react';
import type { AppRoute, RegisteredUser, GuestTransportToken } from '../types';
import Button from '../components/Button';

export interface HomeProps {
  onNavigate: (route: AppRoute) => void;
  onStartGuest: () => void;
  user?: RegisteredUser | null;
  activeGuestPass?: GuestTransportToken | null;
}

export const Home: React.FC<HomeProps> = ({
  onNavigate,
  onStartGuest,
  user,
  activeGuestPass,
}) => {
  const isGuestPassActive = activeGuestPass && new Date(activeGuestPass.expiresAt).getTime() > Date.now();
  return (
    <div className="max-w-6xl mx-auto w-full py-4 sm:py-8 space-y-10">
      {/* Hero Section */}
      <div className="relative py-6 sm:py-12 text-center">
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-cyan-500/15 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-950/60 border border-cyan-800/60 text-cyan-300 text-xs font-medium">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Next-Gen Minimal-Data Transit Protocol</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Tap, Scan & Ride with <br />
            <span className="bg-gradient-to-r from-cyan-400 via-teal-300 to-blue-500 bg-clip-text text-transparent">
              Zero Hassle Contactless QR
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            Travel seamlessly across all metropolitan trains, buses, and trams.
            No plastic smartcards, no passwords, and complete privacy protection.
          </p>

          {/* Flow 1 Step 4: Auto-Recovery Banner for Visitor Token */}
          {!user && isGuestPassActive && (
            <div className="mx-auto max-w-lg p-4 rounded-2xl bg-cyan-950/70 border border-cyan-500/40 text-left flex items-center justify-between shadow-lg shadow-cyan-950/50 animate-pulse-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-300 flex items-center justify-center shrink-0">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      Active Visitor Pass Detected
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5">
                    {activeGuestPass?.durationLabel} Unlimited Pass linked to this device
                  </p>
                </div>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => onNavigate('guest-qr')}
                rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
              >
                View QR
              </Button>
            </div>
          )}

          {/* Action CTAs */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            {user ? (
              <>
                <Button
                  variant="primary"
                  size="lg"
                  leftIcon={<QrCode className="w-5 h-5" />}
                  onClick={() => onNavigate('dashboard')}
                  className="w-full sm:w-auto"
                >
                  Go to Commuter Dashboard
                </Button>
                <Button
                  variant="secondary"
                  size="lg"
                  leftIcon={<CreditCard className="w-5 h-5" />}
                  onClick={() => onNavigate('account-credits')}
                  className="w-full sm:w-auto"
                >
                  Top Up Credits
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="primary"
                  size="lg"
                  leftIcon={<Compass className="w-5 h-5" />}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                  onClick={onStartGuest}
                  className="w-full sm:w-auto"
                >
                  {isGuestPassActive ? 'View Active Visitor Pass' : 'Visitor Express Pass'}
                </Button>
                <Button
                  variant="secondary"
                  size="lg"
                  leftIcon={<Smartphone className="w-5 h-5" />}
                  onClick={() => onNavigate('register')}
                  className="w-full sm:w-auto"
                >
                  Local Commuter Pass
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Feature Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-6 flex flex-col gap-3 hover:border-slate-700 transition-colors">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
            <Zap className="w-5 h-5" />
          </div>
          <h3 className="font-semibold text-white text-base">Instant Pass Issuance</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Purchase 24h, 48h, 72h or weekly unlimited travel in under 30 seconds with instant QR delivery.
          </p>
        </div>

        <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-6 flex flex-col gap-3 hover:border-slate-700 transition-colors">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="font-semibold text-white text-base">Privacy Guaranteed</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Strict minimal data policy. No complex personal records required, verified instantly via secure SMS OTP.
          </p>
        </div>

        <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-6 flex flex-col gap-3 hover:border-slate-700 transition-colors">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
            <Train className="w-5 h-5" />
          </div>
          <h3 className="font-semibold text-white text-base">Unified City Grid</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            One single dynamic QR token operates across Metro rail lines, rapid transit buses, and street trams.
          </p>
        </div>
      </div>

      {/* Network Stats Bar */}
      <div className="rounded-2xl bg-slate-900/40 border border-slate-800/80 p-6 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
        <div>
          <div className="text-2xl font-bold font-mono text-cyan-400">99.8%</div>
          <div className="text-xs text-slate-400 mt-1">Network On-Time</div>
        </div>
        <div>
          <div className="text-2xl font-bold font-mono text-emerald-400">&lt; 350ms</div>
          <div className="text-xs text-slate-400 mt-1">Gate Scan Latency</div>
        </div>
        <div>
          <div className="text-2xl font-bold font-mono text-indigo-400">120+</div>
          <div className="text-xs text-slate-400 mt-1">Active Stations</div>
        </div>
        <div>
          <div className="text-2xl font-bold font-mono text-amber-400">100%</div>
          <div className="text-xs text-slate-400 mt-1">Paperless Transit</div>
        </div>
      </div>
    </div>
  );
};

export default Home;
