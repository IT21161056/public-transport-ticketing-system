import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Phone, 
  ShieldCheck, 
  Coins, 
  PlusCircle, 
  QrCode, 
  TrendingUp,
  TrendingDown,
  AlertCircle,
  RefreshCw,
  Calendar,
  Clock
} from 'lucide-react';
import type { RegisteredUser, AppRoute, CreditTransaction } from '../types';
import { STANDARD_RIDE_FARE } from '../utils/storage';
import { accountApi, type TopUpTransactionRecord } from '../api/accountApi';

interface ProfilePageProps {
  user: RegisteredUser;
  transactions?: CreditTransaction[];
  onNavigate: (route: AppRoute) => void;
}

export type ActivityType = 'topup' | 'ride';

export interface ActivityItem {
  id: string;
  type: ActivityType;
  title: string;
  subtitle?: string;
  reference?: string;
  method?: string;
  channelName?: string;
  amount: number;
  bonusAmount?: number;
  totalCredits: number;
  balanceAfter: number;
  status: 'SUCCESS' | 'FAILED';
  createdAtUtc: string;
  failureReason?: string;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({
  user,
  transactions = [],
  onNavigate,
}) => {
  const [records, setRecords] = useState<TopUpTransactionRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [filter, setFilter] = useState<'all' | 'rides' | 'topup'>('all');

  const isLowBalance = (user.creditBalance ?? 0) < STANDARD_RIDE_FARE;

  const formatDate = (isoString?: string) => {
    if (!isoString) return 'Just now';
    try {
      return new Date(isoString).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  const fetchHistory = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await accountApi.getTopUpHistory(user.userId);
      if (res.success && res.data.length > 0) {
        setRecords(res.data);
      } else {
        // Fallback to local transaction log if available
        const localLog = localStorage.getItem('urban_transit_topup_tx_log');
        if (localLog) {
          try {
            setRecords(JSON.parse(localLog));
          } catch {
            setRecords([]);
          }
        } else {
          setRecords([]);
        }
      }
    } catch {
      const localLog = localStorage.getItem('urban_transit_topup_tx_log');
      if (localLog) {
        try {
          setRecords(JSON.parse(localLog));
        } catch {
          setRecords([]);
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, [user.userId]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const allActivities = useMemo<ActivityItem[]>(() => {
    const topUpItems: ActivityItem[] = records.map((r) => ({
      id: r.id,
      type: 'topup',
      title: r.channelName || 'Top-Up Reload',
      subtitle: r.paymentReference ? `Ref: ${r.paymentReference}` : undefined,
      reference: r.paymentReference || undefined,
      method: r.method,
      channelName: r.channelName,
      amount: r.amount,
      bonusAmount: r.bonusAmount,
      totalCredits: r.totalCredits,
      balanceAfter: r.balanceAfter,
      status: r.status === 'SUCCESS' ? 'SUCCESS' : 'FAILED',
      createdAtUtc: r.createdAtUtc,
      failureReason: r.failureReason || undefined,
    }));

    const rideItems: ActivityItem[] = transactions
      .filter((t) => t.type === 'fare_deduction')
      .map((t) => ({
        id: t.id,
        type: 'ride',
        title: t.description || 'Transit Metro/Bus Ride',
        subtitle: 'Turnstile Tap Deduction',
        amount: t.amount,
        totalCredits: t.amount,
        balanceAfter: t.balanceAfter,
        status: 'SUCCESS',
        createdAtUtc: t.timestamp,
      }));

    return [...topUpItems, ...rideItems].sort(
      (a, b) => new Date(b.createdAtUtc).getTime() - new Date(a.createdAtUtc).getTime()
    );
  }, [records, transactions]);

  const filteredActivities = useMemo(() => {
    return allActivities.filter((item) => {
      if (filter === 'all') return true;
      if (filter === 'rides') return item.type === 'ride';
      if (filter === 'topup') return item.type === 'topup';
      return true;
    });
  }, [allActivities, filter]);

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

      {/* Transit & Credit History */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl backdrop-blur-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-bold text-white tracking-tight">
              Transit & Credit History
            </h2>
            <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">
              {filteredActivities.length}
            </span>
            <button
              onClick={fetchHistory}
              disabled={isLoading}
              className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition-colors ml-1 cursor-pointer"
              title="Refresh transactions"
              aria-label="Refresh transactions"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
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
              onClick={() => setFilter('rides')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                filter === 'rides'
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

        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin text-emerald-400" />
            <span className="text-xs">Loading transaction ledger...</span>
          </div>
        ) : filteredActivities.length === 0 ? (
          <div className="bg-slate-950/40 border border-slate-800/60 border-dashed rounded-2xl p-8 text-center">
            <Coins className="w-8 h-8 text-slate-500 mx-auto mb-2" />
            <h4 className="text-sm font-semibold text-white">No Transactions Recorded</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              {filter === 'all'
                ? `Your account is ready with ${(user.creditBalance ?? 0).toFixed(2)} credits. Top up or tap at turnstiles to start riding!`
                : filter === 'topup'
                ? 'No top-up reloads found.'
                : 'No transit ride deductions recorded yet.'}
            </p>
            {filter === 'topup' && (
              <button
                onClick={() => onNavigate('account-credits')}
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30 text-xs font-semibold cursor-pointer transition-colors"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Top Up Credits Now</span>
              </button>
            )}
          </div>
        ) : (
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl divide-y divide-slate-800/80 overflow-hidden">
            {filteredActivities.map((tx) => {
              const isTopUp = tx.type === 'topup';
              const isSuccess = tx.status === 'SUCCESS';

              return (
                <div
                  key={tx.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-800/30 transition-colors text-xs"
                >
                  <div className="flex items-start sm:items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 sm:mt-0 ${
                        isTopUp
                          ? isSuccess
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                      }`}
                    >
                      {isTopUp ? (
                        isSuccess ? (
                          <TrendingUp className="w-4 h-4" />
                        ) : (
                          <AlertCircle className="w-4 h-4" />
                        )
                      ) : (
                        <TrendingDown className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-white text-sm">
                          {tx.title}
                        </span>
                        {isTopUp ? (
                          <>
                            <span
                              className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                                isSuccess
                                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              }`}
                            >
                              {tx.status}
                            </span>
                            {tx.method && (
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 uppercase">
                                {tx.method}
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-900 uppercase">
                            FARE DEDUCTION
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] text-slate-400 mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="flex items-center gap-1 font-mono text-slate-400">
                          <Calendar className="w-3 h-3 text-slate-500" />
                          {formatDate(tx.createdAtUtc)}
                        </span>
                        {tx.reference && (
                          <>
                            <span className="text-slate-600">•</span>
                            <span className="font-mono text-slate-400">
                              Ref: {tx.reference}
                            </span>
                          </>
                        )}
                        {tx.failureReason && (
                          <span className="text-rose-400 block w-full sm:w-auto mt-0.5">
                            ({tx.failureReason})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-left sm:text-right shrink-0 font-mono pl-12 sm:pl-0 border-t sm:border-t-0 border-slate-900 pt-2 sm:pt-0">
                    <span
                      className={`text-sm font-bold block ${
                        isTopUp
                          ? isSuccess
                            ? 'text-emerald-400'
                            : 'text-rose-400 line-through'
                          : 'text-slate-200'
                      }`}
                    >
                      {isTopUp
                        ? `+${tx.totalCredits.toFixed(2)} Credits`
                        : `-${tx.amount.toFixed(2)} Credits`}
                    </span>
                    {isTopUp && tx.bonusAmount && tx.bonusAmount > 0 ? (
                      <span className="text-[11px] text-slate-400 block">
                        Added {tx.amount.toFixed(2)} (+{tx.bonusAmount.toFixed(2)} Bonus)
                      </span>
                    ) : null}
                    <span className="text-[10px] text-slate-500 block">
                      Bal: {tx.balanceAfter.toFixed(2)} Cr
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
