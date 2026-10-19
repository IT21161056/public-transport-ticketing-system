import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Users,
  Coins,
  Ticket,
  TrendingUp,
  Shield,
  Search,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Radio,
  X,
  MapPin,
  Train,
  UserCheck,
  UserX,
  LayoutDashboard,
  ArrowRight
} from 'lucide-react';
import type { 
  RegisteredUser, 
  AdminDashboardStats, 
  AdminUserItem, 
  AdminJourneyItem, 
  AdminGuestPassItem 
} from '../types';
import { adminApi } from '../api/adminApi';
import Button from '../components/Button';

export interface AdminDashboardProps {
  user: RegisteredUser | null;
  onOpenScanner?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  user,
  onOpenScanner,
}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab: 'overview' | 'users' | 'journeys' | 'passes' =
    (searchParams.get('tab') as 'overview' | 'users' | 'journeys' | 'passes') || 'overview';

  const setActiveTab = (tab: 'overview' | 'users' | 'journeys' | 'passes') => {
    setSearchParams({ tab });
  };
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [journeys, setJourneys] = useState<AdminJourneyItem[]>([]);
  const [guestPasses, setGuestPasses] = useState<AdminGuestPassItem[]>([]);
  
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Balance adjustment modal
  const [selectedUserForBalance, setSelectedUserForBalance] = useState<AdminUserItem | null>(null);
  const [adjustmentAmount, setAdjustmentAmount] = useState<number>(100);
  const [adjustmentReason, setAdjustmentReason] = useState<string>('Admin manual credit reload');
  const [isAdjusting, setIsAdjusting] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const [statsRes, usersRes, journeysRes, passesRes] = await Promise.all([
        adminApi.getDashboardStats(),
        adminApi.getUsers(),
        adminApi.getJourneys(50),
        adminApi.getGuestPasses(50),
      ]);

      if (statsRes.success && statsRes.stats) {
        setStats(statsRes.stats);
      }
      if (usersRes.success) {
        setUsers(usersRes.users);
      }
      if (journeysRes.success) {
        setJourneys(journeysRes.journeys);
      }
      if (passesRes.success) {
        setGuestPasses(passesRes.passes);
      }
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const showToast = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleToggleStatus = async (targetUser: AdminUserItem) => {
    const nextStatus = !targetUser.isActive;
    const res = await adminApi.updateUserStatus(targetUser.id, nextStatus);
    if (res.success) {
      setUsers((prev) =>
        prev.map((u) => (u.id === targetUser.id ? { ...u, isActive: nextStatus } : u))
      );
      showToast('success', `${targetUser.fullName}'s account is now ${nextStatus ? 'Active' : 'Suspended'}.`);
    } else {
      showToast('error', res.message);
    }
  };

  const handleAdjustBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForBalance) return;

    setIsAdjusting(true);
    try {
      const res = await adminApi.adjustUserBalance(
        selectedUserForBalance.id,
        adjustmentAmount,
        adjustmentReason
      );

      if (res.success && res.newBalance !== undefined) {
        setUsers((prev) =>
          prev.map((u) =>
            u.id === selectedUserForBalance.id ? { ...u, creditBalance: res.newBalance! } : u
          )
        );
        showToast('success', `Balance updated! New balance: ${res.newBalance.toFixed(2)} Credits`);
        setSelectedUserForBalance(null);
        // Refresh stats
        const statsRes = await adminApi.getDashboardStats();
        if (statsRes.success && statsRes.stats) setStats(statsRes.stats);
      } else {
        showToast('error', res.message);
      }
    } finally {
      setIsAdjusting(false);
    }
  };

  // Filtered users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        !searchTerm ||
        u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.phoneNumber && u.phoneNumber.includes(searchTerm)) ||
        (u.email && u.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (u.userName && u.userName.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesRole =
        roleFilter === 'all' ||
        (roleFilter === 'admin' && u.role === 2) ||
        (roleFilter === 'inspector' && u.role === 1) ||
        (roleFilter === 'commuter' && u.role === 0);

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && u.isActive) ||
        (statusFilter === 'suspended' && !u.isActive);

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchTerm, roleFilter, statusFilter]);

  return (
    <div className="max-w-7xl mx-auto w-full py-4 sm:py-6 space-y-8 animate-in fade-in duration-300">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed top-20 right-6 z-50 p-4 rounded-2xl border shadow-2xl flex items-center gap-3 text-sm animate-in slide-in-from-top duration-200 ${
            notification.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-500/80 text-emerald-200 shadow-emerald-950/40'
              : 'bg-rose-950/90 border-rose-500/80 text-rose-200 shadow-rose-950/40'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
          )}
          <span>{notification.message}</span>
          <button onClick={() => setNotification(null)} className="ml-2 hover:opacity-80">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Operations Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900/95 to-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-950/70 border border-purple-800/60 text-purple-300 text-xs font-medium">
              <Shield className="w-3.5 h-3.5 text-purple-400" />
              <span>Transit Authority Operations Center</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
              <span>Network Operations & User Admin</span>
              <span className="text-xs px-2.5 py-1 rounded-lg bg-emerald-950/80 text-emerald-400 border border-emerald-800/80 font-mono flex items-center gap-1.5 font-normal">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Live Grid Active
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
              Logged in as <strong className="text-slate-200">{user?.fullName || 'System Administrator'}</strong> ({user?.userName || 'admin'}). Manage commuter digital wallets, network turnstile gate feeds, and temporary passes.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 self-start md:self-center shrink-0">
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
              onClick={fetchDashboardData}
              disabled={isLoading}
            >
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Card 1 */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all shadow-md group">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Commuters</span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20 group-hover:scale-110 transition-transform">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {stats?.totalUsers ?? users.length}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Registered accounts</span>
        </div>

        {/* Card 2 */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all shadow-md group">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Wallet Float</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20 group-hover:scale-110 transition-transform">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400">
            {(stats?.totalWalletCredits ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Circulating credits</span>
        </div>

        {/* Card 3 */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all shadow-md group">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Guest Passes</span>
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/20 group-hover:scale-110 transition-transform">
              <Ticket className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-cyan-400">
            {stats?.activeGuestPasses ?? guestPasses.filter(p => p.isActive).length}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Time-bound visitor passes</span>
        </div>

        {/* Card 4 */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all shadow-md group">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Gate Journeys</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20 group-hover:scale-110 transition-transform">
              <Train className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-indigo-400">
            {stats?.totalJourneys ?? journeys.length}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Turnstile tap events</span>
        </div>

        {/* Card 5 */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all shadow-md group">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Fares Collected</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20 group-hover:scale-110 transition-transform">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-amber-400">
            {(stats?.totalFareCollected ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Distance fare revenue</span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-800 gap-2 sm:gap-6 text-sm font-medium overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 px-2 flex items-center gap-2 border-b-2 transition-colors cursor-pointer shrink-0 ${
            activeTab === 'overview'
              ? 'border-purple-400 text-purple-300 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>Operations Overview</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`pb-3 px-2 flex items-center gap-2 border-b-2 transition-colors cursor-pointer shrink-0 ${
            activeTab === 'users'
              ? 'border-purple-400 text-purple-300 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Commuters & System Users ({users.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('journeys')}
          className={`pb-3 px-2 flex items-center gap-2 border-b-2 transition-colors cursor-pointer shrink-0 ${
            activeTab === 'journeys'
              ? 'border-purple-400 text-purple-300 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Radio className="w-4 h-4 text-cyan-400" />
          <span>Turnstile Journey Stream ({journeys.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('passes')}
          className={`pb-3 px-2 flex items-center gap-2 border-b-2 transition-colors cursor-pointer shrink-0 ${
            activeTab === 'passes'
              ? 'border-purple-400 text-purple-300 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Ticket className="w-4 h-4 text-emerald-400" />
          <span>Guest Passes Fleet ({guestPasses.length})</span>
        </button>
      </div>

      {/* Tab 0: Operations Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Quick Stream Preview */}
            <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/20">
                    <Radio className="w-4 h-4 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Recent Turnstile Activity</h3>
                    <p className="text-[11px] text-slate-400 font-mono">Latest gate scans & trips</p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('journeys')}
                  className="text-xs text-purple-400 hover:text-purple-300 font-medium flex items-center gap-1 cursor-pointer"
                >
                  <span>View All ({journeys.length})</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {journeys.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500">
                  No journeys recorded yet. Tap QR in the Gate Simulator to test.
                </div>
              ) : (
                <div className="space-y-2">
                  {journeys.slice(0, 4).map((j) => (
                    <div
                      key={j.id}
                      className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <div>
                          <div className="font-semibold text-slate-200">
                            {j.commuterName || 'Visitor Guest'}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {j.tapInStation} {j.tapOutStation ? `→ ${j.tapOutStation}` : '(In Transit)'}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-bold text-emerald-400">
                          {j.fareAmount > 0 ? `-${j.fareAmount.toFixed(2)}` : '0.00'}
                        </div>
                        <div className="text-[10px] font-mono text-slate-500">
                          {new Date(j.tapInTimeUtc).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Commuters Preview */}
            <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Registered Commuters</h3>
                    <p className="text-[11px] text-slate-400 font-mono">Active accounts & balances</p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('users')}
                  className="text-xs text-purple-400 hover:text-purple-300 font-medium flex items-center gap-1 cursor-pointer"
                >
                  <span>Manage All ({users.length})</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {users.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500">
                  No registered users in the network database.
                </div>
              ) : (
                <div className="space-y-2">
                  {users.slice(0, 4).map((u) => (
                    <div
                      key={u.id}
                      className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
                          {u.fullName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-200">{u.fullName}</div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {u.phoneNumber || u.email || `@${u.userName}`}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-bold text-emerald-400">
                          {u.creditBalance.toFixed(2)} Cr
                        </div>
                        <span
                          className={`text-[9px] font-mono px-1.5 py-0.2 rounded-full border ${
                            u.isActive
                              ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                              : 'bg-rose-950 text-rose-400 border-rose-800'
                          }`}
                        >
                          {u.isActive ? 'Active' : 'Suspended'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Quick Action Banner */}
          <div className="p-6 rounded-3xl bg-gradient-to-r from-purple-950/40 via-slate-900 to-slate-900/90 border border-purple-900/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Shield className="w-4 h-4 text-purple-400" />
                <span>Simulate Turnstile Gate Clearance</span>
              </h4>
              <p className="text-xs text-slate-400 mt-1">
                Test commuter wallet tap-in / tap-out or visitor guest passes in real-time.
              </p>
            </div>
            {onOpenScanner && (
              <button
                onClick={onOpenScanner}
                className="py-2 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-purple-950/50 transition-all cursor-pointer"
              >
                <Radio className="w-3.5 h-3.5" />
                <span>Launch Gate Simulator</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Tab 1: Commuter & User Management */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/60 border border-slate-800 p-3.5 rounded-2xl">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search commuter by name, phone, email, or username..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-purple-500"
              >
                <option value="all">All Roles</option>
                <option value="commuter">Commuters Only</option>
                <option value="inspector">Inspectors Only</option>
                <option value="admin">Administrators Only</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-purple-500"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active Only</option>
                <option value="suspended">Suspended Only</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="rounded-2xl border border-slate-800 overflow-hidden bg-slate-900/60 shadow-xl">
            <div className="overflow-x-auto">
              <table aria-label="Commuters and System Users Directory" className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/80 uppercase tracking-wider text-[11px] text-slate-400 border-b border-slate-800 font-mono">
                  <tr>
                    <th scope="col" className="px-5 py-3.5">User / Commuter</th>
                    <th scope="col" className="px-5 py-3.5">Role</th>
                    <th scope="col" className="px-5 py-3.5">Transit Balance</th>
                    <th scope="col" className="px-5 py-3.5">Status</th>
                    <th scope="col" className="px-5 py-3.5">Registered</th>
                    <th scope="col" className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-10 text-slate-400">
                        No commuters or system users found matching the filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-sm">
                              {u.fullName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-semibold text-white text-sm">{u.fullName}</div>
                              <div className="text-[11px] text-slate-400 font-mono">
                                {u.phoneNumber || u.email || `@${u.userName}`}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border ${
                              u.role === 2
                                ? 'bg-purple-950/60 text-purple-300 border-purple-800/60'
                                : u.role === 1
                                ? 'bg-cyan-950/60 text-cyan-300 border-cyan-800/60'
                                : 'bg-blue-950/60 text-blue-300 border-blue-800/60'
                            }`}
                          >
                            {u.roleName}
                          </span>
                        </td>

                        <td className="px-5 py-4 font-mono font-bold text-slate-200">
                          <span className={u.creditBalance < 50 ? 'text-amber-400' : 'text-emerald-400'}>
                            {u.creditBalance.toFixed(2)} Credits
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border ${
                              u.isActive
                                ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60'
                                : 'bg-rose-950/60 text-rose-300 border-rose-800/60'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                u.isActive ? 'bg-emerald-400' : 'bg-rose-400'
                              }`}
                            />
                            {u.isActive ? 'Active' : 'Suspended'}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-slate-400 text-[11px] font-mono">
                          {new Date(u.createdAtUtc).toLocaleDateString()}
                        </td>

                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* Adjust Balance Trigger */}
                            <button
                              onClick={() => {
                                setSelectedUserForBalance(u);
                                setAdjustmentAmount(100);
                                setAdjustmentReason('Customer compensation / Top up');
                              }}
                              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium transition-colors flex items-center gap-1 cursor-pointer"
                              title="Adjust Credit Balance"
                            >
                              <Coins className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Adjust</span>
                            </button>

                            {/* Suspend / Activate Toggle */}
                            <button
                              onClick={() => handleToggleStatus(u)}
                              disabled={u.role === 2 && u.userName === 'admin'}
                              className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                                u.isActive
                                  ? 'bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/60'
                                  : 'bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-800/60'
                              } disabled:opacity-30 disabled:cursor-not-allowed`}
                              title={u.isActive ? 'Suspend Commuter Account' : 'Reactivate Account'}
                            >
                              {u.isActive ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Turnstile Journey Stream */}
      {activeTab === 'journeys' && (
        <div className="space-y-4">
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex items-center justify-between text-xs text-slate-400">
            <span className="font-mono">Live turnstile optical scan feed from all metro & bus stations</span>
            <span className="text-emerald-400 font-mono flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              Stream Synchronized
            </span>
          </div>

          <div className="rounded-2xl border border-slate-800 overflow-hidden bg-slate-900/60 shadow-xl">
            <div className="overflow-x-auto">
              <table aria-label="Turnstile Journey Stream" className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/80 uppercase tracking-wider text-[11px] text-slate-400 border-b border-slate-800 font-mono">
                  <tr>
                    <th scope="col" className="px-5 py-3.5">Passenger</th>
                    <th scope="col" className="px-5 py-3.5">Tap-In Station</th>
                    <th scope="col" className="px-5 py-3.5">Tap-Out Station</th>
                    <th scope="col" className="px-5 py-3.5">Fare Deducted</th>
                    <th scope="col" className="px-5 py-3.5">Status</th>
                    <th scope="col" className="px-5 py-3.5">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 font-mono">
                  {journeys.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-10 text-slate-400 font-sans">
                        No transit journeys recorded yet. Tap a QR code via Gate Simulator to populate live events.
                      </td>
                    </tr>
                  ) : (
                    journeys.map((j) => (
                      <tr key={j.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="px-5 py-3.5 font-sans">
                          <span className="font-semibold text-white block">
                            {j.commuterName || 'Guest Visitor Pass'}
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono">
                            {j.commuterPhone || j.deviceUuid || 'Contactless Scan'}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-cyan-300 font-sans">
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                            <span>{j.tapInStation}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-slate-300 font-sans">
                          {j.tapOutStation ? (
                            <div className="flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                              <span>{j.tapOutStation}</span>
                            </div>
                          ) : (
                            <span className="text-amber-400 italic">In Transit...</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 font-bold text-emerald-400">
                          {j.fareAmount > 0 ? `-${j.fareAmount.toFixed(2)} Credits` : '0.00 (Pass Ride)'}
                        </td>
                        <td className="px-5 py-3.5">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${
                              j.status === 'Completed'
                                ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60'
                                : 'bg-amber-950/60 text-amber-300 border-amber-800/60'
                            }`}
                          >
                            {j.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-slate-400 text-[11px]">
                          {new Date(j.tapInTimeUtc).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Guest Passes Fleet */}
      {activeTab === 'passes' && (
        <div className="space-y-4">
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex items-center justify-between text-xs text-slate-400">
            <span className="font-mono">Time-bound contactless visitor passes issued across the network</span>
            <span className="text-cyan-400 font-mono">
              Total Active: {guestPasses.filter((p) => p.isActive).length}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {guestPasses.length === 0 ? (
              <div className="col-span-full text-center py-12 text-slate-400 bg-slate-900/40 rounded-2xl border border-slate-800">
                No guest passes issued yet.
              </div>
            ) : (
              guestPasses.map((p) => (
                <div
                  key={p.id}
                  className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between gap-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800 font-mono">
                        {p.passTier} PASS
                      </span>
                      <h4 className="text-sm font-bold text-white mt-2 font-mono truncate max-w-[220px]">
                        {p.deviceUuid}
                      </h4>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${
                        p.isActive
                          ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60'
                          : 'bg-rose-950/60 text-rose-300 border-rose-800/60'
                      }`}
                    >
                      {p.isActive ? 'ACTIVE' : 'EXPIRED'}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-400 font-mono border-t border-slate-800/80 pt-3">
                    <div className="flex justify-between">
                      <span>Issued:</span>
                      <span className="text-slate-300">{new Date(p.createdAtUtc).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Expires:</span>
                      <span className="text-slate-300">
                        {p.expiresAtUtc ? new Date(p.expiresAtUtc).toLocaleString() : 'Permanent'}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Balance Adjustment Modal */}
      {selectedUserForBalance && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="balance-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
        >
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl relative">
            <button
              onClick={() => setSelectedUserForBalance(null)}
              aria-label="Close dialog"
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-xl bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/30">
                <Coins className="w-5 h-5" />
              </div>
              <div>
                <h3 id="balance-modal-title" className="text-lg font-bold text-white tracking-tight">
                  Adjust Wallet Balance
                </h3>
                <p className="text-xs text-slate-400 font-mono">
                  {selectedUserForBalance.fullName} ({selectedUserForBalance.phoneNumber || selectedUserForBalance.userName})
                </p>
              </div>
            </div>

            <div className="mb-5 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 flex justify-between items-center text-xs">
              <span className="text-slate-400">Current Balance:</span>
              <span className="font-mono font-bold text-emerald-400 text-sm">
                {selectedUserForBalance.creditBalance.toFixed(2)} Credits
              </span>
            </div>

            <form onSubmit={handleAdjustBalance} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase font-mono">
                  Adjustment Delta (Credits)
                </label>
                <div className="grid grid-cols-4 gap-2 mb-2">
                  {[50, 100, 250, 500].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setAdjustmentAmount(amt)}
                      className={`py-1.5 rounded-lg text-xs font-mono font-semibold border transition-all ${
                        adjustmentAmount === amt
                          ? 'bg-purple-600 text-white border-purple-500'
                          : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      +{amt}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  step="0.01"
                  value={adjustmentAmount}
                  onChange={(e) => setAdjustmentAmount(parseFloat(e.target.value) || 0)}
                  required
                  placeholder="e.g. 100 or -50"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white font-mono focus:outline-none focus:border-purple-400"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Positive numbers add credits; negative numbers deduct credits.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase font-mono">
                  Audit Log Reason
                </label>
                <input
                  type="text"
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  required
                  placeholder="e.g. Turnstile refund / Commuter compensation"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-purple-400"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setSelectedUserForBalance(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500"
                  isLoading={isAdjusting}
                >
                  Confirm Adjustment
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
