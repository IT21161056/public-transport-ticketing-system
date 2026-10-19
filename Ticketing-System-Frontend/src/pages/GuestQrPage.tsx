import React, { useRef, useState, useEffect } from 'react';
import { ArrowLeft, Ticket, UserPlus } from 'lucide-react';
import { QRViewer } from '../components/QRViewer';
import type { GuestTransportToken, AppRoute } from '../types';

interface GuestQrPageProps {
  token: GuestTransportToken;
  onNavigate: (route: AppRoute) => void;
}

export const GuestQrPage: React.FC<GuestQrPageProps> = ({ token, onNavigate }) => {
  const [remainingTime, setRemainingTime] = useState<string>('');
  const cardRef = useRef<HTMLDivElement>(null);

  // Live countdown timer until token expiration
  useEffect(() => {
    const updateCountdown = () => {
      const now = Date.now();
      const expires = new Date(token.expiresAt).getTime();
      const diff = expires - now;

      if (diff <= 0) {
        setRemainingTime('Expired');
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setRemainingTime(`${hours}h ${minutes}m ${seconds}s remaining`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [token.expiresAt]);

  const formattedExpires = new Date(token.expiresAt).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="max-w-xl mx-auto w-full py-4 sm:py-6">
      {/* Top navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => onNavigate('landing')}
          className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </button>

        <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          Active Guest Pass
        </span>
      </div>

      {/* Main Pass Card */}
      <div
        ref={cardRef}
        className="relative overflow-hidden rounded-3xl bg-slate-900/95 border-2 border-cyan-500/40 shadow-2xl shadow-cyan-950/80 backdrop-blur-2xl p-6 sm:p-7"
      >
        <div className="text-center mb-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 text-cyan-400 text-xs font-mono font-bold mb-2 border border-cyan-800/50">
            <span>TEMPORARY GUEST ACCESS</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Your transport access is ready
          </h2>
        </div>

        {/* Center QR Code Viewer */}
        <div className="my-5">
          <QRViewer
            value={token.signedToken || token.tokenId}
            size={200}
            level="H"
            tokenType="GuestPass"
            holderIdentifier={`Device UUID: ${token.guestId}`}
            expiresAt={token.expiresAt}
            title="Guest Transport Clearance"
            subtitle={`${token.durationLabel} (${token.days * 24}h) Unlimited Transit Pass`}
            id="guest-qr-svg"
            showScreenshotNotice={true}
          />
        </div>

        {/* Pass Details */}
        <div className="space-y-3 pt-3 border-t border-slate-800 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 font-medium">Access Period</span>
            <span className="font-bold text-cyan-300 font-mono text-sm">
              {token.durationLabel} ({token.days * 24} Hours)
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-400 font-medium">Pass Status</span>
            <span className="inline-flex items-center gap-1.5 font-bold font-mono text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              {token.status.toUpperCase()}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-400 font-medium">Expires At</span>
            <span className="font-mono text-emerald-400 font-semibold">{formattedExpires}</span>
          </div>

          <div className="flex items-center justify-between text-slate-400">
            <span>Remaining Validity:</span>
            <span aria-live="polite" className="font-mono text-cyan-300 font-semibold">{remainingTime}</span>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
            <span>Guest ID: {token.guestId}</span>
            <span>Taps recorded: {token.scanCount}</span>
          </div>
        </div>
      </div>

      {/* Passenger Navigation Actions */}
      <div className="mt-4 flex flex-col sm:flex-row gap-3">
        <button
          onClick={() => onNavigate('guest-period')}
          className="flex-1 py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          <Ticket className="w-4 h-4 text-cyan-400" />
          <span>Purchase Another Pass</span>
        </button>
        <button
          onClick={() => onNavigate('register')}
          className="flex-1 py-3 px-4 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>Create Commuter Account</span>
        </button>
      </div>
    </div>
  );
};
