import React, { useEffect, useState } from 'react';
import { 
  QrCode, 
  CreditCard, 
  ShieldCheck, 
  ArrowUpRight, 
  Train, 
  Bus, 
  Compass, 
  RefreshCw, 
  History, 
  UserCheck 
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import type { AppRoute, RegisteredUser, CreditTransaction, VehicleDto } from '../types';
import Button from '../components/Button';
import { vehicleApi } from '../api/vehicleApi';

export interface DashboardProps {
  user: RegisteredUser;
  transactions: CreditTransaction[];
  onNavigate: (route: AppRoute) => void;
  onOpenScanner?: (token: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  user,
  transactions,
  onNavigate,
  onOpenScanner,
}) => {
  const [vehicles, setVehicles] = useState<VehicleDto[]>([]);
  const [isLoadingFleet, setIsLoadingFleet] = useState(false);

  const loadFleet = async () => {
    setIsLoadingFleet(true);
    try {
      const res = await vehicleApi.getVehicles();
      if (res.data) {
        setVehicles(res.data);
      }
    } finally {
      setIsLoadingFleet(false);
    }
  };

  useEffect(() => {
    loadFleet();
  }, []);

  return (
    <div className="max-w-6xl mx-auto w-full py-6 space-y-6">
      {/* Top Banner / Welcome */}
      <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-cyan-950/40 border border-slate-800 p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-800/60 text-cyan-300 text-xs font-medium">
            <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
            <span>Active Commuter Pass</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Welcome back, {user.fullName}
          </h1>
          <p className="text-xs text-slate-400 flex items-center gap-2">
            <span>Commuter Code: <strong className="text-slate-300 font-mono">{user.userId}</strong></span>
            <span>•</span>
            <span>Phone: <strong className="text-slate-300 font-mono">{user.phoneNumber}</strong></span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<QrCode className="w-4 h-4 text-emerald-400" />}
            onClick={() => onNavigate('account-qr')}
          >
            Fullscreen Pass
          </Button>

          {onOpenScanner && (
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Compass className="w-4 h-4" />}
              onClick={() => onOpenScanner(user.persistentQrToken)}
            >
              Simulate Gate Tap
            </Button>
          )}
        </div>
      </div>

      {/* Main Grid: Balance & QR Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Balance Card */}
        <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-6 flex flex-col justify-between gap-6 shadow-lg">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Transit Credit Balance
            </span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-4xl font-extrabold font-mono text-cyan-400">
                {user.creditBalance.toFixed(2)}
              </span>
              <span className="text-xs text-slate-400">Credits</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Standard ride fare: 150.00 credits (~$2.50)
            </p>
          </div>

          <div className="space-y-2">
            <Button
              variant="primary"
              size="md"
              leftIcon={<CreditCard className="w-4 h-4" />}
              rightIcon={<ArrowUpRight className="w-4 h-4" />}
              onClick={() => onNavigate('account-credits')}
              className="w-full"
            >
              Top Up Credits
            </Button>
            <p className="text-[10px] text-center text-slate-500">
              Instant reload with bonus credit tiers available
            </p>
          </div>
        </div>

        {/* QR Pass Preview */}
        <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-6 flex flex-col items-center justify-between gap-4 shadow-lg text-center">
          <div className="w-full flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Contactless FastPass
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800 font-mono">
              Ready to Scan
            </span>
          </div>

          <div className="p-3 bg-white rounded-2xl shadow-xl border-4 border-cyan-500/20">
            <QRCodeSVG
              value={user.persistentQrToken}
              size={130}
              level="H"
              includeMargin={false}
            />
          </div>

          <div className="w-full space-y-1">
            <div className="text-xs font-mono text-cyan-400 font-semibold truncate px-2">
              {user.persistentQrToken}
            </div>
            <button
              onClick={() => onNavigate('account-qr')}
              className="text-xs text-slate-400 hover:text-cyan-300 underline underline-offset-4 decoration-cyan-500/30 transition-colors"
            >
              Open High-Brightness Pass View →
            </button>
          </div>
        </div>

        {/* Quick Security & Network Info */}
        <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-6 flex flex-col justify-between gap-4 shadow-lg">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Account Security & Privacy
            </span>
            <div className="mt-3 space-y-2.5 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Zero Password Risk (SMS OTP Auth)</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Encrypted Persistent Transit Credential</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Anonymous Ride Log Hashing</span>
              </div>
            </div>
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => onNavigate('profile')}
            className="w-full"
          >
            Manage Profile & History
          </Button>
        </div>
      </div>

      {/* Live Transit Fleet Status Feed */}
      <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Train className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider">
              Live Transit Fleet & Gate Network
            </h2>
          </div>
          <button
            onClick={loadFleet}
            disabled={isLoadingFleet}
            className="text-xs text-slate-400 hover:text-cyan-400 flex items-center gap-1 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingFleet ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {vehicles.map((v) => (
            <div
              key={v.id}
              className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 flex flex-col gap-2 hover:border-slate-700 transition-colors"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono font-bold text-cyan-400">{v.vehicleCode}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-900 font-medium">
                  {v.status.replace('_', ' ')}
                </span>
              </div>
              <div className="text-xs text-slate-200 font-medium flex items-center gap-1.5">
                {v.type === 'metro' ? <Train className="w-3.5 h-3.5 text-blue-400" /> : <Bus className="w-3.5 h-3.5 text-cyan-400" />}
                <span>{v.line}</span>
              </div>
              <div className="text-[11px] text-slate-400 flex items-center justify-between">
                <span>At: {v.currentStation}</span>
                <span className="text-slate-500">{v.occupancyPercentage}% full</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider">
              Recent Account Transactions
            </h2>
          </div>
          <button
            onClick={() => onNavigate('profile')}
            className="text-xs text-cyan-400 hover:text-cyan-300"
          >
            View all →
          </button>
        </div>

        {transactions.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-500">
            No transit ride deductions or top-ups recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-slate-500 border-b border-slate-800 uppercase tracking-wider">
                <tr>
                  <th className="py-2 font-medium">Type</th>
                  <th className="py-2 font-medium">Description</th>
                  <th className="py-2 font-medium">Date</th>
                  <th className="py-2 font-medium text-right">Amount</th>
                  <th className="py-2 font-medium text-right">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {transactions.slice(0, 5).map((t) => (
                  <tr key={t.id} className="text-slate-300 hover:bg-slate-800/30">
                    <td className="py-2.5 font-medium">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono ${
                          t.type === 'topup'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-900'
                            : 'bg-cyan-950 text-cyan-400 border border-cyan-900'
                        }`}
                      >
                        {t.type === 'topup' ? '+ TOP UP' : '- FARE'}
                      </span>
                    </td>
                    <td className="py-2.5 text-slate-200">{t.description}</td>
                    <td className="py-2.5 text-slate-400 font-mono text-[11px]">
                      {new Date(t.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td
                      className={`py-2.5 font-mono font-bold text-right ${
                        t.type === 'topup' ? 'text-emerald-400' : 'text-slate-300'
                      }`}
                    >
                      {t.type === 'topup' ? `+${t.amount.toFixed(2)}` : `-${t.amount.toFixed(2)}`}
                    </td>
                    <td className="py-2.5 font-mono text-slate-400 text-right">
                      {t.balanceAfter.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
