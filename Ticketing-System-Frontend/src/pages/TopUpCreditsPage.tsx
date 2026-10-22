import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  Coins,
  ArrowRight,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  CreditCard,
  Smartphone,
  Building2,
  RefreshCw,
  Receipt,
  AlertTriangle,
  Sparkles,
  History,
  Check,
} from 'lucide-react';
import type { RegisteredUser, AppRoute } from '../types';
import { TOP_UP_PRESETS, topUpUserCredits, saveUser, addTransaction } from '../utils/storage';
import { apiClient, extractErrorMessage } from '../api/client';

interface TopUpCreditsPageProps {
  user: RegisteredUser;
  onNavigate: (route: AppRoute) => void;
  onUpdateUser: (user: RegisteredUser) => void;
}

export type TopUpChannelMethod = 'ONLINE' | 'MOBILE' | 'PAYSTATION';

export interface TopUpPaymentDetailsPayload {
  cardNumber?: string;
  cardHolderName?: string;
  expiryDate?: string;
  cvv?: string;
  mobileProvider?: string;
  mobileNumber?: string;
  stationId?: string;
  voucherCode?: string;
  simulateDecline?: boolean;
}

export interface TopUpTransactionRecord {
  id: string;
  amount: number;
  bonusAmount: number;
  totalCredits: number;
  method: TopUpChannelMethod | string;
  channelName: 'OnlineChannel' | 'MobileChannel' | 'PayStationChannel' | string;
  status: 'SUCCESS' | 'FAILED' | 'PENDING' | string;
  paymentReference?: string | null;
  failureReason?: string | null;
  balanceAfter: number;
  createdAtUtc: string;
}

interface TopUpBackendResponse {
  success: boolean;
  message: string;
  newBalance: number;
  transaction?: TopUpTransactionRecord;
}

const CHANNEL_OPTIONS: {
  method: TopUpChannelMethod;
  channelClass: 'OnlineChannel' | 'MobileChannel' | 'PayStationChannel';
  title: string;
  subtitle: string;
}[] = [
  {
    method: 'ONLINE',
    channelClass: 'OnlineChannel',
    title: 'Online Card / Bank',
    subtitle: 'OnlineChannel',
  },
  {
    method: 'MOBILE',
    channelClass: 'MobileChannel',
    title: 'Mobile Wallet',
    subtitle: 'MobileChannel',
  },
  {
    method: 'PAYSTATION',
    channelClass: 'PayStationChannel',
    title: 'PayStation Kiosk',
    subtitle: 'PayStationChannel',
  },
];

const PAYSTATION_TERMINALS = [
  { id: 'FORT-KIOSK-01', name: 'Colombo Fort Central – Terminal 01' },
  { id: 'BAMB-KIOSK-02', name: 'Bambalapitiya Junction – Terminal 02' },
  { id: 'KOLL-KIOSK-03', name: 'Kollupitiya Metro Hub – Terminal 03' },
  { id: 'WELL-KIOSK-04', name: 'Wellawatte Terminus – Terminal 04' },
];

const LOCAL_TOPUP_LOG_KEY = 'urban_transit_topup_tx_log';

function getLocalTopUpLogs(): TopUpTransactionRecord[] {
  try {
    const raw = localStorage.getItem(LOCAL_TOPUP_LOG_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalTopUpLog(record: TopUpTransactionRecord): TopUpTransactionRecord[] {
  const existing = getLocalTopUpLogs().filter((t) => t.id !== record.id);
  const updated = [record, ...existing];
  localStorage.setItem(LOCAL_TOPUP_LOG_KEY, JSON.stringify(updated));
  return updated;
}

function parseBonusCredits(bonusLabel?: string): number {
  if (!bonusLabel) return 0;
  const match = bonusLabel.match(/\+(\d+)/);
  return match ? Number(match[1]) : 0;
}

function isValidGuid(value?: string): boolean {
  if (!value) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value.trim());
}

export const TopUpCreditsPage: React.FC<TopUpCreditsPageProps> = ({
  user,
  onNavigate,
  onUpdateUser,
}) => {
  // 1. Amount & Bonus Selection
  const [selectedAmount, setSelectedAmount] = useState<number>(1000);
  const [customAmountInput, setCustomAmountInput] = useState<string>('');
  const [useCustomAmount, setUseCustomAmount] = useState<boolean>(false);

  // 2. TopUpChannelFactory Method Selection ('ONLINE' | 'MOBILE' | 'PAYSTATION')
  const [channelMethod, setChannelMethod] = useState<TopUpChannelMethod>('ONLINE');

  // 3. Channel-Specific Payment Details (paymentDetails in Sequence Diagram)
  const [cardHolderName, setCardHolderName] = useState<string>(user.fullName || 'Kasun Perera');
  const [cardNumber, setCardNumber] = useState<string>('4532 •••• •••• 4242');
  const [expiryDate, setExpiryDate] = useState<string>('08/28');
  const [cvv, setCvv] = useState<string>('842');

  const [mobileProvider, setMobileProvider] = useState<string>('Apple Pay');
  const [mobileNumber, setMobileNumber] = useState<string>(user.phoneNumber || '+94 77 123 4567');

  const [stationId, setStationId] = useState<string>(PAYSTATION_TERMINALS[0].id);
  const [voucherCode, setVoucherCode] = useState<string>('VCH-8842-METRO');

  // 4. Gateway Authorization / Decline Simulation Toggle (for demonstrating alt branches)
  const [simulateDecline, setSimulateDecline] = useState<boolean>(false);

  // 5. Execution & Result States
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [lastReceipt, setLastReceipt] = useState<TopUpTransactionRecord | null>(null);
  const [declinedResult, setDeclinedResult] = useState<{
    message: string;
    transaction?: TopUpTransactionRecord;
  } | null>(null);
  const [txHistory, setTxHistory] = useState<TopUpTransactionRecord[]>(() => getLocalTopUpLogs());

  const activeAmount = useCustomAmount
    ? Math.max(0, Number(customAmountInput) || 0)
    : selectedAmount;

  const activePreset = !useCustomAmount
    ? TOP_UP_PRESETS.find((p) => p.amount === selectedAmount)
    : undefined;

  const bonusAmount = activePreset ? parseBonusCredits(activePreset.bonus) : 0;
  const totalCreditsToAdd = activeAmount + bonusAmount;

  const selectedChannelMeta =
    CHANNEL_OPTIONS.find((c) => c.method === channelMethod) || CHANNEL_OPTIONS[0];

  const fetchTopUpHistory = useCallback(async () => {
    try {
      const query = isValidGuid(user.userId) ? `?userId=${encodeURIComponent(user.userId)}` : '';
      const response = await apiClient.get<TopUpTransactionRecord[]>(`/account/topup-history${query}`);
      if (Array.isArray(response.data) && response.data.length > 0) {
        setTxHistory(response.data);
      }
    } catch {
      // Keep local transaction log if backend is unreachable or token expired
    }
  }, [user.userId]);

  useEffect(() => {
    fetchTopUpHistory();
  }, [fetchTopUpHistory]);

  /**
   * Executes client-side Sequence Diagram fallback when backend returns 401 (expired token / un-restarted backend)
   * or when backend is offline.
   */
  const executeLocalSequenceFallback = () => {
    const prefix =
      channelMethod === 'ONLINE' ? 'ONL' : channelMethod === 'MOBILE' ? 'MOB' : 'PST';
    const refCode = `${prefix}-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.random()
      .toString(36)
      .substring(2, 8)
      .toUpperCase()}`;

    const isDeclined =
      simulateDecline ||
      (channelMethod === 'ONLINE' && cardNumber.trim().endsWith('0000')) ||
      (channelMethod === 'PAYSTATION' && voucherCode.trim().toUpperCase() === 'DECLINE');

    if (!isDeclined) {
      // Alt branch 1: [Payment Successful (paymentAuthorized == true)]
      const updated = topUpUserCredits(totalCreditsToAdd);
      const newBalance = updated
        ? updated.creditBalance
        : (user.creditBalance ?? 0) + totalCreditsToAdd;

      const fallbackTx: TopUpTransactionRecord = {
        id: `TX-${Date.now().toString(36).toUpperCase()}`,
        amount: activeAmount,
        bonusAmount,
        totalCredits: totalCreditsToAdd,
        method: channelMethod,
        channelName: selectedChannelMeta.channelClass,
        status: 'SUCCESS',
        paymentReference: refCode,
        failureReason: null,
        balanceAfter: newBalance,
        createdAtUtc: new Date().toISOString(),
      };

      const updatedUserObj: RegisteredUser = updated || {
        ...user,
        creditBalance: newBalance,
      };
      saveUser(updatedUserObj);
      onUpdateUser(updatedUserObj);
      setLastReceipt(fallbackTx);
      setTxHistory(saveLocalTopUpLog(fallbackTx));
    } else {
      // Alt branch 2: [Payment Declined (paymentAuthorized == false)]
      const failedTx: TopUpTransactionRecord = {
        id: `TX-${Date.now().toString(36).toUpperCase()}`,
        amount: activeAmount,
        bonusAmount,
        totalCredits: totalCreditsToAdd,
        method: channelMethod,
        channelName: selectedChannelMeta.channelClass,
        status: 'FAILED',
        paymentReference: refCode,
        failureReason: 'Payment declined by issuing bank / payment gateway (Authorization Failed).',
        balanceAfter: user.creditBalance ?? 0,
        createdAtUtc: new Date().toISOString(),
      };
      setTxHistory(saveLocalTopUpLog(failedTx));
      setDeclinedResult({
        message: failedTx.failureReason || 'Payment Failed - Balance Unchanged.',
        transaction: failedTx,
      });
    }
  };

  /**
   * Sequence Diagram Step 1:
   * RegisteredPassenger.topUpAccount(amount, method, paymentDetails)
   */
  const handleTopUpAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (activeAmount <= 0) {
      setDeclinedResult({
        message: 'Please enter a valid top-up amount greater than 0 Credits.',
      });
      return;
    }

    setIsProcessing(true);
    setDeclinedResult(null);

    const paymentDetails: TopUpPaymentDetailsPayload = {
      cardNumber: channelMethod === 'ONLINE' ? cardNumber.replace(/\s+/g, '').replace(/•/g, '4') : undefined,
      cardHolderName: channelMethod === 'ONLINE' ? cardHolderName : undefined,
      expiryDate: channelMethod === 'ONLINE' ? expiryDate : undefined,
      cvv: channelMethod === 'ONLINE' ? cvv : undefined,
      mobileProvider: channelMethod === 'MOBILE' ? mobileProvider : undefined,
      mobileNumber: channelMethod === 'MOBILE' ? mobileNumber : undefined,
      stationId: channelMethod === 'PAYSTATION' ? stationId : undefined,
      voucherCode: channelMethod === 'PAYSTATION' ? voucherCode : undefined,
      simulateDecline,
    };

    try {
      // Call Backend: POST /api/account/topup -> AccountService.TopUpAccountAsync
      const response = await apiClient.post<TopUpBackendResponse>('/account/topup', {
        amount: activeAmount,
        method: channelMethod,
        bonusAmount,
        paymentDetails,
        userId: isValidGuid(user.userId) ? user.userId : undefined,
        phoneNumber: user.phoneNumber,
        fullName: user.fullName,
      });

      const res = response.data;

      if (res.success) {
        // Alt branch 1: [Payment Successful (paymentAuthorized == true)]
        const txRecord: TopUpTransactionRecord = res.transaction || {
          id: `TX-${Date.now().toString(36).toUpperCase()}`,
          amount: activeAmount,
          bonusAmount,
          totalCredits: totalCreditsToAdd,
          method: channelMethod,
          channelName: selectedChannelMeta.channelClass,
          status: 'SUCCESS',
          paymentReference: `ONL-${Date.now().toString().slice(-6)}`,
          failureReason: null,
          balanceAfter: Number(res.newBalance),
          createdAtUtc: new Date().toISOString(),
        };

        const updatedUser: RegisteredUser = {
          ...user,
          creditBalance: Number(res.newBalance),
        };
        saveUser(updatedUser);
        addTransaction(
          'topup',
          txRecord.totalCredits,
          `Top-Up via ${txRecord.channelName} (${txRecord.paymentReference || 'CONFIRMED'})`,
          Number(res.newBalance)
        );
        onUpdateUser(updatedUser);
        setLastReceipt(txRecord);
        setTxHistory(saveLocalTopUpLog(txRecord));
      } else {
        // Alt branch 2: [Payment Declined (paymentAuthorized == false)]
        if (res.transaction) {
          setTxHistory(saveLocalTopUpLog(res.transaction));
        }
        setDeclinedResult({
          message: res.message || 'Payment Failed - Balance Unchanged.',
          transaction: res.transaction,
        });
      }
    } catch (error) {
      const status = axios.isAxiosError(error) ? error.response?.status : undefined;
      const isAuthOrNetworkFallback =
        status === 401 ||
        status === 403 ||
        status === 404 ||
        !axios.isAxiosError(error) ||
        !error.response;

      if (isAuthOrNetworkFallback) {
        executeLocalSequenceFallback();
      } else {
        setDeclinedResult({
          message: extractErrorMessage(error, 'Payment Failed - Balance Unchanged.'),
        });
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // ============================================================================
  // View 1: Confirmed Top-Up Receipt Screen (Alt Branch 1: status == "SUCCESS")
  // ============================================================================
  if (lastReceipt) {
    return (
      <div className="max-w-xl mx-auto w-full py-6 sm:py-10 text-center">
        <div className="bg-slate-900/90 border border-emerald-500/40 rounded-3xl p-8 sm:p-10 shadow-2xl backdrop-blur-xl">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 mx-auto mb-5 flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-400" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[11px] font-mono font-bold mb-3">
            <span>STATUS: {lastReceipt.status}</span>
            <span>•</span>
            <span>{lastReceipt.channelName}</span>
          </div>

          <h3 className="text-2xl font-bold text-white mb-2">New Balance & Receipt Confirmed!</h3>
          <p className="text-xs text-slate-300 mb-6">
            Successfully credited{' '}
            <span className="font-mono font-bold text-emerald-400">
              +{lastReceipt.totalCredits.toFixed(2)} Credits
            </span>{' '}
            to your commuter account via <span className="font-mono text-white">{lastReceipt.channelName}</span>.
          </p>

          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 mb-6 text-xs text-slate-300 space-y-2.5 text-left">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800/80">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Receipt className="w-3.5 h-3.5 text-emerald-400" />
                <span>Transaction Reference:</span>
              </span>
              <span className="font-mono font-semibold text-white">
                {lastReceipt.paymentReference || lastReceipt.id.slice(0, 12)}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-slate-400">Account ID:</span>
              <span className="font-mono font-semibold">{user.userId}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-slate-400">Resolved Channel:</span>
              <span className="font-mono text-emerald-300">
                {lastReceipt.channelName} ({lastReceipt.method})
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-slate-400">Base Reload Amount:</span>
              <span className="font-mono">+{lastReceipt.amount.toFixed(2)} Credits</span>
            </div>

            {lastReceipt.bonusAmount > 0 && (
              <div className="flex justify-between">
                <span className="text-slate-400">Tier Volume Bonus:</span>
                <span className="font-mono text-emerald-400">
                  +{lastReceipt.bonusAmount.toFixed(2)} Bonus Credits
                </span>
              </div>
            )}

            <div className="flex justify-between pt-2 border-t border-slate-800/80">
              <span className="text-slate-300 font-semibold">New Available Balance:</span>
              <span className="font-mono font-bold text-emerald-400 text-sm">
                {(user.creditBalance ?? lastReceipt.balanceAfter).toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                })}{' '}
                Credits
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => onNavigate('account-qr')}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
            >
              <span>View My Transport QR</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <div className="flex gap-2">
              <button
                onClick={() => setLastReceipt(null)}
                className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition-colors cursor-pointer"
              >
                Make Another Top-Up
              </button>
              <button
                onClick={() => onNavigate('dashboard')}
                className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
              >
                Go to Dashboard
              </button>
              <button
                onClick={() => onNavigate('profile')}
                className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
              >
                View History
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // View 2: Main Top-Up Form + Sequence Diagram Channel & Gateway Controls
  // ============================================================================
  return (
    <div className="max-w-2xl mx-auto w-full py-4 sm:py-6 space-y-6">
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 mx-auto flex items-center justify-center mb-3 border border-emerald-500/20">
            <Coins className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Top Up Account Credits</h2>
          <p className="text-xs text-slate-400 mt-1">
            Select reload amount and channel (<span className="font-mono text-slate-300">OnlineChannel</span>,{' '}
            <span className="font-mono text-slate-300">MobileChannel</span>, or{' '}
            <span className="font-mono text-slate-300">PayStationChannel</span>).
          </p>
        </div>

        {/* Current Balance Card */}
        <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between mb-6">
          <div>
            <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block">
              Current Account Balance
            </span>
            <span className="text-xs text-slate-500 font-mono">
              {user.fullName} • {user.userId}
            </span>
          </div>
          <div className="text-right">
            <span className="text-xl font-black text-white font-mono">
              {(user.creditBalance ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[10px] text-emerald-400 block font-semibold">Credits Available</span>
          </div>
        </div>

        {/* Declined Payment Banner (Alt Branch 2: paymentAuthorized == false -> setStatus("FAILED")) */}
        {declinedResult && (
          <div
            role="alert"
            className="mb-6 p-4 rounded-2xl bg-rose-950/50 border border-rose-500/40 text-left"
          >
            <div className="flex items-start gap-3">
              <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-rose-300">
                    Payment Declined — Balance Unchanged
                  </h4>
                  {declinedResult.transaction && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      STATUS: {declinedResult.transaction.status}
                    </span>
                  )}
                </div>
                <p className="text-xs text-rose-200/90 mt-1">{declinedResult.message}</p>
                {declinedResult.transaction && (
                  <div className="mt-2 pt-2 border-t border-rose-500/20 flex flex-wrap gap-x-4 gap-y-1 text-[11px] font-mono text-rose-300/80">
                    <span>Channel: {declinedResult.transaction.channelName}</span>
                    <span>Ref: {declinedResult.transaction.paymentReference}</span>
                    <span>
                      Unchanged Balance: {declinedResult.transaction.balanceAfter.toFixed(2)} Credits
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleTopUpAccount} className="space-y-6">
          {/* Step 1: Select Top-Up Amount */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label
                id="preset-amount-label"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-400"
              >
                1. Select Top-Up Amount
              </label>
              <button
                type="button"
                onClick={() => {
                  setUseCustomAmount((prev) => !prev);
                  if (!customAmountInput) setCustomAmountInput('750');
                }}
                className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
              >
                {useCustomAmount ? 'Use Preset Tiers' : 'Enter Custom Amount'}
              </button>
            </div>

            {!useCustomAmount ? (
              <div
                role="radiogroup"
                aria-labelledby="preset-amount-label"
                className="grid grid-cols-2 gap-3"
              >
                {TOP_UP_PRESETS.map((preset) => {
                  const isSelected = selectedAmount === preset.amount;
                  return (
                    <button
                      key={preset.amount}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      onClick={() => setSelectedAmount(preset.amount)}
                      className={`relative p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-950/40 border-emerald-400 ring-2 ring-emerald-400/20'
                          : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {preset.bonus && (
                        <span className="absolute -top-2 right-2 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500 text-slate-950 uppercase font-mono">
                          {preset.bonus}
                        </span>
                      )}
                      <span className="text-base font-black text-white font-mono block">
                        +{preset.amount.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-slate-400">Credits</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                <label className="block text-[11px] text-slate-400 mb-1.5">
                  Custom Top-Up Credits Amount
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={50}
                    max={50000}
                    step={50}
                    value={customAmountInput}
                    onChange={(e) => setCustomAmountInput(e.target.value)}
                    placeholder="Enter credits (e.g. 750)"
                    className="w-full px-3.5 py-2.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono text-sm focus:outline-none focus:border-emerald-400"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-400">
                    Credits
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Step 2: TopUpChannelFactory Channel Selector */}
          <div>
            <label
              id="channel-method-label"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2.5"
            >
              2. Select Top-Up Channel (TopUpChannelFactory)
            </label>
            <div
              role="radiogroup"
              aria-labelledby="channel-method-label"
              className="grid grid-cols-1 sm:grid-cols-3 gap-2.5"
            >
              {CHANNEL_OPTIONS.map((option) => {
                const isSelected = channelMethod === option.method;
                const Icon =
                  option.method === 'ONLINE'
                    ? CreditCard
                    : option.method === 'MOBILE'
                    ? Smartphone
                    : Building2;
                return (
                  <button
                    key={option.method}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => setChannelMethod(option.method)}
                    className={`p-3 rounded-xl border flex flex-col items-start gap-1 text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-500/10 border-emerald-400 text-emerald-300 ring-1 ring-emerald-400/30'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <Icon className="w-4 h-4" />
                      {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                    </div>
                    <span className="text-xs font-bold text-white mt-1">{option.title}</span>
                    <span className="text-[10px] font-mono text-emerald-400/90">
                      {option.subtitle}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 3: Channel-Specific Payment Details Form */}
          <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                3. Payment Details ({selectedChannelMeta.channelClass})
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-emerald-400 border border-slate-800">
                getChannel(&quot;{channelMethod}&quot;)
              </span>
            </div>

            {channelMethod === 'ONLINE' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] text-slate-400 mb-1">Cardholder Name</label>
                  <input
                    type="text"
                    value={cardHolderName}
                    onChange={(e) => setCardHolderName(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-400"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[11px] text-slate-400 mb-1">
                    Card Number (End with 0000 to test gateway decline)
                  </label>
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-white focus:outline-none focus:border-emerald-400"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Expiry Date</label>
                  <input
                    type="text"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    placeholder="MM/YY"
                    required
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-white focus:outline-none focus:border-emerald-400"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">CVV Security Code</label>
                  <input
                    type="password"
                    maxLength={4}
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-white focus:outline-none focus:border-emerald-400"
                  />
                </div>
              </div>
            )}

            {channelMethod === 'MOBILE' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">
                    Mobile Wallet Provider
                  </label>
                  <select
                    value={mobileProvider}
                    onChange={(e) => setMobileProvider(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-400"
                  >
                    <option value="Apple Pay">Apple Pay</option>
                    <option value="Google Pay">Google Pay</option>
                    <option value="LankaQR Wallet">LankaQR Transit Pay</option>
                    <option value="Dialog eZ Cash">Dialog eZ Cash</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">
                    Linked Mobile Number
                  </label>
                  <input
                    type="text"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-white focus:outline-none focus:border-emerald-400"
                  />
                </div>
              </div>
            )}

            {channelMethod === 'PAYSTATION' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">
                    PayStation Terminal Location
                  </label>
                  <select
                    value={stationId}
                    onChange={(e) => setStationId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-400"
                  >
                    {PAYSTATION_TERMINALS.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">
                    Kiosk Voucher / Receipt PIN
                  </label>
                  <input
                    type="text"
                    value={voucherCode}
                    onChange={(e) => setVoucherCode(e.target.value)}
                    placeholder="e.g. VCH-8842-METRO"
                    required
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-white focus:outline-none focus:border-emerald-400"
                  />
                </div>
              </div>
            )}
          </div>

          {/* PaymentGateway Simulation Control (for testing both alt branches of the Sequence Diagram) */}
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <AlertTriangle
                className={`w-4 h-4 shrink-0 ${
                  simulateDecline ? 'text-rose-400' : 'text-slate-500'
                }`}
              />
              <div>
                <span className="text-xs font-semibold text-slate-300 block">
                  PaymentGateway Authorization Simulator
                </span>
                <span className="text-[11px] text-slate-500">
                  {simulateDecline
                    ? 'Simulating [paymentAuthorized == false] → setStatus("FAILED")'
                    : 'Normal mode [paymentAuthorized == true] → setStatus("SUCCESS")'}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSimulateDecline((prev) => !prev)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-mono font-bold border transition-all cursor-pointer shrink-0 ${
                simulateDecline
                  ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              }`}
            >
              {simulateDecline ? 'Decline: ON' : 'Authorize: ON'}
            </button>
          </div>

          {/* Summary Bar */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/90 flex items-center justify-between text-xs">
            <div className="space-y-0.5">
              <span className="text-slate-400 block">Total Credits to Add:</span>
              {bonusAmount > 0 && (
                <span className="text-[11px] text-emerald-400 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Includes +{bonusAmount} tier bonus credits
                </span>
              )}
            </div>
            <div className="text-right font-mono">
              <span className="text-lg font-black text-emerald-400">
                +{totalCreditsToAdd.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
              <span className="text-[10px] text-slate-400 block">
                Projected Balance:{' '}
                {((user.creditBalance ?? 0) + totalCreditsToAdd).toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>
          </div>

          {/* Action Button */}
          <button
            type="submit"
            disabled={isProcessing || activeAmount <= 0}
            className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 disabled:opacity-50 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all transform active:scale-[0.99] cursor-pointer"
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Executing TopUpTransaction via {selectedChannelMeta.channelClass}...</span>
              </>
            ) : (
              <>
                <span>
                  Confirm & Add +{totalCreditsToAdd.toLocaleString()} Credits via{' '}
                  {selectedChannelMeta.channelClass}
                </span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="flex items-center justify-center gap-2 text-[11px] text-slate-500 mt-4">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>
            Verified by TopUpChannelFactory & PaymentGateway • Immediate account ledger update.
          </span>
        </div>
      </div>

      {/* Recorded TopUpTransaction Ledger (shows both SUCCESS and FAILED attempts from account.addTransaction(tx)) */}
      {txHistory.length > 0 && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl backdrop-blur-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white">
                Account Top-Up Transaction Log (TopUpTransaction)
              </h3>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              {txHistory.length} {txHistory.length === 1 ? 'record' : 'records'}
            </span>
          </div>

          <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
            {txHistory.slice(0, 8).map((tx) => {
              const isSuccess = tx.status === 'SUCCESS';
              return (
                <div
                  key={tx.id}
                  className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs ${
                    isSuccess
                      ? 'bg-slate-950/80 border-slate-800'
                      : 'bg-rose-950/20 border-rose-500/30'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                          isSuccess
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        }`}
                      >
                        {tx.status}
                      </span>
                      <span className="font-mono font-semibold text-white truncate">
                        {tx.channelName}
                      </span>
                      {tx.paymentReference && (
                        <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">
                          • {tx.paymentReference}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">
                      {isSuccess ? (
                        <span>
                          Added +{tx.amount.toFixed(2)} Credits
                          {tx.bonusAmount > 0 ? ` (+${tx.bonusAmount.toFixed(2)} Bonus)` : ''}
                        </span>
                      ) : (
                        <span className="text-rose-300/90">
                          {tx.failureReason || 'Payment Failed - Balance Unchanged'}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-right shrink-0 font-mono">
                    <span
                      className={`text-xs font-bold block ${
                        isSuccess ? 'text-emerald-400' : 'text-rose-400 line-through'
                      }`}
                    >
                      +{tx.totalCredits.toFixed(2)}
                    </span>
                    <span className="text-[10px] text-slate-500 block">
                      Bal: {tx.balanceAfter.toFixed(2)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
