import React from 'react';
import { ArrowLeft, ArrowRight, ShieldCheck, Ticket, Clock, CheckCircle2 } from 'lucide-react';
import type { AccessDurationDays, AppRoute, GuestSession, RegisteredUser } from '../types';
import { DURATION_OPTIONS } from '../utils/storage';

interface CheckoutPageProps {
  durationDays: AccessDurationDays;
  guestSession: GuestSession | null;
  user: RegisteredUser | null;
  onNavigate: (route: AppRoute) => void;
  onProceedToPayment: () => void;
}

export const CheckoutPage: React.FC<CheckoutPageProps> = ({
  durationDays,
  guestSession,
  user,
  onNavigate,
  onProceedToPayment,
}) => {
  const option = DURATION_OPTIONS.find((o) => o.days === durationDays) || DURATION_OPTIONS[0];

  // Calculate estimated expiry window
  const now = new Date();
  const estimatedExpiry = new Date(now.getTime() + option.hours * 60 * 60 * 1000);
  const formattedExpiry = estimatedExpiry.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="max-w-xl mx-auto w-full py-4 sm:py-6">
      {/* Back button */}
      <button
        onClick={() => onNavigate('guest-period')}
        className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Change duration</span>
      </button>

      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-400 mx-auto flex items-center justify-center mb-3 border border-cyan-500/20">
            <Ticket className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Review Order</h2>
          <p className="text-xs text-slate-400 mt-1">
            Confirm your transit pass selection before proceeding to secure payment.
          </p>
        </div>

        {/* Order Details Card */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 mb-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <span className="text-xs text-slate-400 font-medium">Pass Type</span>
              <div className="font-semibold text-white text-sm">
                {user ? 'Registered Commuter Pass' : 'Temporary Guest Transit Pass'}
              </div>
            </div>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
              {user ? user.userId : guestSession?.guestId}
            </span>
          </div>

          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <span className="text-xs text-slate-400 font-medium">Access Duration</span>
              <div className="font-semibold text-white text-sm flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-cyan-400" />
                <span>{option.label} ({option.hours} Hours)</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400 font-medium">Estimated Validity</span>
              <div className="text-xs font-mono text-emerald-400 font-semibold">
                Until {formattedExpiry}
              </div>
            </div>
          </div>

          <div>
            <span className="text-xs text-slate-400 font-medium block mb-2">Network Inclusions</span>
            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                All Metro Lines (1-8)
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                Urban Tramway Routes
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                Rapid City Busses
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                Express Airport Rail
              </span>
            </div>
          </div>
        </div>

        {/* Price Breakdown */}
        <div className="space-y-2 mb-6 text-xs text-slate-300">
          <div className="flex justify-between">
            <span className="text-slate-400">Pass Fare ({option.label})</span>
            <span className="font-mono text-white">${option.price.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Transit Processing & QR Issuance Fee</span>
            <span className="font-mono text-emerald-400 font-medium">$0.00 (Waived)</span>
          </div>
          <div className="pt-3 border-t border-slate-800 flex justify-between items-baseline">
            <span className="text-sm font-bold text-white uppercase tracking-wider">Total Amount</span>
            <div className="text-right">
              <span className="text-2xl font-black text-cyan-400 font-mono">
                ${option.price.toFixed(2)}
              </span>
              <span className="text-[11px] text-slate-400 block font-normal">USD (incl. all taxes)</span>
            </div>
          </div>
        </div>

        {/* Security badge */}
        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 mb-6 flex items-center gap-2.5 text-xs text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Encrypted payment. A scannable transit token will be generated instantly.</span>
        </div>

        <button
          onClick={onProceedToPayment}
          className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 transition-all transform active:scale-[0.99]"
        >
          <span>Pay Now & Issue Pass</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
