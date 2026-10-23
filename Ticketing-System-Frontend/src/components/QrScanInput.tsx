import React, { useEffect, useRef, useState } from 'react';
import QrScanner from 'qr-scanner';
import { Camera, CameraOff, ImageUp } from 'lucide-react';

/** The same code read again within this time is treated as the same tap (camera sees it many times a second). */
const SAME_CODE_IGNORE_MS = 3000;

export interface QrScanInputProps {
  /** Called once per read QR code (camera, photo or pasted text). */
  onScan: (payload: string) => void;
  /** While true, camera reads are ignored (e.g. the reader is showing a result). The camera keeps running. */
  paused?: boolean;
  /** Disables the buttons while a scan is being processed. */
  busy?: boolean;
  /** Label for the paste-and-submit button. */
  submitLabel?: string;
}

/**
 * QR input for scanner screens: a live camera that stays on between scans,
 * a photo fallback for phones on plain HTTP, and a paste box for testing with copied tokens.
 */
export const QrScanInput: React.FC<QrScanInputProps> = ({
  onScan,
  paused = false,
  busy = false,
  submitLabel = 'Tap Token',
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [manualPayload, setManualPayload] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Browsers only allow live camera access on HTTPS or localhost
  const canUseLiveCamera = window.isSecureContext && !!navigator.mediaDevices;

  // Latest values for the camera callback, so the camera does not restart on every render
  const onScanRef = useRef(onScan);
  const pausedRef = useRef(paused);
  const lastReadRef = useRef<{ payload: string; at: number } | null>(null);
  useEffect(() => {
    onScanRef.current = onScan;
    pausedRef.current = paused;
  }, [onScan, paused]);

  useEffect(() => {
    if (!isCameraOn || !videoRef.current) return;

    const scanner = new QrScanner(
      videoRef.current,
      (scan) => {
        const payload = scan.data.trim();
        const now = Date.now();
        const last = lastReadRef.current;
        if (pausedRef.current || !payload) return;
        if (last && last.payload === payload && now - last.at < SAME_CODE_IGNORE_MS) return;

        lastReadRef.current = { payload, at: now };
        onScanRef.current(payload);
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
      setError('Camera could not be started. Allow camera access, or use Photo instead.');
    });

    return () => {
      scanner.stop();
      scanner.destroy();
    };
  }, [isCameraOn]);

  const handlePhotoSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setError(null);
    try {
      const scan = await QrScanner.scanImage(file, { returnDetailedScanResult: true });
      onScan(scan.data.trim());
    } catch {
      setError('No QR code found in the photo. Retake it with the code clearly in view.');
    }
  };

  const handleSubmitPasted = () => {
    const payload = manualPayload.trim();
    if (!payload) return;
    setError(null);
    onScan(payload);
  };

  return (
    <div className="space-y-3">
      {/* Live camera viewport, only shown while the camera is on */}
      <div className={`relative aspect-video rounded-xl overflow-hidden bg-slate-950 border border-slate-800 ${isCameraOn ? '' : 'hidden'}`}>
        <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
        {paused && (
          <div className="absolute inset-0 bg-slate-950/60 flex items-center justify-center text-xs font-semibold text-slate-100">
            Showing result…
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => {
            setError(null);
            setIsCameraOn((on) => !on);
          }}
          disabled={!canUseLiveCamera}
          className="flex items-center justify-center gap-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:bg-slate-800 disabled:text-slate-500 px-4 py-3 text-sm font-semibold text-white cursor-pointer disabled:cursor-not-allowed transition-colors"
        >
          {isCameraOn ? <CameraOff className="w-4 h-4" /> : <Camera className="w-4 h-4" />}
          {isCameraOn ? 'Stop Camera' : 'Camera'}
        </button>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={busy}
          className="flex items-center justify-center gap-2 rounded-xl border border-purple-500/50 bg-purple-500/10 hover:bg-purple-500/20 px-4 py-3 text-sm font-semibold text-slate-100 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 transition-colors"
        >
          <ImageUp className="w-4 h-4" />
          Photo
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
        <p className="text-[11px] text-amber-400">
          Live camera needs HTTPS or localhost. Use Photo on this connection.
        </p>
      )}

      {error && (
        <p role="alert" className="text-[11px] text-rose-400">
          {error}
        </p>
      )}

      <div className="border-t border-slate-800 pt-3 space-y-2">
        <label htmlFor="qr-scan-paste" className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Or paste token
        </label>
        <textarea
          id="qr-scan-paste"
          value={manualPayload}
          onChange={(e) => setManualPayload(e.target.value)}
          rows={2}
          placeholder="TK1|LOCAL|..."
          className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-xs font-mono text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-purple-500"
        />
        <button
          type="button"
          onClick={handleSubmitPasted}
          disabled={busy || !manualPayload.trim()}
          className="w-full rounded-xl border border-slate-700 hover:border-slate-600 bg-slate-900 px-4 py-2.5 text-sm font-semibold text-slate-200 cursor-pointer disabled:cursor-not-allowed disabled:text-slate-500 transition-colors"
        >
          {submitLabel}
        </button>
      </div>
    </div>
  );
};

export default QrScanInput;
