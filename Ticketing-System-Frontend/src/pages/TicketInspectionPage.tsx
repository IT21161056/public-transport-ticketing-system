import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import QrScanner from 'qr-scanner';
import {
  AlertTriangle,
  Camera,
  CameraOff,
  CheckCircle2,
  Clock,
  ImageUp,
  Loader2,
  MapPin,
  Repeat,
  ScanLine,
  Ticket,
  XCircle,
  ShieldCheck,
  Sparkles,
  Info,
  KeyRound,
  History,
} from 'lucide-react';
import { inspectionApi } from '../api/inspectionApi';
import type { InspectionResponse, InspectionResultCode } from '../types/inspection';

const LOCATION_STORAGE_KEY = 'inspector_location';

const RESULT_LABELS: Record<InspectionResultCode, string> = {
  Valid: 'Valid Ticket • Clearance Granted',
  NoActiveJourney: 'No Active Journey • Not Tapped In',
  StaleJourney: 'Stale Journey • Travel Time Exceeded',
  InvalidToken: 'Invalid Token • Cryptographic Tampering',
  Expired: 'Pass Expired • Validity Period Ended',
  AccountSuspended: 'Account Suspended • Travel Barred',
};

/**
 * Audio feedback for the inspector (design: FeedbackDisplay).
 * One high beep for a valid ticket, two low beeps for an invalid one.
 */
function playFeedbackTone(isValid: boolean) {
  try {
    const context = new AudioContext();
    const offsets = isValid ? [0] : [0, 0.22];
    offsets.forEach((offset) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.frequency.value = isValid ? 880 : 330;
      gain.gain.value = 0.15;
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(context.currentTime + offset);
      oscillator.stop(context.currentTime + offset + 0.15);
    });
    setTimeout(() => void context.close(), 800);
  } catch {
    // Audio is optional; the visual result is always shown
  }
}

function readStoredLocation(): string {
  try {
    return localStorage.getItem(LOCATION_STORAGE_KEY) ?? 'Route 100 - Bus NB-5542';
  } catch {
    return 'Route 100 - Bus NB-5542';
  }
}

function toLocalTime(utc: string): string {
  const iso = /Z|[+-]\d{2}:\d{2}$/.test(utc) ? utc : `${utc}Z`;
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function formatMinutesAgo(minutes: number): string {
  if (minutes < 60) return `${minutes}m ago`;
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m ago`;
}

function shortTokenId(identifier: string): string {
  if (!identifier) return '—';
  return identifier.length > 14 ? `…${identifier.slice(-10).toUpperCase()}` : identifier;
}

function ticketTypeLabel(tokenType: string): string {
  if (tokenType === 'LOCAL') return 'Local Commuter Pass';
  if (tokenType === 'GUEST') return 'Tourist Guest Pass';
  return 'Unknown Credential';
}

interface DemoTokenPreset {
  label: string;
  type: 'valid' | 'warning' | 'invalid';
  description: string;
  token: string;
}

const DEMO_PRESETS: DemoTokenPreset[] = [
  {
    label: 'Valid Commuter (Kasun Perera)',
    type: 'valid',
    description: 'Active commuter account with valid balance',
    token: 'TK1|LOCAL|demo-user-1|0|a1b2c3d4|DEMOSIG1',
  },
  {
    label: 'Valid Commuter (Sanduni Fernando)',
    type: 'valid',
    description: 'Active commuter account',
    token: 'TK1|LOCAL|demo-user-2|0|e5f6g7h8|DEMOSIG2',
  },
  {
    label: 'Suspended Account (Nimal Jayasinghe)',
    type: 'warning',
    description: 'Account flagged & suspended in registry',
    token: 'TK1|LOCAL|demo-user-3|0|i9j0k1l2|DEMOSIG3',
  },
  {
    label: 'Tampered Signature (Counterfeit)',
    type: 'invalid',
    description: 'Forged cryptographic HMAC checksum',
    token: 'TK1|LOCAL|fake-user-999|0|badnonce|FORGEDSIGNATURECHECKSUM999',
  },
];

/**
 * Ticket Inspector screen (design: UI 8.5 Inspector Flow).
 * Scan a passenger's QR token by live camera, photo, or paste, then show VALID / INVALID.
 */
export const TicketInspectionPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [location, setLocation] = useState(readStoredLocation);
  const [manualPayload, setManualPayload] = useState('');
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<InspectionResponse | null>(null);
  const [recentChecks, setRecentChecks] = useState<InspectionResponse[]>([]);

  // Browsers only allow live camera access on HTTPS or localhost
  const canUseLiveCamera = window.isSecureContext && !!navigator.mediaDevices;

  // The admin layout switches tabs with ?tab=; return to the dashboard when a sidebar tab is chosen here
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) {
      navigate(`/admin?tab=${tab}`, { replace: true });
    }
  }, [searchParams, navigate]);

  const inspect = useCallback(
    async (payload: string) => {
      const trimmed = payload.trim();
      if (!trimmed) {
        setError('Scan a QR code or paste a token first.');
        return;
      }

      setIsSubmitting(true);
      setError(null);
      const response = await inspectionApi.scanTicket(trimmed, location.trim());
      setIsSubmitting(false);

      if (response.success && response.data) {
        setResult(response.data);
        setRecentChecks((prev) => [
          response.data!,
          ...prev.filter((p) => p.tokenIdentifier !== response.data!.tokenIdentifier).slice(0, 5),
        ]);
        playFeedbackTone(response.data.isValid);
      } else {
        setError(response.message);
      }
    },
    [location]
  );

  // Keep the latest inspect function for the camera callback without restarting the camera
  const inspectRef = useRef(inspect);
  useEffect(() => {
    inspectRef.current = inspect;
  }, [inspect]);

  useEffect(() => {
    if (!isCameraOn || !videoRef.current) return;

    const scanner = new QrScanner(
      videoRef.current,
      (scan) => {
        setIsCameraOn(false);
        void inspectRef.current(scan.data);
      },
      {
        preferredCamera: 'environment',
        highlightScanRegion: true,
        highlightCodeOutline: true,
        returnDetailedScanResult: true,
      }
    );

    scanner.start().catch(() => {
      setIsCameraOn(false);
      setError('Camera could not be started. Allow camera access, or use Take Photo instead.');
    });

    return () => {
      scanner.stop();
      scanner.destroy();
    };
  }, [isCameraOn]);

  const handleLocationChange = (value: string) => {
    setLocation(value);
    try {
      localStorage.setItem(LOCATION_STORAGE_KEY, value);
    } catch {
      // Remembering the location is a convenience only
    }
  };

  const handlePhotoSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    try {
      const scan = await QrScanner.scanImage(file, { returnDetailedScanResult: true });
      await inspect(scan.data);
    } catch {
      setError('No QR code found in the photo. Retake it with the code clearly in view.');
    }
  };

  const handleNextPassenger = () => {
    setResult(null);
    setManualPayload('');
    setError(null);
  };

  const handleApplyPreset = (token: string) => {
    setManualPayload(token);
    void inspect(token);
  };

  return (
    <div className="w-full space-y-6 sm:space-y-8">
      {/* Operations Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900/95 to-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-950/70 border border-purple-800/60 text-purple-300 text-xs font-medium">
              <ScanLine className="w-3.5 h-3.5 text-purple-400" />
              <span>Revenue Protection & Field Operations</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
              <span>Ticket Inspection Console</span>
              <span className="text-xs px-2.5 py-1 rounded-lg bg-emerald-950/80 text-emerald-400 border border-emerald-800/80 font-mono flex items-center gap-1.5 font-normal">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                Active Terminal
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
              Optical barcode reader for transit inspectors. Evaluates HMAC-SHA256 signatures, checks active
              boarding status, detects stale journeys, and records official compliance audits.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 self-start md:self-center shrink-0">
            <div className="px-3.5 py-2 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 font-mono flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-purple-400" />
              <span>Inspector Role Authorized</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main 2-Column Grid */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,0.85fr)]">
        {/* Left Column: Handheld Inspection Terminal */}
        <div className="space-y-5">
          {/* Inspection Location Bar */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 backdrop-blur-sm p-4 sm:p-5 shadow-md">
            <div className="flex items-center justify-between mb-2">
              <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                <MapPin className="w-3.5 h-3.5 text-purple-400" />
                Current Inspection Location / Bus
              </span>
              <span className="text-[10px] font-mono text-slate-500">Auto-saved</span>
            </div>
            <input
              type="text"
              value={location}
              onChange={(e) => handleLocationChange(e.target.value)}
              placeholder="e.g. Route 100 - Bus NB-5542 or Pettah Central Turnstiles"
              className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>

          {error && (
            <div
              role="alert"
              className="rounded-2xl border border-rose-500/40 bg-rose-500/10 p-4 text-xs text-rose-300 flex items-start gap-2.5"
            >
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <div>
                <div className="font-semibold text-rose-200">Inspection Scan Error</div>
                <div className="mt-0.5 text-rose-300/90">{error}</div>
              </div>
            </div>
          )}

          {result ? (
            <InspectionResultCard result={result} location={location} onNext={handleNextPassenger} />
          ) : (
            <div className="rounded-3xl border border-slate-800 bg-slate-900/70 backdrop-blur-sm p-5 sm:p-6 shadow-md space-y-5">
              {/* Live Camera Viewport */}
              <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-950 border border-slate-800/80 shadow-inner">
                <video
                  ref={videoRef}
                  className={`w-full h-full object-cover ${isCameraOn ? '' : 'hidden'}`}
                  muted
                  playsInline
                />
                {!isCameraOn && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 text-center px-6">
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-10 h-10 text-purple-400 animate-spin" />
                        <span className="text-sm font-semibold text-white">Verifying token signature...</span>
                        <span className="text-xs text-slate-400 font-mono">Running Chain of Responsibility</span>
                      </>
                    ) : (
                      <>
                        <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shadow-md">
                          <ScanLine className="w-7 h-7" />
                        </div>
                        <span className="text-base font-bold text-white tracking-tight">
                          Position QR Pass in Camera View
                        </span>
                        <span className="text-xs text-slate-400 max-w-sm">
                          Use optical live camera, upload an image from device gallery, or paste token string below.
                        </span>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Scan Actions */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setIsCameraOn((on) => !on)}
                  disabled={!canUseLiveCamera || isSubmitting}
                  className="flex items-center justify-center gap-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:bg-slate-800 disabled:text-slate-500 px-4 py-3 text-sm font-semibold text-white cursor-pointer disabled:cursor-not-allowed transition-all shadow-md shadow-purple-950/40"
                >
                  {isCameraOn ? <CameraOff className="w-4 h-4" /> : <Camera className="w-4 h-4" />}
                  <span>{isCameraOn ? 'Stop Camera' : 'Start Camera'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isSubmitting}
                  className="flex items-center justify-center gap-2 rounded-xl border border-purple-800/60 bg-purple-950/40 hover:bg-purple-900/50 px-4 py-3 text-sm font-semibold text-purple-200 cursor-pointer disabled:cursor-not-allowed transition-colors"
                >
                  <ImageUp className="w-4 h-4" />
                  <span>Upload QR Photo</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handlePhotoSelected}
                  className="hidden"
                />
              </div>

              {!canUseLiveCamera && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-950/30 border border-amber-900/40 text-[11px] text-amber-300">
                  <Info className="w-4 h-4 shrink-0 text-amber-400" />
                  <span>Live webcam scanning requires HTTPS or localhost. Use Upload Photo or manual token paste.</span>
                </div>
              )}

              {/* Manual Payload Fallback */}
              <div className="border-t border-slate-800/80 pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Manual Token Payload
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">TK1|...</span>
                </div>
                <textarea
                  value={manualPayload}
                  onChange={(e) => setManualPayload(e.target.value)}
                  rows={2}
                  placeholder="Paste QR payload: TK1|LOCAL|{id}|0|{nonce}|{sig} or TK1|GUEST|..."
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2.5 text-xs font-mono text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => void inspect(manualPayload)}
                  disabled={isSubmitting || !manualPayload.trim()}
                  className="w-full rounded-xl bg-slate-900 hover:bg-slate-800/90 border border-slate-700 hover:border-slate-600 px-4 py-2.5 text-sm font-semibold text-slate-200 cursor-pointer disabled:cursor-not-allowed disabled:text-slate-600 transition-all flex items-center justify-center gap-2"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin text-purple-400" /> : <ScanLine className="w-4 h-4 text-purple-400" />}
                  <span>Verify Ticket Payload</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Security Checks, Presets & Field Intelligence */}
        <div className="space-y-5">
          {/* Quick Testing Presets */}
          <div className="rounded-3xl border border-slate-800 bg-slate-900/70 backdrop-blur-sm p-5 sm:p-6 shadow-md space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span>Quick Test Tokens</span>
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                Demo QA
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Click any token preset to test the reader's rule chain immediately without manual entry:
            </p>
            <div className="space-y-2">
              {DEMO_PRESETS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => handleApplyPreset(p.token)}
                  disabled={isSubmitting}
                  className="w-full text-left p-3 rounded-xl border border-slate-800 bg-slate-950/70 hover:border-purple-500/50 hover:bg-slate-900 transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-200 group-hover:text-purple-300 transition-colors">
                      {p.label}
                    </span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-md ${
                        p.type === 'valid'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : p.type === 'warning'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}
                    >
                      {p.type.toUpperCase()}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">{p.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Verification Rules (Chain of Responsibility) */}
          <div className="rounded-3xl border border-slate-800 bg-slate-900/70 backdrop-blur-sm p-5 sm:p-6 shadow-md space-y-3.5">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-purple-400" />
              <span>Inspection Rule Pipeline</span>
            </h2>
            <div className="space-y-2.5 text-xs text-slate-300">
              <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-md bg-purple-500/10 text-purple-400 font-mono font-bold flex items-center justify-center shrink-0 text-[10px]">
                  1
                </span>
                <div>
                  <div className="font-semibold text-slate-200">HMAC-SHA256 Token Signature</div>
                  <div className="text-[11px] text-slate-400">Verifies cryptographic authenticity & server salt</div>
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-md bg-purple-500/10 text-purple-400 font-mono font-bold flex items-center justify-center shrink-0 text-[10px]">
                  2
                </span>
                <div>
                  <div className="font-semibold text-slate-200">Account Standing Check</div>
                  <div className="text-[11px] text-slate-400">Ensures account has not been frozen or suspended</div>
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-md bg-purple-500/10 text-purple-400 font-mono font-bold flex items-center justify-center shrink-0 text-[10px]">
                  3
                </span>
                <div>
                  <div className="font-semibold text-slate-200">Active Journey Tap-In Check</div>
                  <div className="text-[11px] text-slate-400">Checks for valid turnstile gate entry tap event</div>
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-md bg-purple-500/10 text-purple-400 font-mono font-bold flex items-center justify-center shrink-0 text-[10px]">
                  4
                </span>
                <div>
                  <div className="font-semibold text-slate-200">Stale Journey Window</div>
                  <div className="text-[11px] text-slate-400">Rejects journeys open longer than network max travel limit</div>
                </div>
              </div>
            </div>
          </div>

          {/* Session Recent Checks */}
          {recentChecks.length > 0 && (
            <div className="rounded-3xl border border-slate-800 bg-slate-900/70 backdrop-blur-sm p-5 shadow-md space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <History className="w-3.5 h-3.5" />
                <span>Session Inspections ({recentChecks.length})</span>
              </h2>
              <div className="divide-y divide-slate-800">
                {recentChecks.map((item, idx) => (
                  <div key={idx} className="py-2 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      {item.isValid ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                      )}
                      <div className="min-w-0">
                        <div className="font-mono text-slate-200 truncate">{shortTokenId(item.tokenIdentifier)}</div>
                        <div className="text-[10px] text-slate-400">{ticketTypeLabel(item.tokenType)}</div>
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                        item.isValid ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                      }`}
                    >
                      {item.result}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface InspectionResultCardProps {
  result: InspectionResponse;
  location: string;
  onNext: () => void;
}

const InspectionResultCard: React.FC<InspectionResultCardProps> = ({ result, location, onNext }) => {
  const isValid = result.isValid;

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/70 backdrop-blur-sm p-6 sm:p-7 shadow-xl space-y-5">
      {/* Outcome Banner */}
      <div
        role="status"
        className={`rounded-2xl border p-6 sm:p-8 text-center transition-all ${
          isValid
            ? 'border-emerald-500/40 bg-gradient-to-b from-emerald-500/15 to-emerald-500/5 shadow-lg shadow-emerald-950/30'
            : 'border-rose-500/40 bg-gradient-to-b from-rose-500/15 to-rose-500/5 shadow-lg shadow-rose-950/30'
        }`}
      >
        {isValid ? (
          <CheckCircle2 className="w-14 h-14 mx-auto text-emerald-400 animate-in zoom-in-50 duration-200" />
        ) : (
          <XCircle className="w-14 h-14 mx-auto text-rose-400 animate-in zoom-in-50 duration-200" />
        )}
        <div
          className={`mt-3 text-2xl sm:text-3xl font-extrabold tracking-wide ${
            isValid ? 'text-emerald-400' : 'text-rose-400'
          }`}
        >
          {isValid ? 'CLEARANCE GRANTED' : 'CLEARANCE DENIED'}
        </div>
        <div className="mt-1 text-sm font-semibold text-white">{RESULT_LABELS[result.result] ?? result.result}</div>
        <div className="mt-1 text-xs text-slate-300 max-w-md mx-auto">{result.message}</div>
      </div>

      {result.isRepeatScan && (
        <div className="flex items-center gap-2 rounded-xl border border-sky-500/30 bg-sky-500/10 px-4 py-2.5 text-xs text-sky-300">
          <Repeat className="w-4 h-4 shrink-0" />
          <span>Scanned again within deduplication window. Showing earlier result; not counted twice.</span>
        </div>
      )}

      {/* Details Grid */}
      <dl className="grid grid-cols-2 gap-3 text-xs">
        <Detail icon={<Ticket className="w-3.5 h-3.5" />} label="Token ID" value={shortTokenId(result.tokenIdentifier)} mono />
        <Detail label="Ticket Category" value={ticketTypeLabel(result.tokenType)} />
        {result.journey && (
          <>
            <Detail icon={<MapPin className="w-3.5 h-3.5" />} label="Boarded At" value={result.journey.tapInStation} />
            <Detail
              icon={<Clock className="w-3.5 h-3.5" />}
              label="Boarded Elapsed"
              value={`${toLocalTime(result.journey.tapInTimeUtc)} (${formatMinutesAgo(result.journey.minutesSinceTapIn)})`}
            />
          </>
        )}
        <Detail label="Inspected At" value={location.trim() || 'Unspecified Location'} />
        <Detail label="Timestamp" value={toLocalTime(result.inspectedAtUtc)} />
      </dl>

      {!isValid && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-xs text-amber-300">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>Flagged in live audit ledger for fare evasion reporting.</span>
        </div>
      )}

      <button
        type="button"
        onClick={onNext}
        className="w-full rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 py-3.5 text-sm font-bold uppercase tracking-wider text-white shadow-lg shadow-purple-950/50 cursor-pointer transition-all"
      >
        Scan Next Passenger
      </button>
    </div>
  );
};

interface DetailProps {
  label: string;
  value: string;
  icon?: React.ReactNode;
  mono?: boolean;
}

const Detail: React.FC<DetailProps> = ({ label, value, icon, mono }) => (
  <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3">
    <dt className="flex items-center gap-1.5 text-[10px] uppercase font-semibold tracking-wider text-slate-500">
      {icon}
      <span>{label}</span>
    </dt>
    <dd className={`mt-1 text-slate-100 font-medium break-words ${mono ? 'font-mono' : ''}`}>{value}</dd>
  </div>
);

export default TicketInspectionPage;
