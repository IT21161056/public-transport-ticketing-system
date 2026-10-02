import React, { useState } from 'react';
import { LogIn, ArrowRight, ArrowLeft, Info, ShieldCheck } from 'lucide-react';
import type { AppRoute } from '../types';

interface LoginPageProps {
  onNavigate: (route: AppRoute) => void;
  onRequestOtp: (fullName: string, phone: string, mode: 'register' | 'login') => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onNavigate, onRequestOtp }) => {
  const [phonePrefix, setPhonePrefix] = useState('+94');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanPhone = phoneNumber.replace(/[\s-]/g, '');
    if (!cleanPhone || cleanPhone.length < 7 || !/^\d+$/.test(cleanPhone)) {
      setError('Please enter a valid phone number');
      return;
    }

    const fullPhone = `${phonePrefix} ${cleanPhone}`;
    onRequestOtp('', fullPhone, 'login');
  };

  return (
    <div className="max-w-md mx-auto w-full py-8 px-4">
      <button
        onClick={() => onNavigate('landing')}
        className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to options</span>
      </button>

      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-400 mx-auto flex items-center justify-center mb-3 border border-cyan-500/20">
            <LogIn className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Commuter Login</h2>
          <p className="text-xs text-slate-400 mt-1">
            Access your transport account with your registered phone number.
          </p>
        </div>

        <div className="mb-6 p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-start gap-2.5 text-xs text-slate-300">
          <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-white">Passwordless Authentication</span>
            <p className="text-slate-400 text-[11px] mt-0.5">
              Secure one-time SMS verification. No passwords to remember or reset.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-5 p-3 rounded-xl bg-rose-950/50 border border-rose-800/60 text-rose-300 text-xs flex items-center gap-2">
            <Info className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
              Registered Phone Number <span className="text-cyan-400">*</span>
            </label>
            <div className="flex gap-2">
              <select
                value={phonePrefix}
                onChange={(e) => setPhonePrefix(e.target.value)}
                className="bg-slate-950/80 border border-slate-700 rounded-xl px-3 py-3.5 text-sm text-slate-200 font-mono focus:outline-none focus:border-cyan-400 transition-colors"
              >
                <option value="+94">LK (+94)</option>
                <option value="+1">US (+1)</option>
                <option value="+44">UK (+44)</option>
                <option value="+61">AU (+61)</option>
                <option value="+65">SG (+65)</option>
                <option value="+91">IN (+91)</option>
                <option value="+971">AE (+971)</option>
              </select>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="77 123 4567"
                required
                className="flex-1 bg-slate-950/80 border border-slate-700 rounded-xl px-4 py-3.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-colors font-mono"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              We'll send an instant 6-digit access code to this number.
            </p>
          </div>

          <button
            type="submit"
            className="w-full mt-2 py-4 px-6 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 transition-all transform active:scale-[0.99]"
          >
            <span>Send Login Code</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-slate-800 text-center">
          <p className="text-xs text-slate-400">
            Don't have an account yet?{' '}
            <button
              onClick={() => onNavigate('register')}
              className="text-cyan-400 hover:underline font-semibold"
            >
              Register in 1 minute
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
