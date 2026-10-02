import React, { useRef, useState, useEffect } from 'react';
import { 
  Download, 
  Check, 
  Camera, 
  ArrowLeft, 
  Scan
} from 'lucide-react';
import { QRViewer } from '../components/QRViewer';
import type { GuestTransportToken, AppRoute } from '../types';

interface GuestQrPageProps {
  token: GuestTransportToken;
  onNavigate: (route: AppRoute) => void;
  onOpenScanner: (token: string) => void;
}

export const GuestQrPage: React.FC<GuestQrPageProps> = ({ token, onNavigate, onOpenScanner }) => {
  const [downloaded, setDownloaded] = useState(false);
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

  const handleSaveQr = () => {
    const svg = document.getElementById('guest-qr-svg');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = 600;
      canvas.height = 600;
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 50, 50, 500, 500);
        const pngFile = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.download = `UrbanTransit-GuestPass-${token.tokenId}.png`;
        downloadLink.href = pngFile;
        downloadLink.click();
        setDownloaded(true);
        setTimeout(() => setDownloaded(false), 3000);
      }
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  return (
    <div className="max-w-xl mx-auto w-full py-4 sm:py-6">
      {/* Top navigation */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => onNavigate('landing')}
          className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </button>

        <button
          onClick={() => onOpenScanner(token.tokenId)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-semibold transition-all"
        >
          <Scan className="w-3.5 h-3.5" />
          <span>Test at Turnstile Gate</span>
        </button>
      </div>

      {/* Screenshot note (GEMINI Section 14.2) */}
      <div className="mb-4 p-3 rounded-2xl bg-cyan-950/40 border border-cyan-800/50 flex items-center justify-between text-xs text-cyan-200">
        <div className="flex items-center gap-2">
          <Camera className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>Screenshot-ready layout. All critical security tokens included.</span>
        </div>
        <span className="text-[10px] font-mono uppercase bg-cyan-900/60 px-2 py-0.5 rounded text-cyan-300">
          Save backup
        </span>
      </div>

      {/* Main Pass Card (GEMINI Section 15 & 20) */}
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
            showScreenshotNotice={false}
          />
        </div>

        {/* Pass Details (GEMINI Section 20) */}
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
            <span className="font-mono text-cyan-300 font-semibold">{remainingTime}</span>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
            <span>Guest: {token.guestId}</span>
            <span>Taps recorded: {token.scanCount}</span>
          </div>
        </div>

        {/* Action Button: Save QR (GEMINI Section 20) */}
        <button
          onClick={handleSaveQr}
          className="w-full mt-6 py-4 px-6 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 transition-all transform active:scale-[0.99]"
        >
          {downloaded ? (
            <>
              <Check className="w-4 h-4 text-slate-950" />
              <span>QR Code Saved!</span>
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              <span>Save QR</span>
            </>
          )}
        </button>
      </div>

      {/* Test at Turnstile button */}
      <div className="mt-4">
        <button
          onClick={() => onOpenScanner(token.tokenId)}
          className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
        >
          <Scan className="w-4 h-4 text-cyan-400" />
          <span>Simulate Turnstile Gate Scan</span>
        </button>
      </div>
    </div>
  );
};
