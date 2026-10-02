import type { 
  AccessDurationOption, 
  GuestSession, 
  RegisteredUser, 
  GuestTransportToken, 
  CreditTransaction,
  AccessDurationDays 
} from '../types';
import { getOrCreateDeviceUuid } from './deviceUuid';

export const STANDARD_RIDE_FARE = 150.00; // in credits (or $2.50)

export const DURATION_OPTIONS: AccessDurationOption[] = [
  {
    days: 1,
    label: '1 Day',
    hours: 24,
    price: 4.50,
    description: '24 hours unlimited access across all metro, bus & tram networks',
  },
  {
    days: 2,
    label: '2 Days',
    hours: 48,
    price: 8.00,
    description: '48 hours access. Perfect for weekend getaways & short stays',
  },
  {
    days: 3,
    label: '3 Days',
    hours: 72,
    price: 11.50,
    popular: true,
    description: '72 hours access. Ideal for tourist visits and regional exploration',
  },
  {
    days: 7,
    label: '7 Days',
    hours: 168,
    price: 22.00,
    bestValue: true,
    description: '1 full week access. Best value for extended city stays',
  },
];

export const TOP_UP_PRESETS = [
  { amount: 500, label: '500.00 Credits', bonus: '' },
  { amount: 1000, label: '1,000.00 Credits', bonus: '+50 Bonus' },
  { amount: 2000, label: '2,000.00 Credits', popular: true, bonus: '+150 Bonus' },
  { amount: 5000, label: '5,000.00 Credits', bestValue: true, bonus: '+500 Bonus' },
];

const STORAGE_KEYS = {
  USER: 'urban_transit_user',
  GUEST: 'urban_transit_guest',
  GUEST_TOKENS: 'urban_transit_guest_tokens',
  TRANSACTIONS: 'urban_transit_transactions',
  DEVICE_ID: 'urban_transit_device_id',
};

// Generates or retrieves anonymous device identifier
export function getOrCreateDeviceId(): string {
  return getOrCreateDeviceUuid();
}

// Guest Session Management
export function getOrCreateGuestSession(): GuestSession {
  const existing = localStorage.getItem(STORAGE_KEYS.GUEST);
  if (existing) {
    try {
      const parsed: GuestSession = JSON.parse(existing);
      if (new Date(parsed.expiresAt).getTime() > Date.now()) {
        return parsed;
      }
    } catch {
      // Fallback
    }
  }

  const deviceId = getOrCreateDeviceId();
  const guestHex = Math.random().toString(36).substring(2, 6).toUpperCase();
  const now = new Date();
  const expires = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const newGuest: GuestSession = {
    guestId: `GST-${guestHex}-${Math.floor(1000 + Math.random() * 9000)}`,
    deviceId,
    createdAt: now.toISOString(),
    expiresAt: expires.toISOString(),
  };

  localStorage.setItem(STORAGE_KEYS.GUEST, JSON.stringify(newGuest));
  return newGuest;
}

// Registered User Management
export function getSavedUser(): RegisteredUser | null {
  const data = localStorage.getItem(STORAGE_KEYS.USER);
  if (!data) return null;
  try {
    const user: RegisteredUser = JSON.parse(data);
    let changed = false;
    if (user.creditBalance === undefined || user.creditBalance === null || isNaN(user.creditBalance)) {
      user.creditBalance = 1250.00;
      changed = true;
    }
    if (!user.persistentQrToken) {
      user.persistentQrToken = `LCL-QR-${user.userId || 'USR-TMP'}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      changed = true;
    }
    if (!user.accountStatus) {
      user.accountStatus = 'active';
      changed = true;
    }
    if (changed) {
      saveUser(user);
    }
    return user;
  } catch {
    return null;
  }
}

export function saveUser(user: RegisteredUser): void {
  localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
}

export function clearUser(): void {
  localStorage.removeItem(STORAGE_KEYS.USER);
}

// Credit Transactions Management
export function getTransactions(): CreditTransaction[] {
  const data = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export function addTransaction(
  type: 'topup' | 'fare_deduction',
  amount: number,
  description: string,
  balanceAfter: number
): CreditTransaction {
  const transactions = getTransactions();
  const tx: CreditTransaction = {
    id: `TXN-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`,
    type,
    amount,
    description,
    timestamp: new Date().toISOString(),
    balanceAfter,
  };
  localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify([tx, ...transactions]));
  return tx;
}

// Top Up Credits for Local Registered User
export function topUpUserCredits(amount: number): RegisteredUser | null {
  const user = getSavedUser();
  if (!user) return null;

  const newBalance = user.creditBalance + amount;
  const updatedUser: RegisteredUser = {
    ...user,
    creditBalance: newBalance,
  };

  saveUser(updatedUser);
  addTransaction('topup', amount, `Account Credit Top-up (+${amount.toFixed(2)})`, newBalance);
  return updatedUser;
}

// Deduct fare for local user upon turnstile tap
export function processTurnstileTapForLocalUser(): {
  success: boolean;
  message: string;
  user?: RegisteredUser;
} {
  const user = getSavedUser();
  if (!user) {
    return { success: false, message: 'Account not found.' };
  }

  if (user.accountStatus !== 'active') {
    return { success: false, message: 'Account is currently suspended.' };
  }

  if (user.creditBalance < STANDARD_RIDE_FARE) {
    return {
      success: false,
      message: `Insufficient credits. Current balance: ${user.creditBalance.toFixed(2)} Credits. Top-up required (Ride fare: ${STANDARD_RIDE_FARE.toFixed(2)}).`,
    };
  }

  const newBalance = user.creditBalance - STANDARD_RIDE_FARE;
  const updatedUser: RegisteredUser = {
    ...user,
    creditBalance: newBalance,
  };

  saveUser(updatedUser);
  addTransaction(
    'fare_deduction',
    STANDARD_RIDE_FARE,
    `Metro Turnstile Ride Fare (-${STANDARD_RIDE_FARE.toFixed(2)})`,
    newBalance
  );

  return {
    success: true,
    message: `Access granted! Deducted ${STANDARD_RIDE_FARE.toFixed(2)} credits. Remaining balance: ${newBalance.toFixed(2)} credits.`,
    user: updatedUser,
  };
}

// Guest Tokens Management
export function getGuestTokens(): GuestTransportToken[] {
  const data = localStorage.getItem(STORAGE_KEYS.GUEST_TOKENS);
  if (!data) return [];
  try {
    const list: GuestTransportToken[] = JSON.parse(data);
    const now = Date.now();
    return list.map((token) => {
      if (new Date(token.expiresAt).getTime() < now && token.status === 'active') {
        return { ...token, status: 'expired' };
      }
      return token;
    });
  } catch {
    return [];
  }
}

export function saveGuestToken(token: GuestTransportToken): void {
  const tokens = getGuestTokens();
  const filtered = tokens.filter((t) => t.tokenId !== token.tokenId);
  localStorage.setItem(STORAGE_KEYS.GUEST_TOKENS, JSON.stringify([token, ...filtered]));
}

export function generateGuestTokenId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let token = 'TRP-TK-';
  for (let i = 0; i < 10; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

export function issueGuestToken(
  guestId: string,
  days: AccessDurationDays,
  signedToken?: string
): GuestTransportToken {
  const option = DURATION_OPTIONS.find((o) => o.days === days) || DURATION_OPTIONS[0];
  const now = new Date();
  const expires = new Date(now.getTime() + option.hours * 60 * 60 * 1000);

  const guestToken: GuestTransportToken = {
    tokenId: signedToken || generateGuestTokenId(),
    guestId,
    orderId: `ORD-GST-${Date.now().toString(36).toUpperCase()}`,
    days,
    durationLabel: option.label,
    price: option.price,
    issuedAt: now.toISOString(),
    startsAt: now.toISOString(),
    expiresAt: expires.toISOString(),
    status: 'active',
    scanCount: 0,
    signedToken,
  };

  saveGuestToken(guestToken);
  return guestToken;
}

// Unified Turnstile Gate Scanner Verification
export interface TurnstileScanResult {
  status: 'valid' | 'expired' | 'insufficient_credits' | 'invalid' | 'suspended';
  type: 'local_commuter' | 'guest_token';
  title: string;
  message: string;
  fareDeducted?: number;
  newBalance?: number;
  guestToken?: GuestTransportToken;
  localUser?: RegisteredUser;
}

export function verifyTurnstileCredential(tokenStr: string): TurnstileScanResult {
  const clean = tokenStr.trim();
  const user = getSavedUser();

  // 1. Check if token belongs to Registered Local User
  if (user && (clean === user.persistentQrToken || clean === user.userId)) {
    if (user.accountStatus !== 'active') {
      return {
        status: 'suspended',
        type: 'local_commuter',
        title: 'ACCOUNT SUSPENDED',
        message: 'This commuter account is currently inactive. Please contact support.',
        localUser: user,
      };
    }

    if (user.creditBalance < STANDARD_RIDE_FARE) {
      return {
        status: 'insufficient_credits',
        type: 'local_commuter',
        title: 'TOP-UP REQUIRED',
        message: `Insufficient credit balance (${user.creditBalance.toFixed(2)} Credits). Fare is ${STANDARD_RIDE_FARE.toFixed(2)} Credits. Please top up your account.`,
        localUser: user,
      };
    }

    // Deduct fare & grant access
    const tapResult = processTurnstileTapForLocalUser();
    return {
      status: 'valid',
      type: 'local_commuter',
      title: 'ACCESS GRANTED (TURNSTILE UNLOCKED)',
      message: `Welcome aboard, ${user.fullName}! Ride fare of ${STANDARD_RIDE_FARE.toFixed(2)} credits deducted.`,
      fareDeducted: STANDARD_RIDE_FARE,
      newBalance: tapResult.user?.creditBalance,
      localUser: tapResult.user,
    };
  }

  // 2. Check if token is a Guest Transport Token
  const tokens = getGuestTokens();
  const guestToken = tokens.find((t) => t.tokenId.toUpperCase() === clean.toUpperCase());

  if (guestToken) {
    const now = Date.now();
    const expires = new Date(guestToken.expiresAt).getTime();

    if (expires < now || guestToken.status === 'expired') {
      return {
        status: 'expired',
        type: 'guest_token',
        title: 'GUEST PASS EXPIRED',
        message: `This temporary visitor pass expired on ${new Date(guestToken.expiresAt).toLocaleString()}.`,
        guestToken,
      };
    }

    if (guestToken.status === 'revoked') {
      return {
        status: 'invalid',
        type: 'guest_token',
        title: 'PASS REVOKED',
        message: 'This guest token has been revoked by transit authority.',
        guestToken,
      };
    }

    // Update scan event
    const updatedToken: GuestTransportToken = {
      ...guestToken,
      scanCount: guestToken.scanCount + 1,
      lastScannedAt: new Date().toISOString(),
    };
    saveGuestToken(updatedToken);

    return {
      status: 'valid',
      type: 'guest_token',
      title: 'ACCESS GRANTED (GUEST PASS)',
      message: `Valid ${guestToken.durationLabel} Visitor Pass. Tap #${updatedToken.scanCount} recorded. Safe travels!`,
      guestToken: updatedToken,
    };
  }

  return {
    status: 'invalid',
    type: 'guest_token',
    title: 'INVALID CREDENTIAL',
    message: 'No active local commuter account or guest transport token matches this QR code.',
  };
}
