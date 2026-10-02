import React, { useState } from 'react';
import { User, Smartphone, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import type { AppRoute } from '../types';
import AuthLayout from '../layouts/AuthLayout';
import Input from '../components/Input';
import Button from '../components/Button';
import { isValidFullName, isValidPhoneNumber } from '../utils/validation';

export interface RegisterProps {
  onNavigate: (route: AppRoute) => void;
  onRequestOtp: (fullName: string, phone: string, mode: 'register' | 'login') => void;
}

export const Register: React.FC<RegisterProps> = ({ onNavigate, onRequestOtp }) => {
  const [fullName, setFullName] = useState('');
  const [phonePrefix, setPhonePrefix] = useState('+94');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isValidFullName(fullName)) {
      setError('Please provide your full legal name (at least 2 letters)');
      return;
    }

    const fullPhone = `${phonePrefix} ${phoneNumber.trim()}`;
    if (!isValidPhoneNumber(fullPhone)) {
      setError('Please enter a valid phone number (at least 9 digits)');
      return;
    }

    setIsSubmitting(true);
    try {
      await onRequestOtp(fullName.trim(), fullPhone, 'register');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Create Account"
      subtitle="Minimal-data registration with instant commuter QR"
      onNavigate={onNavigate}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Minimal Data Guarantee */}
        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-start gap-2.5 text-xs text-slate-300">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <p className="text-[11px] text-slate-400">
            <strong>Minimal PII Standard:</strong> Only your name and phone number are required. No passwords to remember, no credit card required to register.
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-800/60 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <Input
          label="Full Legal Name"
          placeholder="e.g. Kasun Perera"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          leftIcon={<User className="w-4 h-4" />}
          required
          autoFocus
        />

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-300">
            Mobile Phone Number <span className="text-cyan-400">*</span>
          </label>
          <div className="flex gap-2">
            <select
              value={phonePrefix}
              onChange={(e) => setPhonePrefix(e.target.value)}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-cyan-500 font-mono transition-colors"
            >
              <option value="+94">LK (+94)</option>
              <option value="+1">US (+1)</option>
              <option value="+44">UK (+44)</option>
              <option value="+61">AU (+61)</option>
              <option value="+65">SG (+65)</option>
              <option value="+91">IN (+91)</option>
              <option value="+971">AE (+971)</option>
            </select>

            <Input
              type="tel"
              placeholder="77 123 4567"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              leftIcon={<Smartphone className="w-4 h-4" />}
              required
            />
          </div>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full mt-2"
          isLoading={isSubmitting}
          rightIcon={<ArrowRight className="w-4 h-4" />}
        >
          Verify Phone via SMS OTP
        </Button>

        {/* Switch to Login */}
        <div className="pt-2 text-center text-xs text-slate-400">
          <span>Already registered? </span>
          <button
            type="button"
            onClick={() => onNavigate('login')}
            className="text-cyan-400 hover:text-cyan-300 font-semibold underline underline-offset-4 decoration-cyan-500/30"
          >
            Log in with phone
          </button>
        </div>
      </form>
    </AuthLayout>
  );
};

export default Register;
