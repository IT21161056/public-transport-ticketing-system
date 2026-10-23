import React, { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, BarChart3, Bus, Loader2, RefreshCw, ShieldAlert, Wallet } from 'lucide-react';
import { reportApi } from '../api/reportApi';
import type { EvasionByLabel, FareEvasionReport, RevenueReport, RidershipReport } from '../types/report';

type ReportTab = 'ridership' | 'revenue' | 'evasion';

const TABS: { id: ReportTab; label: string; icon: typeof Bus }[] = [
  { id: 'ridership', label: 'Ridership', icon: Bus },
  { id: 'revenue', label: 'Revenue', icon: Wallet },
  { id: 'evasion', label: 'Fare evasion', icon: ShieldAlert },
];

const REASON_LABELS: Record<string, string> = {
  NoActiveJourney: 'No active journey',
  StaleJourney: 'Stale journey',
  InvalidToken: 'Invalid token',
  Expired: 'Pass expired',
  AccountSuspended: 'Account suspended',
};

function formatLkr(amount: number): string {
  return `LKR ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-sm hover:border-slate-700/80 transition-all">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{label}</div>
      <div className="mt-2 text-2xl font-bold font-mono text-white tabular-nums">{value}</div>
      {hint && <div className="mt-1 text-[11px] text-slate-500">{hint}</div>}
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900/70 backdrop-blur-sm p-5 sm:p-6 shadow-md">
      <h2 className="mb-4 text-sm font-bold text-white flex items-center justify-between border-b border-slate-800/80 pb-3">{title}</h2>
      {children}
    </section>
  );
}

/** Horizontal bar list: one row per label, bar width relative to the largest value. */
function BarList({ rows, format = (v) => v.toLocaleString() }: {
  rows: { label: string; value: number; extra?: string }[];
  format?: (value: number) => string;
}) {
  if (rows.length === 0) return <p className="text-xs text-slate-500">No data for this period.</p>;
  const max = Math.max(...rows.map((r) => r.value), 1);
  return (
    <ul className="space-y-2">
      {rows.map((row) => (
        <li key={row.label}>
          <div className="flex justify-between gap-3 text-xs">
            <span className="truncate text-slate-300">{row.label}</span>
            <span className="shrink-0 tabular-nums text-slate-400">
              {format(row.value)}
              {row.extra && <span className="ml-1.5 text-slate-500">{row.extra}</span>}
            </span>
          </div>
          <div className="mt-1 h-1.5 rounded-full bg-slate-800">
            <div className="h-1.5 rounded-full bg-purple-500" style={{ width: `${(row.value / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

/** Vertical column chart for the 24 hours of the day or the days of a period. */
function ColumnChart({ rows, format = (v) => v.toLocaleString() }: {
  rows: { label: string; value: number }[];
  format?: (value: number) => string;
}) {
  if (rows.length === 0) return <p className="text-xs text-slate-500">No data for this period.</p>;
  const max = Math.max(...rows.map((r) => r.value), 1);
  const step = Math.ceil(rows.length / 8);
  return (
    <div>
      <div className="flex h-36 items-end gap-0.5">
        {rows.map((row) => (
          <div
            key={row.label}
            title={`${row.label}: ${format(row.value)}`}
            className="flex-1 rounded-t bg-purple-500/80 hover:bg-purple-400"
            style={{ height: `${Math.max((row.value / max) * 100, row.value > 0 ? 2 : 0)}%` }}
          />
        ))}
      </div>
      <div className="mt-1 flex gap-0.5 text-[9px] text-slate-500">
        {rows.map((row, i) => (
          <span key={row.label} className="flex-1 truncate text-center">
            {i % step === 0 ? row.label.replace(/^\d{4}-/, '') : ''}
          </span>
        ))}
      </div>
    </div>
  );
}

function evasionRows(rows: EvasionByLabel[]) {
  return rows.map((r) => ({ label: r.label, value: r.ratePercent, extra: `(${r.invalid}/${r.inspections})` }));
}

function RidershipView({ report }: { report: RidershipReport }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Total journeys" value={report.totalJourneys.toLocaleString()} />
        <StatCard label="Local commuters" value={report.localJourneys.toLocaleString()} />
        <StatCard label="Guest passes" value={report.guestJourneys.toLocaleString()} />
        <StatCard label="Incomplete" value={report.incompleteJourneys.toLocaleString()} hint="No tap-out recorded" />
      </div>
      <Panel title="Journeys by hour of day (peak times)">
        <ColumnChart rows={report.byHourOfDay.map((r) => ({ label: r.label, value: r.count }))} />
      </Panel>
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Busiest tap-in stations">
          <BarList rows={report.byStation.map((r) => ({ label: r.label, value: r.count }))} />
        </Panel>
        <Panel title="Journeys by day of week">
          <BarList rows={report.byDayOfWeek.map((r) => ({ label: r.label, value: r.count }))} />
        </Panel>
      </div>
    </div>
  );
}

function RevenueView({ report }: { report: RevenueReport }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatCard label="Fare revenue" value={formatLkr(report.totalFareRevenue)} />
        <StatCard label="Completed journeys" value={report.completedJourneys.toLocaleString()} />
        <StatCard label="Average fare" value={formatLkr(report.averageFare)} />
      </div>
      <Panel title="Revenue by day">
        <ColumnChart rows={report.byDay.map((r) => ({ label: r.label, value: r.amount }))} format={formatLkr} />
      </Panel>
      <Panel title="Revenue by tap-in station">
        <BarList
          rows={report.byStation.map((r) => ({ label: r.label, value: r.amount, extra: `(${r.journeys})` }))}
          format={formatLkr}
        />
      </Panel>
      {report.notes.length > 0 && (
        <ul className="space-y-1 rounded-2xl border border-slate-800 bg-slate-950/60 p-4 text-[11px] text-slate-400">
          {report.notes.map((note) => (
            <li key={note}>• {note}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function EvasionView({ report }: { report: FareEvasionReport }) {
  const percent = (v: number) => `${v}%`;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatCard label="Inspections" value={report.totalInspections.toLocaleString()} />
        <StatCard label="Invalid tickets" value={report.invalidInspections.toLocaleString()} />
        <StatCard label="Evasion rate" value={percent(report.evasionRatePercent)} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Locations with the most evasion">
          <BarList rows={evasionRows(report.byLocation)} format={percent} />
        </Panel>
        <Panel title="Why tickets were invalid">
          <BarList rows={report.byReason.map((r) => ({ label: REASON_LABELS[r.label] ?? r.label, value: r.count }))} />
        </Panel>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Evasion rate by hour of day">
          <BarList rows={evasionRows(report.byHourOfDay)} format={percent} />
        </Panel>
        <Panel title="Evasion rate by ticket type">
          <BarList rows={evasionRows(report.byTokenType)} format={percent} />
        </Panel>
      </div>
    </div>
  );
}

/**
 * Manager reports (Module 4): ridership, fare revenue and fare evasion for a chosen period.
 */
export const ReportsPage: React.FC = () => {
  const [tab, setTab] = useState<ReportTab>('ridership');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ridership, setRidership] = useState<RidershipReport | null>(null);
  const [revenue, setRevenue] = useState<RevenueReport | null>(null);
  const [evasion, setEvasion] = useState<FareEvasionReport | null>(null);

  const load = useCallback(async (activeTab: ReportTab, fromDate: string, toDate: string) => {
    setLoading(true);
    setError(null);
    if (activeTab === 'ridership') {
      const res = await reportApi.getRidership(fromDate, toDate);
      if (res.success && res.data) setRidership(res.data);
      else setError(res.message);
    } else if (activeTab === 'revenue') {
      const res = await reportApi.getRevenue(fromDate, toDate);
      if (res.success && res.data) setRevenue(res.data);
      else setError(res.message);
    } else {
      const res = await reportApi.getFareEvasion(fromDate, toDate);
      if (res.success && res.data) setEvasion(res.data);
      else setError(res.message);
    }
    setLoading(false);
  }, []);

  // Reload when the tab changes; date changes apply on "Apply"
  useEffect(() => {
    void load(tab, from, to);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, load]);

  const current = tab === 'ridership' ? ridership : tab === 'revenue' ? revenue : evasion;

  return (
    <div className="w-full space-y-6 sm:space-y-8">
      {/* Operations Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900/95 to-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-950/70 border border-purple-800/60 text-purple-300 text-xs font-medium">
              <BarChart3 className="w-3.5 h-3.5 text-purple-400" />
              <span>Transport Authority Analytics</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
              <span>Operational & Revenue Reports</span>
              <span className="text-xs px-2.5 py-1 rounded-lg bg-emerald-950/80 text-emerald-400 border border-emerald-800/80 font-mono flex items-center gap-1.5 font-normal">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                Live Telematics
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
              High-resolution passenger ridership density, collected fare revenue, and inspection evasion analytics
              for transit capacity planning and inspector scheduling.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 self-start md:self-center shrink-0">
            <div className="px-3.5 py-2 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 font-mono">
              <span className="text-slate-500">Period:</span> {from || 'Last 30 Days'} {to ? `→ ${to}` : ''}
            </div>
          </div>
        </div>
      </div>

      {/* Period filter */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void load(tab, from, to);
        }}
        className="flex flex-wrap items-end gap-3 rounded-3xl border border-slate-800 bg-slate-900/70 backdrop-blur-sm p-4 sm:p-5 shadow-md"
      >
        <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          From Date
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="mt-1.5 block rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white [color-scheme:dark] focus:border-purple-500 focus:outline-none transition-colors"
          />
        </label>
        <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          To Date
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="mt-1.5 block rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white [color-scheme:dark] focus:border-purple-500 focus:outline-none transition-colors"
          />
        </label>
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 rounded-xl bg-purple-600 hover:bg-purple-500 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60 cursor-pointer shadow-md shadow-purple-950/40 transition-all"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Apply Range
        </button>
        <span className="text-[11px] text-slate-500 pb-2">Leave blank to default to rolling 30-day telematics.</span>
      </form>

      {/* Report tabs */}
      <div className="flex gap-2.5 overflow-x-auto pb-1">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            aria-current={tab === id ? 'page' : undefined}
            className={`flex shrink-0 items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-semibold cursor-pointer transition-all ${
              tab === id
                ? 'border-purple-500/50 bg-purple-500/15 text-white shadow-sm shadow-purple-950/50'
                : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:bg-slate-900 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <Icon className="h-4 w-4 text-purple-400" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {error && (
        <div className="flex items-start gap-2.5 rounded-2xl border border-rose-900/50 bg-rose-950/30 p-4 text-sm text-rose-300">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {current && (
        <p className="text-[11px] text-slate-500 font-mono">
          Telematics Window: {current.period.from} to {current.period.to} ({current.period.timeZone})
        </p>
      )}

      {loading && !current && (
        <div className="flex items-center gap-2 py-12 justify-center text-sm text-slate-400">
          <Loader2 className="h-5 w-5 animate-spin text-purple-400" /> Loading telematics dataset…
        </div>
      )}

      {tab === 'ridership' && ridership && <RidershipView report={ridership} />}
      {tab === 'revenue' && revenue && <RevenueView report={revenue} />}
      {tab === 'evasion' && evasion && <EvasionView report={evasion} />}
    </div>
  );
};

export default ReportsPage;
