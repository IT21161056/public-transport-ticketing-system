import React from 'react';
import { 
  UserPlus, 
  Zap, 
  ArrowRight, 
  Sparkles, 
  CheckCircle2
} from 'lucide-react';
import type { AppRoute } from '../types';
import { STANDARD_RIDE_FARE } from '../utils/storage';

interface LandingPageProps {
  onNavigate: (route: AppRoute) => void;
  onStartGuest: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate, onStartGuest }) => {
  return (
    <div className="flex flex-col items-center justify-center py-6 sm:py-14 px-4 max-w-5xl mx-auto w-full">
      {/* Hero section */}
      <div className="text-center max-w-2xl mx-auto mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-950/60 border border-cyan-800/50 text-cyan-300 text-xs font-medium mb-5 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>Fast Turnstile Access • Instant Digital Pass</span>
        </div>

        <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white mb-4 leading-tight">
          City Transit Access,{' '}
          <span className="bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 bg-clip-text text-transparent">
            Simplified.
          </span>
        </h1>

        <p className="text-slate-300 text-base sm:text-lg leading-relaxed max-w-xl mx-auto">
          Get direct transit turnstile clearance in seconds. Choose between a persistent commuter account or an instant temporary visitor pass.
        </p>
      </div>

      {/* Two Core Options Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
        {/* Option 1: Temporary Guest Pass */}
        <div className="relative group rounded-3xl p-6 sm:p-8 bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-cyan-500/30 hover:border-cyan-400/60 transition-all shadow-xl hover:shadow-cyan-500/10 flex flex-col justify-between">
          <div className="absolute top-4 right-4 bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
            Temporary Visitor
          </div>

          <div>
            <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-5 border border-cyan-500/20 group-hover:scale-105 transition-transform">
              <Zap className="w-7 h-7" />
            </div>

            <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">
              Continue as Guest
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed mb-6">
              For tourists and temporary city visitors. Obtain a paid transport token valid for a fixed duration without creating an account.
            </p>

            <ul className="space-y-3 mb-8 text-sm text-slate-300">
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>No account or profile creation required</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>Select 1, 2, 3, or 7-day transport access</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>Temporary QR token valid strictly within duration</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>Instant screenshot-ready digital pass</span>
              </li>
            </ul>
          </div>

          <button
            onClick={onStartGuest}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25 transition-all transform active:scale-[0.99]"
          >
            <span>Continue as Guest</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Option 2: Registered Local User (Persistent Account + Credits + Persistent QR) */}
        <div className="relative group rounded-3xl p-6 sm:p-8 bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-emerald-500/30 hover:border-emerald-400/60 transition-all shadow-xl hover:shadow-emerald-500/10 flex flex-col justify-between">
          <div className="absolute top-4 right-4 bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
            Persistent Account
          </div>

          <div>
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-5 border border-emerald-500/20 group-hover:scale-105 transition-transform">
              <UserPlus className="w-7 h-7" />
            </div>

            <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">
              Create Local Commuter Account
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed mb-6">
              For local residents and regular commuters. Manage your wallet balance and receive a persistent, reusable QR credential linked to your account.
            </p>

            <ul className="space-y-3 mb-8 text-sm text-slate-300">
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Minimal data: Only full name & phone number</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Persistent reusable QR (never expires with active account)</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Account credit balance with easy top-up</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Automated fare deduction ({STANDARD_RIDE_FARE.toFixed(2)} credits/tap)</span>
              </li>
            </ul>
          </div>

          <div className="space-y-2.5">
            <button
              onClick={() => onNavigate('register')}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all transform active:scale-[0.99]"
            >
              <span>Create Account</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <p className="text-center text-xs text-slate-400 pt-1">
              Already registered?{' '}
              <button
                onClick={() => onNavigate('login')}
                className="text-emerald-400 hover:underline font-semibold"
              >
                Log in via Phone
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
