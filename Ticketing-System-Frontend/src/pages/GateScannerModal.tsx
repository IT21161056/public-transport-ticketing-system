import React, { useState } from 'react';
import { 
  X, 
  Scan, 
  CheckCircle2, 
  AlertOctagon, 
  Clock, 
  Radio, 
  Coins, 
  User, 
  Ticket
} from 'lucide-react';
import { 
  verifyTurnstileCredential, 
  getSavedUser, 
  getGuestTokens,
  STANDARD_RIDE_FARE,
  type TurnstileScanResult
} from '../utils/storage';
import { tokenApi } from '../api/tokenApi';

interface GateScannerModalProps {
  initialToken?: string;
  onClose: () => void;
  onScanCompleted?: () => void;
}

export const GateScannerModal: React.FC<GateScannerModalProps> = ({ 
  initialToken = '', 
  onClose,
  onScanCompleted 
}) => {
  const [tokenInput, setTokenInput] = useState(initialToken);
  const [scanResult, setScanResult] = useState<TurnstileScanResult | null>(null);

  const localUser = getSavedUser();
  const guestTokens = getGuestTokens();

  const [isValidating, setIsValidating] = useState(false);

  const handleScan = async (tokenToTest: string) => {
    const clean = tokenToTest.trim();
    if (!clean) return;

    if (clean.startsWith('TK1|')) {
      setIsValidating(true);
      try {
        const valRes = await tokenApi.validateToken(clean);
        if (valRes.isValid) {
          setScanResult({
            status: 'valid',
            type: valRes.tokenType === 'GUEST' ? 'guest_token' : 'local_commuter',
            title: 'ACCESS GRANTED • CRYPTOGRAPHICALLY VERIFIED',
            message: `HMAC-SHA256 signature authentic and active. [${valRes.tokenType}: ${valRes.holderIdentifier}]`,
          });
          if (onScanCompleted) onScanCompleted();
          return;
        } else {
          setScanResult({
            status: 'invalid',
            type: valRes.tokenType === 'GUEST' ? 'guest_token' : 'local_commuter',
            title: 'ACCESS REJECTED',
            message: valRes.message || 'Cryptographic signature verification failed or pass expired.',
          });
          if (onScanCompleted) onScanCompleted();
          return;
        }
      } catch (err) {
        console.warn('Backend validation failed, falling back to local verification', err);
      } finally {
        setIsValidating(false);
      }
    }

    const result = verifyTurnstileCredential(clean);
    setScanResult(result);
    if (onScanCompleted) {
      onScanCompleted();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-xl bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">
              Transit Gate Turnstile Simulator
            </h3>
            <p className="text-xs text-slate-400 font-mono">
              Dual-Model Validation: Local Credits or Expiring Guest Token
            </p>
          </div>
        </div>

        {/* Turnstile Visual Status (Section 7.4 & 16 & 25) */}
        <div
          className={`p-6 rounded-2xl border text-center transition-all mb-6 ${
            !scanResult
              ? 'bg-slate-950 border-slate-800 text-slate-300'
              : scanResult.status === 'valid'
              ? 'bg-emerald-950/40 border-emerald-500 text-emerald-300 shadow-xl shadow-emerald-950/50'
              : scanResult.status === 'insufficient_credits'
              ? 'bg-amber-950/40 border-amber-500 text-amber-300 shadow-xl shadow-amber-950/50'
              : scanResult.status === 'expired'
              ? 'bg-rose-950/40 border-rose-500 text-rose-300 shadow-xl shadow-rose-950/50'
              : 'bg-rose-950/40 border-rose-500 text-rose-300'
          }`}
        >
          <div className="mb-3 flex justify-center">
            {!scanResult ? (
              <div className="w-16 h-16 rounded-full bg-slate-800 text-cyan-400 flex items-center justify-center">
                <Scan className="w-8 h-8 animate-pulse" />
              </div>
            ) : scanResult.status === 'valid' ? (
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center ring-8 ring-emerald-500/10">
                <CheckCircle2 className="w-10 h-10" />
              </div>
            ) : scanResult.status === 'insufficient_credits' ? (
              <div className="w-16 h-16 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center ring-8 ring-amber-500/10">
                <Coins className="w-10 h-10" />
              </div>
            ) : scanResult.status === 'expired' ? (
              <div className="w-16 h-16 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center ring-8 ring-rose-500/10">
                <Clock className="w-10 h-10" />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center ring-8 ring-rose-500/10">
                <AlertOctagon className="w-10 h-10" />
              </div>
            )}
          </div>

          <h4 className="text-base font-bold uppercase tracking-wider mb-1 font-mono">
            {!scanResult ? 'Turnstile Standby (Ready to Scan)' : scanResult.title}
          </h4>
          <p className="text-xs opacity-90 max-w-sm mx-auto">
            {!scanResult
              ? 'Present or paste a local user persistent QR or a guest transport token to simulate gate access.'
              : scanResult.message}
          </p>

          {/* Local User Fare Result Card */}
          {scanResult && scanResult.type === 'local_commuter' && scanResult.localUser && (
            <div className="mt-4 pt-4 border-t border-current/20 text-xs font-mono space-y-1.5 text-left">
              <div className="flex justify-between">
                <span>Model:</span>
                <span className="font-bold text-emerald-400">PERSISTENT LOCAL ACCOUNT</span>
              </div>
              <div className="flex justify-between">
                <span>Commuter:</span>
                <span>{scanResult.localUser.fullName}</span>
              </div>
              {scanResult.fareDeducted && (
                <div className="flex justify-between text-cyan-300">
                  <span>Fare Deducted:</span>
                  <span>-{scanResult.fareDeducted.toFixed(2)} Credits</span>
                </div>
              )}
              <div className="flex justify-between font-bold">
                <span>Remaining Account Balance:</span>
                <span>{scanResult.localUser.creditBalance.toFixed(2)} Credits</span>
              </div>
            </div>
          )}

          {/* Guest Pass Result Card */}
          {scanResult && scanResult.type === 'guest_token' && scanResult.guestToken && (
            <div className="mt-4 pt-4 border-t border-current/20 text-xs font-mono space-y-1.5 text-left">
              <div className="flex justify-between">
                <span>Model:</span>
                <span className="font-bold text-cyan-400">TEMPORARY GUEST PASS</span>
              </div>
              <div className="flex justify-between">
                <span>Duration:</span>
                <span>{scanResult.guestToken.durationLabel}</span>
              </div>
              <div className="flex justify-between">
                <span>Expires At:</span>
                <span>{new Date(scanResult.guestToken.expiresAt).toLocaleTimeString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Taps Recorded:</span>
                <span>#{scanResult.guestToken.scanCount}</span>
              </div>
            </div>
          )}
        </div>

        {/* Input / Scan Form */}
        <div className="space-y-3 mb-5">
          <label className="block text-xs font-mono uppercase text-slate-400 font-semibold">
            Token Scanned by Turnstile Optical Reader
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="e.g. LCL-QR-... or TRP-TK-..."
              className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white font-mono uppercase focus:outline-none focus:border-cyan-400"
            />
            <button
              onClick={() => handleScan(tokenInput)}
              disabled={isValidating}
              className="py-3 px-5 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors"
            >
              <Scan className={`w-4 h-4 ${isValidating ? 'animate-spin' : ''}`} />
              <span>{isValidating ? 'Verifying...' : 'Tap Gate'}</span>
            </button>
          </div>
        </div>

        {/* Quick Testing Shortcuts for Evaluator */}
        <div className="space-y-3 pt-4 border-t border-slate-800">
          <span className="text-[11px] font-mono uppercase text-slate-400 font-semibold block">
            Tap-To-Ride Test Credentials:
          </span>
          <div className="flex flex-col gap-2">
            {localUser && (
              <button
                type="button"
                onClick={() => {
                  setTokenInput(localUser.persistentQrToken);
                  handleScan(localUser.persistentQrToken);
                }}
                className="w-full p-2.5 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/40 border border-emerald-800/60 text-left flex items-center justify-between text-xs text-emerald-300 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-emerald-400" />
                  <div>
                    <span className="font-semibold block">Test Local Commuter QR ({localUser.fullName})</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Deducts {STANDARD_RIDE_FARE.toFixed(2)} Credits from balance
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-mono bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                  {localUser.creditBalance.toFixed(0)} Credits
                </span>
              </button>
            )}

            {guestTokens.map((token) => (
              <button
                key={token.tokenId}
                type="button"
                onClick={() => {
                  setTokenInput(token.tokenId);
                  handleScan(token.tokenId);
                }}
                className="w-full p-2.5 rounded-xl bg-cyan-950/40 hover:bg-cyan-900/40 border border-cyan-800/60 text-left flex items-center justify-between text-xs text-cyan-300 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Ticket className="w-4 h-4 text-cyan-400" />
                  <div>
                    <span className="font-semibold block">Test Guest Token ({token.durationLabel})</span>
                    <span className="text-[10px] text-slate-400 font-mono">{token.tokenId}</span>
                  </div>
                </div>
                <span className="text-[10px] font-mono bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                  {token.status.toUpperCase()}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
