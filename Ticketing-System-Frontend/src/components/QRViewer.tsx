import React, { useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { 
  Download, 
  Check, 
  Copy, 
  ShieldCheck, 
  Camera
} from 'lucide-react';

export interface QRViewerProps {
  value: string;
  size?: number;
  level?: 'L' | 'M' | 'Q' | 'H';
  title?: string;
  subtitle?: string;
  holderIdentifier?: string;
  tokenType?: 'LocalUser' | 'GuestPass';
  expiresAt?: string | null;
  allowDownload?: boolean;
  allowCopy?: boolean;
  showScreenshotNotice?: boolean;
  id?: string;
  className?: string;
}

export const QRViewer: React.FC<QRViewerProps> = ({
  value,
  size = 220,
  level = 'H',
  title,
  subtitle,
  holderIdentifier,
  tokenType = 'LocalUser',
  expiresAt,
  allowDownload = true,
  allowCopy = true,
  showScreenshotNotice = tokenType === 'GuestPass',
  id = 'transit-qr-svg',
  className = '',
}) => {
  const [downloaded, setDownloaded] = useState(false);
  const [copied, setCopied] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleDownload = () => {
    const svg = document.getElementById(id);
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
        downloadLink.download = `TransitPass-${tokenType}-${Date.now().toString().slice(-6)}.png`;
        downloadLink.href = pngFile;
        downloadLink.click();
        setDownloaded(true);
        setTimeout(() => setDownloaded(false), 3000);
      }
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const isGuest = tokenType === 'GuestPass';

  return (
    <div ref={containerRef} className={`flex flex-col items-center w-full max-w-sm mx-auto ${className}`}>
      {/* QR Container Card */}
      <div className="relative w-full rounded-3xl bg-slate-900/90 border border-slate-800 p-6 sm:p-7 shadow-2xl backdrop-blur-xl flex flex-col items-center text-center">
        {/* Ambient Top Glow */}
        <div 
          className={`absolute top-0 left-1/2 -translate-x-1/2 w-48 h-20 blur-2xl pointer-events-none rounded-full ${
            isGuest ? 'bg-cyan-500/15' : 'bg-emerald-500/15'
          }`} 
        />

        {/* Security Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950/80 border border-slate-700/80 text-[11px] font-medium text-slate-300 mb-4 shadow-inner">
          <ShieldCheck className={`w-3.5 h-3.5 ${isGuest ? 'text-cyan-400' : 'text-emerald-400'}`} />
          <span>HMAC-SHA256 Signed</span>
          <span className="text-slate-500">•</span>
          <span className="font-mono text-[10px] text-slate-400">{tokenType}</span>
        </div>

        {title && (
          <h3 className="text-lg font-bold text-white tracking-tight mb-1">
            {title}
          </h3>
        )}

        {subtitle && (
          <p className="text-xs text-slate-400 mb-5 max-w-xs">
            {subtitle}
          </p>
        )}

        {/* Crisp QR Frame */}
        <div className="relative p-4 rounded-2xl bg-white shadow-2xl ring-4 ring-slate-800/80 hover:ring-cyan-500/40 transition-all duration-300">
          <QRCodeSVG
            id={id}
            value={value}
            size={size}
            level={level}
            bgColor="#ffffff"
            fgColor="#020617"
            includeMargin={false}
          />
        </div>

        {/* Identifier / Expiry info */}
        <div className="mt-5 w-full space-y-2">
          {holderIdentifier && (
            <div className="flex items-center justify-between text-xs px-3 py-1.5 rounded-lg bg-slate-950/70 border border-slate-800/80">
              <span className="text-slate-400 font-medium">Identifier:</span>
              <span className="font-mono text-slate-200 font-semibold truncate max-w-[180px]">
                {holderIdentifier}
              </span>
            </div>
          )}

          {expiresAt !== undefined && (
            <div className="flex items-center justify-between text-xs px-3 py-1.5 rounded-lg bg-slate-950/70 border border-slate-800/80">
              <span className="text-slate-400 font-medium">Validity:</span>
              <span className="font-mono text-slate-200 font-semibold">
                {expiresAt ? new Date(expiresAt).toLocaleString() : 'Permanent Account Pass'}
              </span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-5 grid grid-cols-2 gap-2.5 w-full">
          {allowDownload && (
            <button
              onClick={handleDownload}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-white text-xs font-semibold border border-slate-700 transition-all active:scale-95 shadow-sm"
              title="Save QR Code as PNG"
            >
              {downloaded ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-300">Saved</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Save Image</span>
                </>
              )}
            </button>
          )}

          {allowCopy && (
            <button
              onClick={handleCopy}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-white text-xs font-semibold border border-slate-700 transition-all active:scale-95 shadow-sm"
              title="Copy Signed Token Payload"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-300">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span>Copy Token</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Screenshot Advisory for Guests */}
        {showScreenshotNotice && (
          <div className="mt-4 p-3 rounded-xl bg-cyan-950/40 border border-cyan-800/40 flex items-start gap-2.5 text-left text-xs">
            <Camera className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <p className="text-[11px] text-cyan-200/90 leading-relaxed">
              <strong>Tip:</strong> Take a screenshot now. Guest access is linked to this device and can be redeemed from your camera roll at any station.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default QRViewer;
