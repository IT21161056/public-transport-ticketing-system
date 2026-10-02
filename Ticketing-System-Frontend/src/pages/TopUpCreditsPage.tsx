import React, { useState } from 'react';
import { 
  Coins, 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle2, 
  ShieldCheck, 
  CreditCard, 
  Smartphone, 
  RefreshCw
} from 'lucide-react';
import type { RegisteredUser, AppRoute, PaymentMethod } from '../types';
import { TOP_UP_PRESETS, topUpUserCredits } from '../utils/storage';

interface TopUpCreditsPageProps {
  user: RegisteredUser;
  onNavigate: (route: AppRoute) => void;
  onUpdateUser: (user: RegisteredUser) => void;
}

export const TopUpCreditsPage: React.FC<TopUpCreditsPageProps> = ({
  user,
  onNavigate,
  onUpdateUser,
}) => {
  const [selectedAmount, setSelectedAmount] = useState<number>(1000);
  const [method, setMethod] = useState<PaymentMethod>('card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [addedAmount, setAddedAmount] = useState<number>(0);

  const handleTopUp = () => {
    setIsProcessing(true);

    setTimeout(() => {
      const updated = topUpUserCredits(selectedAmount);
      setIsProcessing(false);
      if (updated) {
        onUpdateUser(updated);
        setAddedAmount(selectedAmount);
        setIsSuccess(true);
      }
    }, 1200);
  };

  if (isSuccess) {
    return (
      <div className="max-w-md mx-auto w-full py-12 px-4 text-center">
        <div className="bg-slate-900/90 border border-emerald-500/40 rounded-3xl p-8 sm:p-10 shadow-2xl backdrop-blur-xl">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 mx-auto mb-5 flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 animate-bounce-short text-emerald-400" />
          </div>

          <h3 className="text-2xl font-bold text-white mb-2">Top-Up Confirmed!</h3>
          <p className="text-xs text-slate-300 mb-6">
            Successfully added <span className="font-mono font-bold text-emerald-400">+{addedAmount.toFixed(2)} Credits</span> to your account.
          </p>

          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 mb-6 text-xs text-slate-300 space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-400">Account ID:</span>
              <span className="font-mono font-semibold">{user.userId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">New Available Balance:</span>
              <span className="font-mono font-bold text-emerald-400 text-sm">
                {(user.creditBalance ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} Credits
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => onNavigate('account-qr')}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all"
            >
              <span>View My Transport QR</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onNavigate('profile')}
              className="w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors"
            >
              Back to Profile
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto w-full py-8 px-4">
      {/* Back button */}
      <button
        onClick={() => onNavigate('account-qr')}
        className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to My QR</span>
      </button>

      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 mx-auto flex items-center justify-center mb-3 border border-emerald-500/20">
            <Coins className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Top Up Account Credits</h2>
          <p className="text-xs text-slate-400 mt-1">
            Add travel credits to your persistent commuter transit wallet.
          </p>
        </div>

        {/* Current Balance Card */}
        <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between mb-6">
          <div>
            <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block">
              Current Balance
            </span>
            <span className="text-xs text-slate-500 font-mono">Account {user.userId}</span>
          </div>
          <div className="text-right">
            <span className="text-xl font-black text-white font-mono">
              {(user.creditBalance ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[10px] text-emerald-400 block font-semibold">Credits Available</span>
          </div>
        </div>

        {/* Preset Amounts Grid */}
        <div className="mb-6">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
            Select Top-Up Amount
          </label>
          <div className="grid grid-cols-2 gap-3">
            {TOP_UP_PRESETS.map((preset) => {
              const isSelected = selectedAmount === preset.amount;
              return (
                <button
                  key={preset.amount}
                  type="button"
                  onClick={() => setSelectedAmount(preset.amount)}
                  className={`relative p-3.5 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'bg-emerald-950/40 border-emerald-400 ring-2 ring-emerald-400/20'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {preset.bonus && (
                    <span className="absolute -top-2 right-2 text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-500 text-slate-950 uppercase font-mono">
                      {preset.bonus}
                    </span>
                  )}
                  <span className="text-base font-black text-white font-mono block">
                    +{preset.amount}
                  </span>
                  <span className="text-[10px] text-slate-400">Credits</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Payment Method selector */}
        <div className="mb-6">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Payment Method
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setMethod('card')}
              className={`p-3 rounded-xl border flex items-center gap-2 text-xs font-semibold transition-all ${
                method === 'card'
                  ? 'bg-emerald-500/10 border-emerald-400 text-emerald-300'
                  : 'bg-slate-950 border-slate-800 text-slate-400'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span>Credit / Debit Card</span>
            </button>
            <button
              type="button"
              onClick={() => setMethod('apple_pay')}
              className={`p-3 rounded-xl border flex items-center gap-2 text-xs font-semibold transition-all ${
                method === 'apple_pay'
                  ? 'bg-emerald-500/10 border-emerald-400 text-emerald-300'
                  : 'bg-slate-950 border-slate-800 text-slate-400'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              <span>Digital Wallet</span>
            </button>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={handleTopUp}
          disabled={isProcessing}
          className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 disabled:opacity-50 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all transform active:scale-[0.99] mb-4"
        >
          {isProcessing ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Processing Payment...</span>
            </>
          ) : (
            <>
              <span>Confirm & Add +{selectedAmount.toLocaleString()} Credits</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>

        <div className="flex items-center justify-center gap-2 text-[11px] text-slate-500">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Encrypted payment. Immediate credit balance update.</span>
        </div>
      </div>
    </div>
  );
};
