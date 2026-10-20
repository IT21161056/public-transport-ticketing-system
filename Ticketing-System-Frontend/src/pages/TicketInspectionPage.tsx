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
} from 'lucide-react';
import { inspectionApi } from '../api/inspectionApi';
import type { InspectionResponse, InspectionResultCode } from '../types/inspection';

const LOCATION_STORAGE_KEY = 'inspector_location';

const RESULT_LABELS: Record<InspectionResultCode, string> = {
  Valid: 'Valid ticket',
  NoActiveJourney: 'No active journey',
  StaleJourney: 'Stale journey',
  InvalidToken: 'Invalid token',
  Expired: 'Pass expired',
  AccountSuspended: 'Account suspended',
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
    return localStorage.getItem(LOCATION_STORAGE_KEY) ?? '';
  } catch {
    return '';
  }
}

function toLocalTime(utc: string): string {
  const iso = /Z|[+-]\d{2}:\d{2}$/.test(utc) ? utc : `${utc}Z`;
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatMinutesAgo(minutes: number): string {
  if (minutes < 60) return `${minutes} min ago`;
  return `${Math.floor(minutes / 60)} h ${minutes % 60} min ago`;
}

function shortTokenId(identifier: string): string {
  if (!identifier) return '—';
  return identifier.length > 12 ? `…${identifier.slice(-8).toUpperCase()}` : identifier;
}

function ticketTypeLabel(tokenType: string): string {
  if (tokenType === 'LOCAL') return 'Local account';
  if (tokenType === 'GUEST') return 'Guest pass';
  return 'Unknown';
}

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

  // Browsers only allow live camera access on HTTPS or localhost
  const canUseLiveCamera = window.isSecureContext && !!navigator.mediaDevices;

  // The admin layout switches tabs with ?tab=; return to the dashboard when a sidebar tab is chosen here
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) {
      navigate(`/admin?tab=${tab}`, { replace: true });
    }
  }, [searchParams, navigate]);

  const inspect = useCallback(async (payload: string) => {
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
      playFeedbackTone(response.data.isValid);
    } else {
      setError(response.message);
    }
  }, [location]);

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

  return (
    <div className="max-w-xl mx-auto space-y-5">
      {/* Title */}
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <ScanLine className="w-5 h-5 text-purple-400" />
          Ticket Inspection
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Scan a passenger's QR token to check they tapped in for this journey.
        </p>
      </div>

      {/* Inspection location */}
      <label className="block rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
        <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          <MapPin className="w-3.5 h-3.5" />
          Current bus / route
        </span>
        <input
          type="text"
          value={location}
          onChange={(e) => handleLocationChange(e.target.value)}
          placeholder="e.g. Route 138 - Bus NB-5542"
          className="mt-2 w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-500"
        />
      </label>

      {error && (
        <div role="alert" className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-xs text-red-300">
          {error}
        </div>
      )}

      {result ? (
        <InspectionResultCard result={result} location={location} onNext={handleNextPassenger} />
      ) : (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-4">
          {/* Live camera viewport */}
          <div className="relative aspect-square sm:aspect-video rounded-xl overflow-hidden bg-slate-950 border border-slate-800">
            <video ref={videoRef} className={`w-full h-full object-cover ${isCameraOn ? '' : 'hidden'}`} muted playsInline />
            {!isCameraOn && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center px-6">
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-10 h-10 text-purple-400 animate-spin" />
                    <span className="text-sm font-semibold text-white">Checking ticket...</span>
                  </>
                ) : (
                  <>
                    <ScanLine className="w-12 h-12 text-purple-400" />
                    <span className="text-sm font-semibold text-white">Scan Passenger's Token to Verify</span>
                    <span className="text-xs text-slate-400">Point the camera at the passenger's QR code</span>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Scan actions */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setIsCameraOn((on) => !on)}
              disabled={!canUseLiveCamera || isSubmitting}
              className="flex items-center justify-center gap-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:bg-slate-800 disabled:text-slate-500 px-4 py-3 text-sm font-semibold text-white cursor-pointer disabled:cursor-not-allowed transition-colors"
            >
              {isCameraOn ? <CameraOff className="w-4 h-4" /> : <Camera className="w-4 h-4" />}
              {isCameraOn ? 'Stop Camera' : 'Scan with Camera'}
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isSubmitting}
              className="flex items-center justify-center gap-2 rounded-xl border border-purple-700 bg-purple-950/40 hover:bg-purple-900/50 px-4 py-3 text-sm font-semibold text-purple-200 cursor-pointer disabled:cursor-not-allowed transition-colors"
            >
              <ImageUp className="w-4 h-4" />
              Take Photo
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
            <p className="text-[11px] text-amber-300/90">
              Live camera needs HTTPS or localhost. Use Take Photo on this connection.
            </p>
          )}

          {/* Manual fallback */}
          <div className="border-t border-slate-800 pt-4 space-y-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Or paste token</span>
            <textarea
              value={manualPayload}
              onChange={(e) => setManualPayload(e.target.value)}
              rows={2}
              placeholder="TK1|LOCAL|..."
              className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-xs font-mono text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-500"
            />
            <button
              type="button"
              onClick={() => void inspect(manualPayload)}
              disabled={isSubmitting || !manualPayload.trim()}
              className="w-full rounded-xl border border-slate-700 hover:border-slate-600 bg-slate-900 px-4 py-2.5 text-sm font-semibold text-slate-200 cursor-pointer disabled:cursor-not-allowed disabled:text-slate-500 transition-colors"
            >
              Verify Token
            </button>
          </div>
        </div>
      )}
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
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-4">
      {/* Outcome banner */}
      <div
        role="status"
        className={`rounded-xl border p-6 text-center ${
          isValid ? 'border-emerald-500/40 bg-emerald-500/10' : 'border-red-500/40 bg-red-500/10'
        }`}
      >
        {isValid ? (
          <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-400" />
        ) : (
          <XCircle className="w-12 h-12 mx-auto text-red-400" />
        )}
        <div className={`mt-2 text-3xl font-extrabold tracking-wide ${isValid ? 'text-emerald-400' : 'text-red-400'}`}>
          {isValid ? 'VALID' : 'INVALID'}
        </div>
        <div className="mt-1 text-sm font-semibold text-white">{RESULT_LABELS[result.result] ?? result.result}</div>
        <div className="mt-1 text-xs text-slate-300">{result.message}</div>
      </div>

      {result.isRepeatScan && (
        <div className="flex items-center gap-2 rounded-xl border border-sky-500/30 bg-sky-500/10 px-3 py-2 text-[11px] text-sky-300">
          <Repeat className="w-3.5 h-3.5 shrink-0" />
          Scanned again within a short time. Showing the earlier result; it is not counted twice.
        </div>
      )}

      {/* Details */}
      <dl className="grid grid-cols-2 gap-3 text-xs">
        <Detail icon={<Ticket className="w-3.5 h-3.5" />} label="Token ID" value={shortTokenId(result.tokenIdentifier)} mono />
        <Detail label="Ticket type" value={ticketTypeLabel(result.tokenType)} />
        {result.journey && (
          <>
            <Detail icon={<MapPin className="w-3.5 h-3.5" />} label="Boarded at" value={result.journey.tapInStation} />
            <Detail
              icon={<Clock className="w-3.5 h-3.5" />}
              label="Boarded"
              value={`${toLocalTime(result.journey.tapInTimeUtc)} (${formatMinutesAgo(result.journey.minutesSinceTapIn)})`}
            />
          </>
        )}
        <Detail label="Checked on" value={location.trim() || '—'} />
        <Detail label="Checked at" value={toLocalTime(result.inspectedAtUtc)} />
      </dl>

      {!isValid && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[11px] text-amber-300">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          Flagged for fare evasion report
        </div>
      )}

      <button
        type="button"
        onClick={onNext}
        className="w-full rounded-xl bg-purple-600 hover:bg-purple-500 px-4 py-3 text-sm font-bold uppercase tracking-wide text-white cursor-pointer transition-colors"
      >
        Next Passenger
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
  <div className="rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2">
    <dt className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-slate-500">
      {icon}
      {label}
    </dt>
    <dd className={`mt-0.5 text-slate-100 break-words ${mono ? 'font-mono' : ''}`}>{value}</dd>
  </div>
);

export default TicketInspectionPage;
