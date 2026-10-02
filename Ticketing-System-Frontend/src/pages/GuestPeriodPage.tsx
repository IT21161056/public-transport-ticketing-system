import React, { useState } from 'react';
import { ArrowRight, ArrowLeft, Check, Zap } from 'lucide-react';
import type { AccessDurationDays, AppRoute, GuestSession, RegisteredUser } from '../types';
import { DURATION_OPTIONS } from '../utils/storage';

interface GuestPeriodPageProps {
  guestSession: GuestSession | null;
  user: RegisteredUser | null;
  onNavigate: (route: AppRoute) => void;
  onSelectPeriod: (duration: AccessDurationDays) => void;
}

export const GuestPeriodPage: React.FC<GuestPeriodPageProps> = ({
  guestSession,
  user,
  onNavigate,
  onSelectPeriod,
}) => {
  const [selectedDays, setSelectedDays] = useState<AccessDurationDays>(3);

  const selectedOption = DURATION_OPTIONS.find((o) => o.days === selectedDays)!;

  const handleContinue = () => {
    onSelectPeriod(selectedDays);
  };

  return (
    <div className="max-w-xl mx-auto w-full py-4 sm:py-6">
      {/* Back button */}
      <button
        onClick={() => onNavigate(user ? 'profile' : 'landing')}
        className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back</span>
      </button>

      {/* Header Info */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/70 text-cyan-400 text-xs font-medium mb-3 border border-cyan-800/60">
          <Zap className="w-3.5 h-3.5" />
          <span>{user ? 'Commuter Pass Purchase' : 'Temporary Guest Access'}</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Select Access Duration
        </h1>
        <p className="text-slate-400 text-xs sm:text-sm mt-1 max-w-md mx-auto">
          Choose the validity period for your digital transport pass. Activates immediately upon payment.
        </p>
      </div>

      {/* Session reference bar for Guest */}
      {!user && guestSession && (
        <div className="mb-6 p-3 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
            <span>Temporary Guest Identity:</span>
            <span className="font-mono text-cyan-300 font-semibold">{guestSession.guestId}</span>
          </div>
          <span className="hidden sm:inline font-mono text-[10px] text-slate-500">
            Device: {guestSession.deviceId}
          </span>
        </div>
      )}

      {/* Duration Options Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {DURATION_OPTIONS.map((option) => {
          const isSelected = selectedDays === option.days;
          return (
            <div
              key={option.days}
              onClick={() => setSelectedDays(option.days)}
              className={`relative cursor-pointer rounded-2xl p-5 border transition-all text-left flex flex-col justify-between ${
                isSelected
                  ? 'bg-gradient-to-br from-cyan-950/40 via-slate-900 to-slate-900 border-cyan-400 ring-2 ring-cyan-400/20 shadow-xl shadow-cyan-950/60'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/90'
              }`}
            >
              {/* Badges */}
              {option.popular && (
                <div className="absolute -top-2.5 right-4 bg-gradient-to-r from-cyan-500 to-teal-400 text-slate-950 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow">
                  Most Popular
                </div>
              )}
              {option.bestValue && (
                <div className="absolute -top-2.5 right-4 bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow">
                  Best Value
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center border transition-colors ${
                        isSelected
                          ? 'border-cyan-400 bg-cyan-400 text-slate-950'
                          : 'border-slate-600 bg-slate-950'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                    <span className="font-bold text-lg text-white">{option.label}</span>
                  </div>
                  <span className="font-mono text-xs text-slate-400 bg-slate-950 px-2 py-1 rounded border border-slate-800">
                    {option.hours} hrs
                  </span>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  {option.description}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-800/80 flex items-baseline justify-between">
                <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                  Fixed Rate
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-white font-mono">
                    ${option.price.toFixed(2)}
                  </span>
                  <span className="text-[11px] text-slate-400">USD</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Access Summary Bottom Card (GEMINI Section 11) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-5">
          <div className="text-center sm:text-left">
            <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
              Selected Duration
            </span>
            <div className="flex items-center gap-3 mt-1 justify-center sm:justify-start">
              <span className="text-xl font-bold text-white">{selectedOption.label} Access</span>
              <span className="font-mono text-xs bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 px-2.5 py-0.5 rounded-full font-semibold">
                Valid for {selectedOption.hours} Hours
              </span>
            </div>
          </div>

          <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-end">
            <div className="text-right">
              <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block">
                Total to Pay
              </span>
              <span className="text-2xl sm:text-3xl font-black text-cyan-400 font-mono">
                ${selectedOption.price.toFixed(2)}
              </span>
            </div>

            <button
              onClick={handleContinue}
              className="py-3.5 px-6 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-slate-950 font-bold text-sm flex items-center gap-2 shadow-lg shadow-cyan-500/20 transition-all transform active:scale-[0.99]"
            >
              <span>Continue</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
