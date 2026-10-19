import React, { useRef } from 'react';
import { 
  Train, 
  Coins, 
  PlusCircle 
} from 'lucide-react';
import { QRViewer } from '../components/QRViewer';
import type { RegisteredUser, AppRoute } from '../types';
import { STANDARD_RIDE_FARE } from '../utils/storage';

interface LocalQrPageProps {
  user: RegisteredUser;
  onNavigate: (route: AppRoute) => void;
}

export const LocalQrPage: React.FC<LocalQrPageProps> = ({ user, onNavigate }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const isLowBalance = (user.creditBalance ?? 0) < STANDARD_RIDE_FARE;

  return (
    <div className="max-w-xl mx-auto w-full py-4 sm:py-6">
      {/* Main Pass Card */}
      <div
        ref={cardRef}
        className="relative overflow-hidden rounded-3xl bg-slate-900/95 border-2 border-emerald-500/40 shadow-2xl shadow-emerald-950/80 backdrop-blur-2xl p-6 sm:p-7"
      >
        {/* Pass Header */}
        <div className="flex items-center justify-between pb-5 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 shadow-md">
              <Train className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <span className="text-sm font-bold text-white tracking-tight block">UrbanTransit</span>
              <span className="text-[10px] text-slate-400 font-mono">Persistent Commuter Credential</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-bold font-mono">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>ACCOUNT: {user.accountStatus.toUpperCase()}</span>
          </div>
        </div>

        {/* Center Persistent QR Viewer */}
        <div className="my-5">
          <QRViewer
            value={user.persistentQrToken}
            size={200}
            level="H"
            tokenType="LocalUser"
            holderIdentifier={`${user.fullName} (${user.userId})`}
            title="Persistent Commuter Pass"
            subtitle="Reusable multi-ride contactless QR pass"
            id="local-user-qr-svg"
            showScreenshotNotice={false}
          />
        </div>

        {/* Account Credits Display */}
        <div className={`p-4 rounded-2xl border text-center transition-all mb-5 ${
          isLowBalance 
            ? 'bg-amber-950/40 border-amber-500/50 text-amber-300' 
            : 'bg-slate-950/80 border-slate-800 text-white'
        }`}>
          <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block mb-0.5">
            Account Credit Balance
          </span>
          <div className="flex items-center justify-center gap-2">
            <Coins className={`w-5 h-5 ${isLowBalance ? 'text-amber-400' : 'text-emerald-400'}`} />
            <span className="text-2xl font-black font-mono tracking-tight">
              {(user.creditBalance ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-xs text-slate-400 font-mono">Credits</span>
          </div>
          {isLowBalance ? (
            <p className="text-[11px] text-amber-400 mt-1.5 font-medium">
              ⚠️ Low balance! Minimum ride fare is {STANDARD_RIDE_FARE.toFixed(2)} Credits. Top-up required.
            </p>
          ) : (
            <p className="text-[11px] text-slate-400 mt-1">
              Standard turnstile fare: {STANDARD_RIDE_FARE.toFixed(2)} credits per tap.
            </p>
          )}
        </div>

        {/* Primary Action: Top up credits */}
        <button
          onClick={() => onNavigate('account-credits')}
          className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all transform active:scale-[0.99] mb-3 cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Top Up Credits</span>
        </button>

        {/* Persistent QR Notice */}
        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-[11px] text-slate-400 text-center leading-relaxed">
          <span className="text-emerald-400 font-semibold">Persistent Commuter Pass:</span> This QR does not expire after one ride. Reuse the same QR repeatedly as long as your account balance is maintained.
        </div>
      </div>

      {/* Connected navigation footer link */}
      <div className="mt-4 text-center">
        <button
          onClick={() => onNavigate('profile')}
          className="text-xs text-slate-400 hover:text-emerald-400 transition-colors inline-flex items-center gap-1 cursor-pointer"
        >
          <span>View personal ride logs & transaction history →</span>
        </button>
      </div>
    </div>
  );
};
