import React, { useState } from 'react';
import { 
  Phone, 
  ShieldCheck, 
  Coins, 
  PlusCircle, 
  QrCode, 
  TrendingDown,
  TrendingUp,
  Clock,
  Calendar
} from 'lucide-react';
import type { RegisteredUser, AppRoute, CreditTransaction } from '../types';
import { STANDARD_RIDE_FARE } from '../utils/storage';

interface ProfilePageProps {
  user: RegisteredUser;
  transactions: CreditTransaction[];
  onNavigate: (route: AppRoute) => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({
  user,
  transactions,
  onNavigate,
}) => {
  const [filter, setFilter] = useState<'all' | 'topup' | 'deduction'>('all');
  const isLowBalance = (user.creditBalance ?? 0) < STANDARD_RIDE_FARE;

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filteredTransactions = transactions.filter((tx) => {
    if (filter === 'all') return true;
    return tx.type === filter;
  });

  return (
    <div className="max-w-6xl mx-auto w-full py-4 sm:py-6 space-y-6">
      {/* Profile Header Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl backdrop-blur-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-6 border-b border-slate-800">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-[2px] shadow-lg shadow-emerald-500/20">
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
                <span className="text-slate-600">•</span>
                <span className="text-emerald-400 font-mono text-[11px]">Account Active</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={() => onNavigate('account-credits')}
              className="flex-1 sm:flex-initial py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all transform active:scale-[0.99] cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Top Up Credits</span>
            </button>
            <button
              onClick={() => onNavigate('account-qr')}
              className="flex-1 sm:flex-initial py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-2 border border-slate-700 transition-all transform active:scale-[0.99] cursor-pointer"
            >
              <QrCode className="w-4 h-4 text-emerald-400" />
              <span>My QR Pass</span>
            </button>
          </div>
        </div>

        {/* Account Details Breakdown */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6">
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Full Legal Name
            </span>
            <span className="text-sm font-medium text-white">{user.fullName}</span>
            <span className="text-[10px] text-slate-500 block mt-1 font-mono">Verified Transit ID</span>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Verified Contact
            </span>
            <div className="flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-sm font-mono font-medium text-white">{user.phoneNumber}</span>
            </div>
            <span className="text-[10px] text-emerald-400/80 block mt-1">SMS OTP Secured</span>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Available Credits
            </span>
            <div className="flex items-center gap-2">
              <Coins className={`w-4 h-4 ${isLowBalance ? 'text-amber-400' : 'text-emerald-400'}`} />
              <span className="text-base font-bold font-mono text-white">
                {(user.creditBalance ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} Credits
              </span>
            </div>
            <span className="text-[10px] text-slate-500 block mt-1">
              {isLowBalance ? '⚠️ Below standard fare' : `~${Math.floor((user.creditBalance ?? 0) / STANDARD_RIDE_FARE)} rides remaining`}
            </span>
          </div>
        </div>
      </div>

      {/* Credit Transactions & Ride History */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl backdrop-blur-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-bold text-white tracking-tight">
              Transit & Credit History
            </h2>
            <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">
              {transactions.length}
            </span>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-950 border border-slate-800 text-xs">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                filter === 'all'
                  ? 'bg-slate-800 text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All Activity
            </button>
            <button
              onClick={() => setFilter('deduction')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                filter === 'deduction'
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-800 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Rides Only
            </button>
            <button
              onClick={() => setFilter('topup')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                filter === 'topup'
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Top-Ups Only
            </button>
          </div>
        </div>

        {filteredTransactions.length === 0 ? (
          <div className="bg-slate-950/40 border border-slate-800/60 border-dashed rounded-2xl p-8 text-center">
            <Coins className="w-8 h-8 text-slate-500 mx-auto mb-2" />
            <h4 className="text-sm font-semibold text-white">No Transactions Recorded</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              {filter === 'all'
                ? `Your account is ready with ${(user.creditBalance ?? 0).toFixed(2)} credits. Tap at turnstiles to start riding!`
                : `No ${filter === 'topup' ? 'top-up reloads' : 'transit ride deductions'} found.`}
            </p>
          </div>
        ) : (
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl divide-y divide-slate-800/80 overflow-hidden">
            {filteredTransactions.map((tx) => (
              <div
                key={tx.id}
                className="p-4 flex items-center justify-between hover:bg-slate-800/30 transition-colors text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    tx.type === 'topup'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                  }`}>
                    {tx.type === 'topup' ? (
                      <TrendingUp className="w-4 h-4" />
                    ) : (
                      <TrendingDown className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <span className="font-semibold text-white block">{tx.description}</span>
                    <span className="text-[11px] text-slate-500 font-mono flex items-center gap-2 mt-0.5">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(tx.timestamp)}
                      </span>
                      <span>•</span>
                      <span>Ref: {tx.id.slice(-8)}</span>
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
                    Bal: {tx.balanceAfter.toFixed(2)} Cr
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
