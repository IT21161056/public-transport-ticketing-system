import React from 'react';
import { MessageSquare, Copy, Check, X, ShieldAlert } from 'lucide-react';

interface NotificationToastProps {
  otpCode: string | null;
  phoneNumber?: string;
  onClose: () => void;
  onUseCode?: (code: string) => void;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({
  otpCode,
  phoneNumber,
  onClose,
  onUseCode,
}) => {
  const [copied, setCopied] = React.useState(false);

  if (!otpCode) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(otpCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed top-20 right-4 sm:right-6 z-50 max-w-sm w-full animate-bounce-short">
      <div className="bg-slate-900/95 border border-cyan-500/40 rounded-2xl p-4 shadow-2xl shadow-cyan-950/80 backdrop-blur-xl">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0 border border-cyan-500/30">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                  Transit SMS Service
                </span>
                <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-mono">
                  just now
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                {phoneNumber ? `Verification code sent to ${phoneNumber}:` : 'Your one-time UrbanTransit verification code is:'}
              </p>
              <div className="mt-2 flex items-center gap-2">
                <span className="font-mono text-xl font-bold tracking-widest text-white bg-slate-950 px-3 py-1 rounded-lg border border-slate-800">
                  {otpCode}
                </span>
                {onUseCode && (
                  <button
                    onClick={() => onUseCode(otpCode)}
                    className="text-xs px-2.5 py-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 border border-cyan-500/30 font-medium transition-colors"
                  >
                    Auto-Fill
                  </button>
                )}
                <button
                  onClick={handleCopy}
                  className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-lg transition-colors"
                  title="Copy code"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[10px] text-slate-400 mt-1.5 flex items-center gap-1">
                <ShieldAlert className="w-3 h-3 text-amber-400" />
                Never share your code. Expires in 5 minutes.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
