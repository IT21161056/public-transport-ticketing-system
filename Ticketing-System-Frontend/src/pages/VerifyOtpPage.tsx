import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldCheck, 
  ArrowLeft, 
  ArrowRight,
  RefreshCw, 
  AlertCircle, 
  KeyRound, 
  Check, 
  CheckCircle2, 
  CreditCard, 
  QrCode, 
  Smartphone, 
  Lock,
  Sparkles 
} from 'lucide-react';
import type { AppRoute } from '../types';

export interface VerifyOtpPageProps {
  phoneNumber: string;
  fullName: string;
  expectedOtp: string;
  mode: 'register' | 'login';
  onNavigate: (route: AppRoute) => void;
  onVerifySuccess: () => void;
  onResendOtp: () => void;
  onVerifyCode?: (code: string) => Promise<{ success: boolean; message?: string }>;
  onCompleteRegistration?: (
    phoneNumber: string,
    fullName: string,
    initialCredit: number,
    tokenMedium: string,
    paymentMethod: string
  ) => Promise<{ success: boolean; message?: string }>;
}

const INITIAL_CREDIT_OPTIONS = [
  { amount: 500, label: 'LKR 500.00', bonus: 'Minimum Required Deposit', rides: '~3 Metro/Bus Rides' },
  { amount: 1000, label: 'LKR 1,000.00', bonus: '+50 Bonus Credits', popular: true, rides: '~7 Metro/Bus Rides' },
  { amount: 2500, label: 'LKR 2,500.00', bonus: '+200 Bonus Credits', rides: '~18 Metro/Bus Rides' },
  { amount: 5000, label: 'LKR 5,000.00', bonus: '+500 Bonus Credits', bestValue: true, rides: '~38 Metro/Bus Rides' },
];

export const VerifyOtpPage: React.FC<VerifyOtpPageProps> = ({
  phoneNumber,
  fullName,
  expectedOtp,
  mode,
  onNavigate,
  onVerifySuccess,
  onResendOtp,
  onVerifyCode,
  onCompleteRegistration,
}) => {
  // Navigation / Phase within registration
  // 'otp' -> 'setup' -> 'payment' -> 'confirmed'
  const [currentPhase, setCurrentPhase] = useState<'otp' | 'setup' | 'payment' | 'confirmed'>('otp');

  // OTP State
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [secondsLeft, setSecondsLeft] = useState(45);
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  // Path A Setup State (Initial Credit & Medium)
  const [selectedCredit, setSelectedCredit] = useState<number>(500);
  const [selectedMedium, setSelectedMedium] = useState<'Digital QR' | 'Smartcard'>('Digital QR');

  // Payment Gateway State
  const [paymentMethod, setPaymentMethod] = useState<'Card' | 'ApplePay' | 'Bank'>('Card');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Mask phone number: e.g. "+94 77 123 4567" -> "+94 77 ••• ••67"
  const maskPhone = (phone: string) => {
    const parts = phone.split(' ');
    if (parts.length >= 2) {
      const num = parts.slice(1).join('');
      if (num.length >= 4) {
        const start = num.slice(0, 2);
        const end = num.slice(-2);
        const masked = '•'.repeat(Math.max(3, num.length - 4));
        return `${parts[0]} ${start} ${masked} ${end}`;
      }
    }
    return phone.replace(/(\d{3})\d+(\d{2})/, '$1 ••• $2');
  };

  // Timer countdown for OTP
  useEffect(() => {
    if (currentPhase !== 'otp' || secondsLeft <= 0) {
      return;
    }
    const timer = setInterval(() => {
      setSecondsLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [currentPhase, secondsLeft]);

  // Focus first input on mount
  useEffect(() => {
    if (currentPhase === 'otp') {
      inputRefs.current[0]?.focus();
    }
  }, [currentPhase]);

  const handleChange = (index: number, val: string) => {
    setError(null);
    const cleaned = val.replace(/\D/g, '');

    if (cleaned.length > 1) {
      // User pasted whole OTP
      const pasted = cleaned.slice(0, 6).split('');
      const newDigits = [...digits];
      pasted.forEach((char, i) => {
        if (i < 6) newDigits[i] = char;
      });
      setDigits(newDigits);
      if (pasted.length === 6) {
        verifyCode(newDigits.join(''));
      } else {
        inputRefs.current[Math.min(pasted.length, 5)]?.focus();
      }
      return;
    }

    const newDigits = [...digits];
    newDigits[index] = cleaned;
    setDigits(newDigits);

    if (cleaned && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto submit if all 6 filled
    if (index === 5 && cleaned) {
      const fullCode = newDigits.join('');
      if (fullCode.length === 6) {
        verifyCode(fullCode);
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const verifyCode = async (code: string) => {
    setIsVerifying(true);
    setError(null);

    try {
      if (mode === 'login') {
        // Direct commuter login
        if (onVerifyCode) {
          const res = await onVerifyCode(code);
          if (res.success) {
            onVerifySuccess();
          } else {
            setError(res.message || 'Incorrect verification code. Please check your SMS and try again.');
          }
        } else {
          if (code === expectedOtp) {
            onVerifySuccess();
          } else {
            setError('Incorrect verification code. Please check your SMS and try again.');
          }
        }
      } else {
        // Path A: Local Commuter Registration (Fuel-Pass style)
        // Step 1: Verify OTP code
        const isMatch = code === expectedOtp;
        if (!isMatch && onVerifyCode) {
          // Attempt backend verification
          const res = await onVerifyCode(code);
          if (!res.success) {
            setError(res.message || 'Incorrect verification code. Please check your SMS and try again.');
            return;
          }
        } else if (!isMatch) {
          setError('Incorrect verification code. Please check your SMS and try again.');
          return;
        }

        // Phone verified successfully! Transition to Step 3: Initial Credit & Token Medium selection
        setCurrentPhase('setup');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fullCode = digits.join('');
    if (fullCode.length < 6) {
      setError('Please enter all 6 digits of the verification code.');
      return;
    }
    verifyCode(fullCode);
  };

  const handleResend = () => {
    if (secondsLeft > 0) return;
    setDigits(['', '', '', '', '', '']);
    setError(null);
    setSecondsLeft(45);
    onResendOtp();
    inputRefs.current[0]?.focus();
  };

  // Submit payment & complete commuter registration
  const handleConfirmPayment = async () => {
    setIsProcessingPayment(true);
    setError(null);

    try {
      if (onCompleteRegistration) {
        const res = await onCompleteRegistration(
          phoneNumber,
          fullName,
          selectedCredit,
          selectedMedium,
          paymentMethod
        );

        if (!res.success) {
          setError(res.message || 'Payment or account activation failed.');
          setIsProcessingPayment(false);
          return;
        }
      }

      // Transition to Confirmed Phase
      setCurrentPhase('confirmed');
      setTimeout(() => {
        onVerifySuccess();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment authorization failed');
      setIsProcessingPayment(false);
    }
  };

  // ==============================================================
  // PHASE 4: Payment Confirmed & Pass Issued
  // ==============================================================
  if (currentPhase === 'confirmed') {
    return (
      <div className="max-w-md mx-auto w-full py-8 px-4 text-center">
        <div className="bg-slate-900/95 border-2 border-emerald-500/50 rounded-3xl p-8 sm:p-10 shadow-2xl backdrop-blur-xl animate-fade-in">
          <div className="w-20 h-20 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 mx-auto mb-6 flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 animate-bounce-short text-emerald-400" />
          </div>

          <h3 className="text-2xl font-bold text-white mb-2">Account & Token Activated!</h3>
          <p className="text-xs text-slate-300 mb-6">
            Permanent commuter pass issued. Your digital wallet has been credited with{' '}
            <span className="font-mono font-bold text-emerald-400">LKR {selectedCredit.toFixed(2)}</span>.
          </p>

          <div className="bg-emerald-950/40 border border-emerald-800/60 p-3.5 rounded-xl text-xs font-mono text-emerald-300 flex items-center justify-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span>Opening Commuter Hub...</span>
          </div>
        </div>
      </div>
    );
  }

  // ==============================================================
  // PHASE 3: Payment Gateway Checkout (Path A - Local Commuter)
  // ==============================================================
  if (currentPhase === 'payment') {
    return (
      <div className="max-w-lg mx-auto w-full py-8 px-4">
        {/* Back button to setup */}
        <button
          onClick={() => setCurrentPhase('setup')}
          className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors mb-6 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Medium & Credit Selection</span>
        </button>

        <div className="bg-slate-900/95 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-400 mx-auto flex items-center justify-center mb-3 border border-cyan-500/20">
              <CreditCard className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Payment Gateway Checkout</h2>
            <p className="text-xs text-slate-400 mt-1">
              Load required initial credit to activate permanent transit pass
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3 rounded-xl bg-rose-950/50 border border-rose-800/60 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Commuter Order Summary */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 mb-6 space-y-3.5">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800/80">
              <span className="text-xs text-slate-400">Account Holder</span>
              <span className="text-xs font-bold text-white">{fullName}</span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-slate-800/80">
              <span className="text-xs text-slate-400">Verified Phone</span>
              <span className="text-xs font-mono font-semibold text-cyan-400">{phoneNumber}</span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-slate-800/80">
              <span className="text-xs text-slate-400">Selected Medium</span>
              <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                {selectedMedium === 'Digital QR' ? (
                  <QrCode className="w-3.5 h-3.5" />
                ) : (
                  <CreditCard className="w-3.5 h-3.5" />
                )}
                {selectedMedium === 'Digital QR' ? 'Digital QR Pass' : 'Physical Smartcard'}
              </span>
            </div>
            <div className="flex justify-between items-baseline pt-1">
              <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Total Deposit</span>
              <div className="text-right">
                <span className="text-2xl font-black text-cyan-400 font-mono">
                  LKR {selectedCredit.toFixed(2)}
                </span>
                <span className="text-[10px] text-slate-400 block font-normal">100% credited to your digital wallet</span>
              </div>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="mb-6 space-y-2.5">
            <label className="text-xs font-medium text-slate-300 block">Select Payment Method</label>
            <div className="grid grid-cols-3 gap-2.5">
              {[
                { id: 'Card', label: 'Credit Card', icon: CreditCard },
                { id: 'ApplePay', label: 'Digital Pay', icon: Smartphone },
                { id: 'Bank', label: 'Direct Bank', icon: Lock },
              ].map((m) => {
                const isSelected = paymentMethod === m.id;
                const Icon = m.icon;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPaymentMethod(m.id as any)}
                    className={`p-3 rounded-xl border text-left flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-cyan-950/40 border-cyan-400 text-cyan-300 ring-1 ring-cyan-400/30'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-[11px] font-medium">{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Secure Payment Guarantee */}
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center gap-2.5 text-xs text-slate-400 mb-6">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Bank-grade 256-bit SSL encrypted transit gateway transaction.</span>
          </div>

          {/* Action button */}
          <button
            type="button"
            disabled={isProcessingPayment}
            onClick={handleConfirmPayment}
            className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 disabled:opacity-50 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
          >
            {isProcessingPayment ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Authorizing & Generating Token...</span>
              </>
            ) : (
              <>
                <span>Pay LKR {selectedCredit.toFixed(2)} & Activate Pass</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  // ==============================================================
  // PHASE 2: Select Initial Credit & Token Medium (Path A Commuter)
  // ==============================================================
  if (currentPhase === 'setup') {
    return (
      <div className="max-w-xl mx-auto w-full py-8 px-4">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 text-cyan-400 text-xs font-mono font-bold mb-3 border border-cyan-800/50">
            <Sparkles className="w-3.5 h-3.5" />
            <span>PATH A: LOCAL COMMUTER SETUP</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Initial Credit & Token Medium
          </h2>
          <p className="text-xs text-slate-400 mt-2 max-w-md mx-auto">
            Choose your turnstile access format and load your required initial commuter wallet deposit.
          </p>
        </div>

        {/* Phone Verified Pill */}
        <div className="mb-6 p-3 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="text-slate-300">Verified Mobile:</span>
            <span className="font-mono text-cyan-400 font-semibold">{phoneNumber}</span>
          </div>
          <span className="text-[11px] text-emerald-400 font-mono font-semibold">VERIFIED</span>
        </div>

        {/* Medium Selection Cards */}
        <div className="mb-6 space-y-3">
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
            1. Select Token Medium <span className="text-cyan-400">*</span>
          </label>
          <div role="radiogroup" aria-label="Select Token Medium" className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Medium Option A: Digital QR */}
            <div
              role="radio"
              aria-checked={selectedMedium === 'Digital QR'}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === ' ' || e.key === 'Enter') {
                  e.preventDefault();
                  setSelectedMedium('Digital QR');
                }
              }}
              onClick={() => setSelectedMedium('Digital QR')}
              className={`p-4 rounded-2xl border transition-all cursor-pointer text-left flex flex-col justify-between ${
                selectedMedium === 'Digital QR'
                  ? 'bg-gradient-to-br from-cyan-950/40 via-slate-900 to-slate-900 border-cyan-400 ring-2 ring-cyan-400/20 shadow-xl'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
                    <QrCode className="w-4 h-4" />
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center border transition-colors ${
                      selectedMedium === 'Digital QR'
                        ? 'border-cyan-400 bg-cyan-400 text-slate-950'
                        : 'border-slate-600 bg-slate-950'
                    }`}
                  >
                    {selectedMedium === 'Digital QR' && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </div>
                <h4 className="font-bold text-white text-sm">Digital QR Pass</h4>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  Dynamic HMAC-signed QR pass instantly generated on your smartphone screen. No cards needed.
                </p>
              </div>
              <span className="mt-3 text-[10px] font-mono text-cyan-300 font-semibold bg-cyan-950/60 px-2 py-0.5 rounded w-max border border-cyan-800/60">
                INSTANT ACTIVATION
              </span>
            </div>

            {/* Medium Option B: Physical Smartcard */}
            <div
              role="radio"
              aria-checked={selectedMedium === 'Smartcard'}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === ' ' || e.key === 'Enter') {
                  e.preventDefault();
                  setSelectedMedium('Smartcard');
                }
              }}
              onClick={() => setSelectedMedium('Smartcard')}
              className={`p-4 rounded-2xl border transition-all cursor-pointer text-left flex flex-col justify-between ${
                selectedMedium === 'Smartcard'
                  ? 'bg-gradient-to-br from-cyan-950/40 via-slate-900 to-slate-900 border-cyan-400 ring-2 ring-cyan-400/20 shadow-xl'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center border transition-colors ${
                      selectedMedium === 'Smartcard'
                        ? 'border-cyan-400 bg-cyan-400 text-slate-950'
                        : 'border-slate-600 bg-slate-950'
                    }`}
                  >
                    {selectedMedium === 'Smartcard' && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </div>
                <h4 className="font-bold text-white text-sm">Physical Smartcard</h4>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  Contactless RFID/NFC smartcard linked directly to your commuter phone profile and balance.
                </p>
              </div>
              <span className="mt-3 text-[10px] font-mono text-indigo-300 font-semibold bg-indigo-950/60 px-2 py-0.5 rounded w-max border border-indigo-800/60">
                PHYSICAL TAP-IN
              </span>
            </div>
          </div>
        </div>

        {/* Initial Credit Selection Cards */}
        <div className="mb-6 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
              2. Select Initial Credit Deposit <span className="text-cyan-400">*</span>
            </label>
            <span className="text-[11px] font-mono text-amber-400 font-medium">Min LKR 500.00 Required</span>
          </div>

          <div role="radiogroup" aria-label="Select Initial Credit" className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {INITIAL_CREDIT_OPTIONS.map((opt) => {
              const isSelected = selectedCredit === opt.amount;
              return (
                <div
                  key={opt.amount}
                  role="radio"
                  aria-checked={isSelected}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === ' ' || e.key === 'Enter') {
                      e.preventDefault();
                      setSelectedCredit(opt.amount);
                    }
                  }}
                  onClick={() => setSelectedCredit(opt.amount)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer text-left flex flex-col justify-between ${
                    isSelected
                      ? 'bg-gradient-to-br from-cyan-950/40 via-slate-900 to-slate-900 border-cyan-400 ring-2 ring-cyan-400/20 shadow-xl'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-lg font-black text-white font-mono">{opt.label}</span>
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center border transition-colors ${
                        isSelected
                          ? 'border-cyan-400 bg-cyan-400 text-slate-950'
                          : 'border-slate-600 bg-slate-950'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </div>
                  <div className="text-xs font-semibold text-cyan-400">{opt.bonus}</div>
                  <div className="text-[11px] text-slate-400 mt-1">{opt.rides}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Continue to Payment CTA */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block">
              Required Initial Payment
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-black text-white font-mono">
                LKR {selectedCredit.toFixed(2)}
              </span>
              <span className="text-xs text-slate-400">via Payment Gateway</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setCurrentPhase('payment')}
            className="w-full sm:w-auto py-3.5 px-6 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
          >
            <span>Proceed to Payment Gateway</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // ==============================================================
  // PHASE 1: 6-Digit SMS OTP Verification
  // ==============================================================
  return (
    <div className="max-w-md mx-auto w-full py-8 px-4">
      {/* Change phone button */}
      <button
        onClick={() => onNavigate(mode === 'register' ? 'register' : 'login')}
        className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors mb-6 cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Change phone number</span>
      </button>

      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-400 mx-auto flex items-center justify-center mb-3 border border-cyan-500/20">
            <KeyRound className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Verify Phone Number</h2>
          <p className="text-xs text-slate-400 mt-2">
            We sent an SMS with a 6-digit verification code to
          </p>
          <div className="inline-block mt-1 font-mono font-bold text-sm text-cyan-400 bg-slate-950/80 px-3 py-1 rounded-lg border border-slate-800">
            {maskPhone(phoneNumber)}
          </div>
        </div>

        {error && (
          <div className="mb-5 p-3 rounded-xl bg-rose-950/50 border border-rose-800/60 text-rose-300 text-xs flex items-center gap-2 animate-shake">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleManualSubmit} className="space-y-6">
          {/* 6 Digit Input Group */}
          <div className="flex justify-between gap-2 sm:gap-3">
            {digits.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => {
                  inputRefs.current[idx] = el;
                }}
                type="text"
                inputMode="numeric"
                maxLength={6}
                aria-label={`Verification code digit ${idx + 1} of 6`}
                autoComplete={idx === 0 ? 'one-time-code' : 'off'}
                value={digit}
                onChange={(e) => handleChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                className={`w-11 h-14 sm:w-12 sm:h-16 text-center text-xl sm:text-2xl font-mono font-bold rounded-xl border bg-slate-950/90 text-white focus:outline-none transition-all ${
                  error
                    ? 'border-rose-500 focus:ring-1 focus:ring-rose-500'
                    : digit
                    ? 'border-cyan-400/80 ring-1 ring-cyan-400/30'
                    : 'border-slate-700 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400'
                }`}
              />
            ))}
          </div>

          <button
            type="submit"
            disabled={isVerifying || digits.join('').length < 6}
            className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
          >
            {isVerifying ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <span>Verify & Continue</span>
            )}
          </button>
        </form>

        {/* Resend Timer section */}
        <div className="mt-6 pt-5 border-t border-slate-800 flex flex-col items-center gap-3">
          {secondsLeft > 0 ? (
            <p className="text-xs text-slate-400">
              Resend code in <span className="font-mono font-bold text-cyan-400">00:{secondsLeft < 10 ? `0${secondsLeft}` : secondsLeft}</span>
            </p>
          ) : (
            <button
              onClick={handleResend}
              className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Resend Verification Code</span>
            </button>
          )}

          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Bank-grade cryptographic phone verification</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyOtpPage;
