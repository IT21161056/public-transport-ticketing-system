import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, ArrowLeft, RefreshCw, AlertCircle, KeyRound } from 'lucide-react';
import type { AppRoute } from '../types';

interface VerifyOtpPageProps {
  phoneNumber: string;
  fullName: string;
  expectedOtp: string;
  mode: 'register' | 'login';
  onNavigate: (route: AppRoute) => void;
  onVerifySuccess: () => void;
  onResendOtp: () => void;
  onVerifyCode?: (code: string) => Promise<{ success: boolean; message?: string }>;
}

export const VerifyOtpPage: React.FC<VerifyOtpPageProps> = ({
  phoneNumber,
  expectedOtp,
  mode,
  onNavigate,
  onVerifySuccess,
  onResendOtp,
  onVerifyCode,
}) => {
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [secondsLeft, setSecondsLeft] = useState(45);
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isExpired] = useState(false);

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

  // Timer countdown
  useEffect(() => {
    if (secondsLeft <= 0) {
      return;
    }
    const timer = setInterval(() => {
      setSecondsLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [secondsLeft]);

  // Focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

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
    if (isExpired) {
      setError('Verification code has expired. Please request a new code.');
      return;
    }

    setIsVerifying(true);
    setError(null);

    try {
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

  return (
    <div className="max-w-md mx-auto w-full py-8 px-4">
      {/* Change phone button */}
      <button
        onClick={() => onNavigate(mode === 'register' ? 'register' : 'login')}
        className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors mb-6"
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
            className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 transition-all"
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
              className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1.5 transition-colors"
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
