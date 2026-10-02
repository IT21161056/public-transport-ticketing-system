import React, { useState } from 'react';
import { 
  CreditCard, 
  Smartphone, 
  ArrowLeft, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2, 
  XCircle,
  Lock,
  Wallet
} from 'lucide-react';
import type { AccessDurationDays, AppRoute, PaymentMethod, PaymentState } from '../types';
import { DURATION_OPTIONS } from '../utils/storage';

interface PaymentPageProps {
  durationDays: AccessDurationDays;
  onNavigate: (route: AppRoute) => void;
  onPaymentSuccess: () => void;
}

export const PaymentPage: React.FC<PaymentPageProps> = ({
  durationDays,
  onNavigate,
  onPaymentSuccess,
}) => {
  const option = DURATION_OPTIONS.find((o) => o.days === durationDays) || DURATION_OPTIONS[0];

  const [method, setMethod] = useState<PaymentMethod>('card');
  const [paymentState, setPaymentState] = useState<PaymentState>('idle');
  const [cardNumber, setCardNumber] = useState('4532 •••• •••• 8821');
  const [expiry, setExpiry] = useState('08/29');
  const [cvv, setCvv] = useState('•••');

  // Trigger payment processing
  const initiatePayment = (forceResult?: 'success' | 'fail' | 'cancel') => {
    if (forceResult === 'cancel') {
      setPaymentState('cancelled');
      return;
    }

    setPaymentState('pending');

    setTimeout(() => {
      if (forceResult === 'fail') {
        setPaymentState('failed');
      } else {
        setPaymentState('successful');
        setTimeout(() => {
          onPaymentSuccess();
        }, 1200);
      }
    }, 1800);
  };

  // State: Pending Processing
  if (paymentState === 'pending') {
    return (
      <div className="max-w-xl mx-auto w-full py-6 sm:py-10 text-center">
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-8 sm:p-10 shadow-2xl backdrop-blur-xl">
          <div className="relative w-20 h-20 mx-auto mb-6 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-4 border-cyan-500/20 border-t-cyan-400 animate-spin"></div>
            <Lock className="w-8 h-8 text-cyan-400 animate-pulse" />
          </div>

          <h3 className="text-xl font-bold text-white mb-2">Connecting to Transit Gateway</h3>
          <p className="text-xs text-slate-400 mb-6">
            Authorizing payment of <span className="text-white font-mono font-bold">${option.price.toFixed(2)}</span> with your payment provider...
          </p>

          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs text-slate-400 flex items-center justify-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
            <span>Generating cryptographic transport token...</span>
          </div>
        </div>
      </div>
    );
  }

  // State: Payment Successful
  if (paymentState === 'successful') {
    return (
      <div className="max-w-xl mx-auto w-full py-6 sm:py-10 text-center">
        <div className="bg-slate-900/90 border border-emerald-500/40 rounded-3xl p-8 sm:p-10 shadow-2xl backdrop-blur-xl">
          <div className="w-20 h-20 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 mx-auto mb-6 flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 animate-bounce-short text-emerald-400" />
          </div>

          <h3 className="text-2xl font-bold text-white mb-2">Payment Confirmed!</h3>
          <p className="text-xs text-slate-300 mb-6">
            Transport token generated. Issuing your turnstile QR pass credential now...
          </p>

          <div className="bg-emerald-950/40 border border-emerald-800/60 p-3 rounded-xl text-xs font-mono text-emerald-300">
            Redirecting to Access QR Pass...
          </div>
        </div>
      </div>
    );
  }

  // State: Payment Failed
  if (paymentState === 'failed') {
    return (
      <div className="max-w-xl mx-auto w-full py-6 sm:py-8 text-center">
        <div className="bg-slate-900/90 border border-rose-800/80 rounded-3xl p-8 sm:p-10 shadow-2xl backdrop-blur-xl">
          <div className="w-16 h-16 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30 mx-auto mb-5 flex items-center justify-center">
            <AlertCircle className="w-8 h-8" />
          </div>

          <h3 className="text-xl font-bold text-white mb-2">Payment Declined</h3>
          <p className="text-xs text-slate-400 mb-6">
            Your bank or card issuer declined the transaction (ERR_CARD_DECLINED). No charges were made.
          </p>

          <div className="space-y-3">
            <button
              onClick={() => initiatePayment('success')}
              className="w-full py-3.5 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Retry Payment</span>
            </button>
            <button
              onClick={() => setPaymentState('idle')}
              className="w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors"
            >
              Choose Another Payment Method
            </button>
          </div>
        </div>
      </div>
    );
  }

  // State: Payment Cancelled
  if (paymentState === 'cancelled') {
    return (
      <div className="max-w-xl mx-auto w-full py-6 sm:py-8 text-center">
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-8 sm:p-10 shadow-2xl backdrop-blur-xl">
          <div className="w-16 h-16 rounded-full bg-slate-800 text-slate-400 mx-auto mb-5 flex items-center justify-center">
            <XCircle className="w-8 h-8" />
          </div>

          <h3 className="text-xl font-bold text-white mb-2">Payment Cancelled</h3>
          <p className="text-xs text-slate-400 mb-6">
            You cancelled the payment request. No transit token has been issued.
          </p>

          <div className="space-y-3">
            <button
              onClick={() => setPaymentState('idle')}
              className="w-full py-3.5 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-colors"
            >
              <span>Return to Payment Methods</span>
            </button>
            <button
              onClick={() => onNavigate('guest-checkout')}
              className="w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors"
            >
              Back to Order Review
            </button>
          </div>
        </div>
      </div>
    );
  }

  // State: Default Idle (Method Selection)
  return (
    <div className="max-w-xl mx-auto w-full py-4 sm:py-6">
      <button
        onClick={() => onNavigate('guest-checkout')}
        className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Order Review</span>
      </button>

      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-800">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Payment Method</h2>
            <p className="text-xs text-slate-400 mt-0.5">Select your preferred payment channel</p>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-400 uppercase font-mono block">Amount</span>
            <span className="text-xl font-black text-cyan-400 font-mono">
              ${option.price.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Method selection tabs */}
        <div className="grid grid-cols-3 gap-2 mb-6">
          <button
            type="button"
            onClick={() => setMethod('card')}
            className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
              method === 'card'
                ? 'bg-cyan-500/10 border-cyan-400 text-cyan-300 shadow-sm'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span className="text-[11px] font-semibold">Credit Card</span>
          </button>

          <button
            type="button"
            onClick={() => setMethod('apple_pay')}
            className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
              method === 'apple_pay'
                ? 'bg-cyan-500/10 border-cyan-400 text-cyan-300 shadow-sm'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span className="text-[11px] font-semibold">Apple Pay</span>
          </button>

          <button
            type="button"
            onClick={() => setMethod('transit_wallet')}
            className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
              method === 'transit_wallet'
                ? 'bg-cyan-500/10 border-cyan-400 text-cyan-300 shadow-sm'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Wallet className="w-4 h-4" />
            <span className="text-[11px] font-semibold">Digital Pass</span>
          </button>
        </div>

        {/* Card input mockup */}
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Card Number
            </label>
            <div className="relative">
              <input
                type="text"
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white font-mono focus:outline-none focus:border-cyan-400"
              />
              <CreditCard className="w-4 h-4 text-slate-400 absolute right-4 top-3.5" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Expiry Date
              </label>
              <input
                type="text"
                value={expiry}
                onChange={(e) => setExpiry(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white font-mono focus:outline-none focus:border-cyan-400"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                CVV / CVC
              </label>
              <input
                type="password"
                value={cvv}
                onChange={(e) => setCvv(e.target.value)}
                maxLength={4}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white font-mono focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>
        </div>

        <button
          onClick={() => initiatePayment('success')}
          className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 transition-all transform active:scale-[0.99] mb-4"
        >
          <Lock className="w-4 h-4" />
          <span>Pay ${option.price.toFixed(2)} & Issue QR Pass</span>
        </button>

        {/* Section 12 Required State Simulation Controls (Demonstration & Verification) */}
        <div className="pt-4 border-t border-slate-800">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block mb-2 text-center">
            Simulate Gateway Result:
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => initiatePayment('fail')}
              className="flex-1 py-1.5 px-2 rounded-lg bg-rose-950/60 hover:bg-rose-900/60 border border-rose-800/60 text-rose-300 text-[11px] font-semibold transition-colors"
            >
              Simulate Failure
            </button>
            <button
              onClick={() => initiatePayment('cancel')}
              className="flex-1 py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-[11px] font-semibold transition-colors"
            >
              Simulate Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
