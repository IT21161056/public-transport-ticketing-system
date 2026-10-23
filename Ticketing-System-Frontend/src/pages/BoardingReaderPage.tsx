import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Bus,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Loader2,
  LogIn,
  LogOut,
  MapPin,
  RefreshCw,
  Repeat,
  ScanLine,
  Undo2,
  Wallet,
  XCircle,
} from 'lucide-react';
import { tapApi } from '../api/tapApi';
import { QrScanInput } from '../components/QrScanInput';
import type { TapResponse, TapResultCode, TransitNetwork, TransitRoute } from '../types/tap';

const SETUP_STORAGE_KEY = 'boarding_reader_setup';
const RESULT_DISPLAY_MS = 5000;
const LOG_SIZE = 8;

interface ReaderSetup {
  routeId: string;
  busId: string;
  stopId: string;
}

type ScreenState =
  | { kind: 'ready' }
  | { kind: 'reading' }
  | { kind: 'result'; response: TapResponse }
  | { kind: 'error'; message: string };

interface LogEntry {
  id: number;
  at: Date;
  stop: string;
  response: TapResponse;
}

const RESULT_TITLES: Record<TapResultCode, string> = {
  TapInAccepted: 'Tap In OK',
  TapOutCompleted: 'Tap Out OK',
  JourneyCancelled: 'Journey Cancelled',
  InvalidToken: 'Invalid Ticket',
  PassExpired: 'Pass Expired',
  AccountSuspended: 'Account Suspended',
  InsufficientBalance: 'Insufficient Balance',
};

function readStoredSetup(): Partial<ReaderSetup> {
  try {
    const raw = localStorage.getItem(SETUP_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Partial<ReaderSetup>) : {};
  } catch {
    return {};
  }
}

function storeSetup(setup: ReaderSetup) {
  try {
    localStorage.setItem(SETUP_STORAGE_KEY, JSON.stringify(setup));
  } catch {
    // Remembering the reader setup is a convenience only
  }
}

function formatMoney(amount: number | null | undefined): string {
  return (amount ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function toLocalTime(utc: string): string {
  const iso = /Z|[+-]\d{2}:\d{2}$/.test(utc) ? utc : `${utc}Z`;
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function toLocalDateTime(utc: string): string {
  const iso = /Z|[+-]\d{2}:\d{2}$/.test(utc) ? utc : `${utc}Z`;
  return new Date(iso).toLocaleString([], { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

/**
 * Reader audio feedback (design: FeedbackDisplay).
 * Tap in: one high beep. Tap out: rising two-tone. Rejected: two low beeps.
 */
function playTapTone(response: TapResponse) {
  try {
    const context = new AudioContext();
    const tones: { frequency: number; offset: number }[] = !response.accepted
      ? [{ frequency: 330, offset: 0 }, { frequency: 330, offset: 0.22 }]
      : response.action === 'TapOut'
        ? [{ frequency: 660, offset: 0 }, { frequency: 990, offset: 0.14 }]
        : [{ frequency: 880, offset: 0 }];

    tones.forEach(({ frequency, offset }) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.frequency.value = frequency;
      gain.gain.value = 0.15;
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(context.currentTime + offset);
      oscillator.stop(context.currentTime + offset + 0.13);
    });
    setTimeout(() => void context.close(), 800);
  } catch {
    // Audio is optional; the screen always shows the result
  }
}

/**
 * Bus Boarding Reader simulator (design: BoardingReader, UI 8.3 Tap Flow).
 * The operator picks the bus and moves it stop by stop; passengers tap the same reader to get on and off.
 */
export const BoardingReaderPage: React.FC = () => {
  const [network, setNetwork] = useState<TransitNetwork | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [setup, setSetup] = useState<ReaderSetup | null>(null);
  const [screen, setScreen] = useState<ScreenState>({ kind: 'ready' });
  const [log, setLog] = useState<LogEntry[]>([]);
  const resetTimerRef = useRef<number | null>(null);
  const logIdRef = useRef(0);

  const loadNetwork = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    const response = await tapApi.getNetwork();
    setIsLoading(false);

    if (!response.success || !response.data) {
      setLoadError(response.message);
      return;
    }

    const data = response.data;
    setNetwork(data);

    // Restore the last reader setup if it still exists, otherwise start at the first stop of the first route
    const stored = readStoredSetup();
    const route = data.routes.find((r) => r.id === stored.routeId) ?? data.routes[0];
    if (!route) {
      setSetup(null);
      return;
    }
    const bus = route.buses.find((b) => b.id === stored.busId) ?? route.buses[0];
    const stop = route.stops.find((s) => s.id === stored.stopId) ?? route.stops[0];
    if (bus && stop) {
      setSetup({ routeId: route.id, busId: bus.id, stopId: stop.id });
    }
  }, []);

  useEffect(() => {
    void loadNetwork();
  }, [loadNetwork]);

  useEffect(() => {
    if (setup) storeSetup(setup);
  }, [setup]);

  useEffect(() => () => {
    if (resetTimerRef.current) window.clearTimeout(resetTimerRef.current);
  }, []);

  const route: TransitRoute | undefined = useMemo(
    () => network?.routes.find((r) => r.id === setup?.routeId),
    [network, setup?.routeId]
  );
  const bus = route?.buses.find((b) => b.id === setup?.busId);
  const stopIndex = route?.stops.findIndex((s) => s.id === setup?.stopId) ?? -1;
  const currentStop = stopIndex >= 0 ? route?.stops[stopIndex] : undefined;

  const showResult = useCallback((next: ScreenState) => {
    setScreen(next);
    if (resetTimerRef.current) window.clearTimeout(resetTimerRef.current);
    resetTimerRef.current = window.setTimeout(() => setScreen({ kind: 'ready' }), RESULT_DISPLAY_MS);
  }, []);

  const handleTap = useCallback(async (payload: string) => {
    if (!setup || !currentStop || screen.kind === 'reading') return;

    setScreen({ kind: 'reading' });
    const response = await tapApi.tap(payload, setup.busId, setup.stopId);

    if (!response.success || !response.data) {
      showResult({ kind: 'error', message: response.message });
      return;
    }

    const data = response.data;
    playTapTone(data);
    showResult({ kind: 'result', response: data });
    logIdRef.current += 1;
    setLog((entries) => [{ id: logIdRef.current, at: new Date(), stop: currentStop.name, response: data }, ...entries].slice(0, LOG_SIZE));
  }, [setup, currentStop, screen.kind, showResult]);

  const changeRoute = (routeId: string) => {
    const nextRoute = network?.routes.find((r) => r.id === routeId);
    if (!nextRoute || !nextRoute.buses[0] || !nextRoute.stops[0]) return;
    setSetup({ routeId, busId: nextRoute.buses[0].id, stopId: nextRoute.stops[0].id });
    setScreen({ kind: 'ready' });
  };

  const moveToStop = (index: number) => {
    if (!route || !setup || index < 0 || index >= route.stops.length) return;
    setSetup({ ...setup, stopId: route.stops[index].id });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-sm text-slate-400">
        <Loader2 className="w-5 h-5 animate-spin text-purple-400" />
        Loading routes and buses…
      </div>
    );
  }

  if (loadError || !network || !setup || !route || !bus || !currentStop) {
    return (
      <div className="max-w-md mx-auto mt-12 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-6 text-center space-y-3">
        <AlertTriangle className="w-8 h-8 mx-auto text-rose-400" />
        <p className="text-sm text-slate-200">{loadError ?? 'No bus routes are set up yet.'}</p>
        <button
          type="button"
          onClick={() => void loadNetwork()}
          className="inline-flex items-center gap-2 rounded-xl bg-slate-900 border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-200 cursor-pointer hover:border-slate-500"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 sm:space-y-8">
      {/* Operations Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900/95 to-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/70 border border-emerald-800/60 text-emerald-300 text-xs font-medium">
              <Bus className="w-3.5 h-3.5 text-emerald-400" />
              <span>Turnstile & On-Bus Boarding Terminal</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
              <span>Bus Boarding Reader</span>
              <span className="text-xs px-2.5 py-1 rounded-lg bg-emerald-950/80 text-emerald-400 border border-emerald-800/80 font-mono flex items-center gap-1.5 font-normal">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                Terminal Online
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
              Simulates physical contactless boarding gates and on-bus NFC/optical readers. Passengers tap at entry (Tap In)
              and exit (Tap Out); distance fares are deducted atomically at tap-out.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 self-start md:self-center shrink-0">
            <div className="px-3.5 py-2 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 font-mono">
              <span className="text-slate-500">Fare Policy:</span> <span className="text-cyan-300 font-semibold">{network.farePolicy}</span>
            </div>
            <button
              type="button"
              onClick={() => void loadNetwork()}
              className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white cursor-pointer transition-colors"
              title="Refresh network configuration"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        {/* ===== Reader setup: bus and its current stop ===== */}
        <section className="space-y-4 min-w-0">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="block">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Route</span>
                <select
                  value={route.id}
                  onChange={(e) => changeRoute(e.target.value)}
                  className="mt-1.5 w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-purple-500"
                >
                  {network.routes.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.routeNumber} · {r.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Bus</span>
                <select
                  value={bus.id}
                  onChange={(e) => setSetup({ ...setup, busId: e.target.value })}
                  className="mt-1.5 w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-purple-500"
                >
                  {route.buses.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.registrationNumber}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {/* Stops in travel order; the highlighted one is where the bus is now */}
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Bus is at</span>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => moveToStop(stopIndex - 1)}
                    disabled={stopIndex <= 0}
                    aria-label="Previous stop"
                    className="p-1.5 rounded-lg border border-slate-800 bg-slate-950 text-slate-300 hover:border-slate-600 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveToStop(stopIndex + 1)}
                    disabled={stopIndex >= route.stops.length - 1}
                    aria-label="Next stop"
                    className="p-1.5 rounded-lg border border-slate-800 bg-slate-950 text-slate-300 hover:border-slate-600 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <ol className="mt-2 space-y-1">
                {route.stops.map((s, index) => {
                  const isCurrent = index === stopIndex;
                  return (
                    <li key={s.id}>
                      <button
                        type="button"
                        onClick={() => moveToStop(index)}
                        aria-current={isCurrent ? 'step' : undefined}
                        className={`w-full flex items-center gap-3 rounded-xl px-3 py-2 text-left text-sm border transition-colors cursor-pointer ${
                          isCurrent
                            ? 'bg-purple-500/15 border-purple-500/40 text-slate-100 font-semibold'
                            : 'border-transparent text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                        }`}
                      >
                        <span
                          className={`w-6 h-6 shrink-0 rounded-full flex items-center justify-center text-[10px] font-mono border ${
                            isCurrent ? 'bg-purple-600 border-purple-400 text-white' : 'bg-slate-950 border-slate-700'
                          }`}
                        >
                          {s.sequence}
                        </span>
                        <span className="flex-1 min-w-0 truncate">{s.name}</span>
                        <span className="text-[10px] font-mono text-slate-500">Zone {s.zone}</span>
                        {isCurrent && <MapPin className="w-3.5 h-3.5 text-purple-300" />}
                      </button>
                    </li>
                  );
                })}
              </ol>
            </div>

            <div className="flex flex-wrap gap-2 text-[11px]">
              <span className="px-2 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300">
                Fare policy: <span className="font-semibold text-slate-100">{network.farePolicy}</span>
              </span>
              <span className="px-2 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300">
                Min. balance to board: <span className="font-semibold text-slate-100">{formatMoney(network.minimumBalance)}</span>
              </span>
            </div>
          </div>

          <TapLog entries={log} />
        </section>

        {/* ===== Reader device (first on phones, where the screen is the reader) ===== */}
        <section className="space-y-4 min-w-0 order-first lg:order-none">
          <div className="rounded-[2rem] border-[10px] border-slate-800 bg-slate-950 shadow-2xl shadow-black/40 overflow-hidden">
            <div className="flex items-center justify-between gap-2 px-4 py-2 bg-slate-900 border-b border-slate-800 text-[11px] font-mono text-slate-400">
              <span className="truncate">
                {bus.registrationNumber} · Route {route.routeNumber}
              </span>
              <span className="flex items-center gap-1.5 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Online
              </span>
            </div>

            <ReaderScreen screen={screen} stopName={currentStop.name} onDismiss={() => setScreen({ kind: 'ready' })} />

            {/* Status light under the screen */}
            <div className="flex justify-center py-3 bg-slate-900 border-t border-slate-800">
              <span
                className={`h-2 w-24 rounded-full transition-colors ${
                  screen.kind === 'result'
                    ? screen.response.accepted
                      ? 'bg-emerald-400 shadow-[0_0_12px] shadow-emerald-400'
                      : 'bg-rose-500 shadow-[0_0_12px] shadow-rose-500'
                    : screen.kind === 'error'
                      ? 'bg-amber-400'
                      : 'bg-slate-700'
                }`}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
            <QrScanInput
              onScan={(payload) => void handleTap(payload)}
              paused={screen.kind !== 'ready'}
              busy={screen.kind === 'reading'}
              submitLabel="Tap Token"
            />
          </div>
        </section>
      </div>
    </div>
  );
};

interface ReaderScreenProps {
  screen: ScreenState;
  stopName: string;
  onDismiss: () => void;
}

/** The reader's display (design UI 8.3: Ready, Reading, Tap-In OK, Tap-Out OK, rejected). */
const ReaderScreen: React.FC<ReaderScreenProps> = ({ screen, stopName, onDismiss }) => {
  if (screen.kind === 'ready') {
    return (
      <div className="min-h-[320px] flex flex-col items-center justify-center gap-3 px-6 py-8 text-center">
        <ScanLine className="w-14 h-14 text-purple-400" />
        <div className="text-lg font-bold text-slate-100">Ready to scan</div>
        <div className="text-xs text-slate-400">Hold your QR ticket to the reader</div>
        <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-slate-900 border border-slate-800 px-3 py-1 text-[11px] text-slate-300">
          <MapPin className="w-3 h-3 text-purple-300" />
          {stopName}
        </div>
      </div>
    );
  }

  if (screen.kind === 'reading') {
    return (
      <div role="status" className="min-h-[320px] flex flex-col items-center justify-center gap-3 px-6 py-8 text-center">
        <Loader2 className="w-12 h-12 text-purple-400 animate-spin" />
        <div className="text-lg font-bold text-slate-100">Reading token…</div>
      </div>
    );
  }

  if (screen.kind === 'error') {
    return (
      <div role="alert" className="min-h-[320px] flex flex-col items-center justify-center gap-3 px-6 py-8 text-center bg-amber-500/10">
        <AlertTriangle className="w-12 h-12 text-amber-400" />
        <div className="text-lg font-bold text-amber-400">Reader error</div>
        <div className="text-xs text-slate-200 max-w-xs">{screen.message}</div>
        <button type="button" onClick={onDismiss} className="mt-2 text-xs font-semibold text-amber-400 underline cursor-pointer">
          Back to scan
        </button>
      </div>
    );
  }

  const r = screen.response;
  const journey = r.journey;
  const isCancelled = r.result === 'JourneyCancelled';
  const tone = !r.accepted ? 'red' : isCancelled ? 'sky' : 'emerald';
  const toneClasses = {
    red: { bg: 'bg-rose-500/10', text: 'text-rose-400', icon: <XCircle className="w-14 h-14 text-rose-400" /> },
    sky: { bg: 'bg-cyan-500/10', text: 'text-cyan-300', icon: <Undo2 className="w-14 h-14 text-cyan-300" /> },
    emerald: {
      bg: 'bg-emerald-500/10',
      text: 'text-emerald-400',
      icon: r.action === 'TapOut'
        ? <LogOut className="w-14 h-14 text-emerald-400" />
        : <LogIn className="w-14 h-14 text-emerald-400" />,
    },
  }[tone];

  return (
    <div role="status" className={`min-h-[320px] px-5 py-6 space-y-4 ${toneClasses.bg}`}>
      <div className="text-center space-y-1">
        <div className="flex justify-center">{toneClasses.icon}</div>
        <div className={`text-2xl font-extrabold uppercase tracking-wide ${toneClasses.text}`}>{RESULT_TITLES[r.result] ?? r.result}</div>
        <div className="text-xs text-slate-300">{r.message}</div>
      </div>

      {/* Fare and balance: the numbers the passenger and driver look for */}
      {r.action === 'TapOut' && journey && !isCancelled && (
        <div className="rounded-xl bg-slate-950/70 border border-slate-800 px-4 py-3 text-center">
          <div className="text-[10px] uppercase tracking-wider text-slate-500">Fare charged</div>
          <div className="text-3xl font-extrabold text-slate-100 font-mono">{formatMoney(journey.fareCharged)}</div>
          <div className="text-[11px] text-slate-400">
            {journey.stopsTravelled ?? 0} stop{journey.stopsTravelled === 1 ? '' : 's'} · {journey.farePolicy}
          </div>
        </div>
      )}

      <dl className="grid grid-cols-2 gap-2 text-xs">
        {journey && (
          <div className="col-span-2 rounded-xl bg-slate-950/60 border border-slate-800 px-3 py-2">
            <dt className="text-[10px] uppercase tracking-wider text-slate-500">Trip</dt>
            <dd className="mt-0.5 flex items-center gap-1.5 text-slate-100 flex-wrap">
              <span>{journey.boardingStop}</span>
              <span className="text-slate-500">{toLocalTime(journey.tapInTimeUtc)}</span>
              {journey.alightingStop && (
                <>
                  <ArrowRight className="w-3 h-3 text-slate-500" />
                  <span>{journey.alightingStop}</span>
                  {journey.tapOutTimeUtc && <span className="text-slate-500">{toLocalTime(journey.tapOutTimeUtc)}</span>}
                </>
              )}
            </dd>
          </div>
        )}
        {r.tokenType === 'LOCAL' && r.balanceAfter !== null && (
          <div className="rounded-xl bg-slate-950/60 border border-slate-800 px-3 py-2">
            <dt className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-slate-500">
              <Wallet className="w-3 h-3" /> Balance
            </dt>
            <dd className={`mt-0.5 font-mono font-semibold ${r.balanceAfter < r.minimumBalance ? 'text-amber-400' : 'text-slate-100'}`}>
              {formatMoney(r.balanceAfter)}
            </dd>
          </div>
        )}
        {r.tokenType === 'GUEST' && r.passExpiresAtUtc && (
          <div className="rounded-xl bg-slate-950/60 border border-slate-800 px-3 py-2">
            <dt className="text-[10px] uppercase tracking-wider text-slate-500">Pass valid until</dt>
            <dd className="mt-0.5 text-slate-100">{toLocalDateTime(r.passExpiresAtUtc)}</dd>
          </div>
        )}
        <div className="rounded-xl bg-slate-950/60 border border-slate-800 px-3 py-2">
          <dt className="text-[10px] uppercase tracking-wider text-slate-500">Ticket</dt>
          <dd className="mt-0.5 text-slate-100">{r.tokenType === 'GUEST' ? 'Visitor pass' : r.tokenType === 'LOCAL' ? 'Account' : 'Unknown'}</dd>
        </div>
      </dl>

      {r.autoClosedJourney && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[11px] text-amber-400">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>
            Previous journey from {r.autoClosedJourney.boardingStop} ({toLocalDateTime(r.autoClosedJourney.tapInTimeUtc)}) had no tap-out.
            Charged the maximum fare of {formatMoney(r.autoClosedJourney.fareCharged)}.
          </span>
        </div>
      )}

      {r.isRepeatTap && (
        <div className="flex items-center gap-2 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-[11px] text-cyan-300">
          <Repeat className="w-3.5 h-3.5 shrink-0" />
          Same ticket tapped again. Showing the last result; nothing was charged.
        </div>
      )}

      <button
        type="button"
        onClick={onDismiss}
        className="w-full rounded-xl bg-slate-900 border border-slate-700 hover:border-slate-500 px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-slate-200 cursor-pointer"
      >
        Next passenger
      </button>
    </div>
  );
};

/** Recent taps on this reader, newest first (this browser session only). */
const TapLog: React.FC<{ entries: LogEntry[] }> = ({ entries }) => (
  <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
    <h2 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Recent taps</h2>
    {entries.length === 0 ? (
      <p className="mt-3 text-xs text-slate-500">No taps yet. Show a passenger's QR ticket to the reader.</p>
    ) : (
      <ul className="mt-2 divide-y divide-slate-800">
        {entries.map((entry) => {
          const r = entry.response;
          const fare = r.action === 'TapOut' && r.journey ? formatMoney(r.journey.fareCharged) : null;
          return (
            <li key={entry.id} className="flex items-center gap-3 py-2 text-xs">
              {r.accepted ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              ) : (
                <XCircle className="w-4 h-4 shrink-0 text-rose-400" />
              )}
              <div className="flex-1 min-w-0">
                <div className="text-slate-200 truncate">
                  {RESULT_TITLES[r.result] ?? r.result}
                  {r.isRepeatTap && <span className="text-slate-500"> (repeat)</span>}
                </div>
                <div className="text-[10px] text-slate-500 truncate">
                  {entry.stop} · {r.tokenType === 'GUEST' ? 'Visitor' : r.tokenType === 'LOCAL' ? 'Account' : 'Unknown ticket'}
                </div>
              </div>
              {fare && <span className="font-mono text-slate-200">{fare}</span>}
              <span className="text-[10px] font-mono text-slate-500">
                {entry.at.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </li>
          );
        })}
      </ul>
    )}
  </div>
);

export default BoardingReaderPage;
