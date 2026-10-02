import React from 'react';
import { 
  Phone, 
  ShieldCheck, 
  Coins, 
  PlusCircle, 
  QrCode, 
  ArrowRight,
  TrendingDown,
  TrendingUp,
  Clock
} from 'lucide-react';
import type { RegisteredUser, AppRoute, CreditTransaction } from '../types';
import { STANDARD_RIDE_FARE } from '../utils/storage';

interface ProfilePageProps {
  user: RegisteredUser;
  transactions: CreditTransaction[];
  onNavigate: (route: AppRoute) => void;
  onOpenScanner: (token: string) => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({
  user,
  transactions,
  onNavigate,
  onOpenScanner,
}) => {
  const isLowBalance = (user.creditBalance ?? 0) < STANDARD_RIDE_FARE;

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="max-w-6xl mx-auto w-full py-4 sm:py-6">
      {/* Profile Header Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl backdrop-blur-xl mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-6 border-b border-slate-800">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-[2px]">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center font-extrabold text-2xl text-emerald-400">
                {user.fullName.charAt(0).toUpperCase()}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold text-white tracking-tight">{user.fullName}</h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Verified Commuter
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                <span>Account ID:</span>
                <span className="font-mono text-slate-300 font-semibold">{user.userId}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={() => onNavigate('account-credits')}
              className="flex-1 sm:flex-initial py-3 px-5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all transform active:scale-[0.99]"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Top Up Credits</span>
            </button>
            <button
              onClick={() => onNavigate('account-qr')}
              className="flex-1 sm:flex-initial py-3 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-2 border border-slate-700 transition-all transform active:scale-[0.99]"
            >
              <QrCode className="w-4 h-4 text-emerald-400" />
              <span>My QR Pass</span>
            </button>
          </div>
        </div>

        {/* Minimal Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6">
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Full Legal Name
            </span>
            <span className="text-sm font-medium text-white">{user.fullName}</span>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Verified Phone Number
            </span>
            <div className="flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-sm font-mono font-medium text-white">{user.phoneNumber}</span>
            </div>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Account Credit Balance
            </span>
            <div className="flex items-center gap-2">
              <Coins className={`w-4 h-4 ${isLowBalance ? 'text-amber-400' : 'text-emerald-400'}`} />
              <span className="text-base font-bold font-mono text-white">
                {(user.creditBalance ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} Credits
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Persistent Commuter Pass Hero Banner (GEMINI Section 7.3) */}
      <div className="mb-8 bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/40 rounded-3xl p-6 sm:p-7 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <QrCode className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white tracking-tight">Persistent Transport QR</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  REUSABLE PASS
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-lg leading-relaxed">
                Your linked account credential does not expire. Present this QR code at any metro or bus gate reader to deduct {STANDARD_RIDE_FARE.toFixed(2)} credits per trip.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={() => onNavigate('account-qr')}
              className="flex-1 sm:flex-initial py-3 px-5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 hover:brightness-110 transition-all"
            >
              <span>Open My QR</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onOpenScanner(user.persistentQrToken)}
              className="flex-1 sm:flex-initial py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors"
            >
              Simulate Tap
            </button>
          </div>
        </div>
      </div>

      {/* Credit Transactions & Ride History (GEMINI Section 7.4) */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold text-white tracking-tight">
              Transit & Credit Activity ({transactions.length})
            </h3>
          </div>
          <button
            onClick={() => onNavigate('account-credits')}
            className="text-xs text-emerald-400 hover:underline font-semibold flex items-center gap-1"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Top Up</span>
          </button>
        </div>

        {transactions.length === 0 ? (
          <div className="bg-slate-900/40 border border-slate-800/60 border-dashed rounded-3xl p-8 text-center">
            <Coins className="w-8 h-8 text-slate-500 mx-auto mb-2" />
            <h4 className="text-sm font-semibold text-white">No Transactions Yet</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Your account is ready with {(user.creditBalance ?? 0).toFixed(2)} credits. Present your QR code at turnstile gates to start riding!
            </p>
          </div>
        ) : (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl divide-y divide-slate-800/80 overflow-hidden">
            {transactions.slice(0, 10).map((tx) => (
              <div
                key={tx.id}
                className="p-4 flex items-center justify-between hover:bg-slate-800/30 transition-colors text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    tx.type === 'topup'
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : 'bg-cyan-500/10 text-cyan-400'
                  }`}>
                    {tx.type === 'topup' ? (
                      <TrendingUp className="w-4 h-4" />
                    ) : (
                      <TrendingDown className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <span className="font-semibold text-white block">{tx.description}</span>
                    <span className="text-[11px] text-slate-500 font-mono">
                      {formatDate(tx.timestamp)} • Ref: {tx.id}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className={`font-mono font-bold text-sm block ${
                    tx.type === 'topup' ? 'text-emerald-400' : 'text-slate-200'
                  }`}>
                    {tx.type === 'topup' ? `+${tx.amount.toFixed(2)}` : `-${tx.amount.toFixed(2)}`}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Bal: {tx.balanceAfter.toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
