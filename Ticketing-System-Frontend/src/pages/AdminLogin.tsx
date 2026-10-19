import React, { useState } from 'react';
import { Shield, User, KeyRound, Eye, EyeOff, AlertCircle, ArrowRight, Loader2 } from 'lucide-react';

export interface AdminLoginProps {
  onLogin: (usernameOrEmail: string, password: string) => Promise<{ success: boolean; message: string }>;
}

/**
 * Standalone administrator sign-in page (served at /admin/login).
 * Intentionally shares no layout, navigation or copy with the commuter flow.
 */
export const AdminLogin: React.FC<AdminLoginProps> = ({ onLogin }) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!identifier.trim() || !password) {
      setError('Username/email and password are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await onLogin(identifier.trim(), password);
      if (!res.success) setError(res.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute -top-32 -right-32 w-[28rem] h-[28rem] bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-[28rem] h-[28rem] bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl p-7 sm:p-9 shadow-2xl backdrop-blur-xl">
        <div className="text-center mb-7">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-950/50 mb-4">
            <Shield className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Admin Console</h1>
          <p className="text-xs text-slate-400 mt-1">
            Transit Authority staff only. Authorised access required.
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3 rounded-xl bg-rose-950/50 border border-rose-800/60 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label htmlFor="admin-identifier" className="text-xs font-medium text-slate-300">
              Username or email
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-purple-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="admin-identifier"
                type="text"
                autoComplete="username"
                autoFocus
                required
                aria-invalid={!!error}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:border-purple-400"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="admin-password" className="text-xs font-medium text-slate-300">
              Password
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-purple-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="admin-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                aria-invalid={!!error}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-11 py-3 text-sm text-white focus:outline-none focus:border-purple-400"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer p-1"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-60 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-purple-950/40 transition-all cursor-pointer"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
            <span>{isSubmitting ? 'Signing in…' : 'Sign in'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
