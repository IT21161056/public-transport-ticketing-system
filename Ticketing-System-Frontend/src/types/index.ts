export type AccessDurationDays = 1 | 2 | 3 | 7;

export interface AccessDurationOption {
  days: AccessDurationDays;
  label: string;
  hours: number;
  price: number;
  popular?: boolean;
  bestValue?: boolean;
  description: string;
}

export interface CreditTransaction {
  id: string;
  type: 'topup' | 'fare_deduction';
  amount: number;
  description: string;
  timestamp: string;
  balanceAfter: number;
}

export interface RegisteredUser {
  userId: string; // e.g. USR-78214
  fullName: string;
  phoneNumber: string;
  isPhoneVerified: boolean;
  registeredAt: string;
  creditBalance: number; // e.g. 1250.00 credits
  persistentQrToken: string; // persistent credential e.g. LCL-QR-78214-XXXX
  accountStatus: 'active' | 'suspended';
}

export interface GuestSession {
  guestId: string; // e.g. GST-8921-A3
  deviceId: string; // anonymous browser device identifier
  createdAt: string;
  expiresAt: string;
}

export type GuestTokenStatus = 'active' | 'expired' | 'revoked' | 'pending';

export interface GuestTransportToken {
  tokenId: string; // e.g. TRP-TK-87B194E38A
  guestId: string;
  orderId: string;
  days: AccessDurationDays;
  durationLabel: string;
  price: number;
  issuedAt: string;
  startsAt: string;
  expiresAt: string;
  status: GuestTokenStatus;
  lastScannedAt?: string;
  scanCount: number;
  signedToken?: string;
}

export type PaymentMethod = 'card' | 'apple_pay' | 'google_pay' | 'transit_wallet';

export type PaymentState = 'idle' | 'pending' | 'successful' | 'failed' | 'cancelled';

export type AppRoute = 
  | 'home'
  | 'landing'
  | 'register'
  | 'login'
  | 'dashboard'
  | 'verify-phone'
  | 'profile'
  | 'account-credits' // /account/credits: Local user top up
  | 'account-qr'      // /account/qr: Local user persistent QR
  | 'guest'           // /guest
  | 'guest-period'    // /guest/access-period
  | 'guest-checkout'  // /guest/checkout
  | 'guest-payment'   // /guest/payment
  | 'guest-qr'        // /guest/qr
  | 'scanner';        // /access/status: Turnstile simulator

// ==========================================
// Vehicle & Transit Network Types
// ==========================================

export type VehicleType = 'metro' | 'bus' | 'tram' | 'ferry';

export interface VehicleDto {
  id: string;
  vehicleCode: string; // e.g. MET-204, BUS-409
  type: VehicleType;
  line: string; // e.g. "Red Line M1", "Express Line 102"
  currentStation: string;
  nextStation: string;
  status: 'on_schedule' | 'delayed' | 'maintenance';
  occupancyPercentage: number;
  updatedAt: string;
}

export interface TransitLine {
  id: string;
  name: string;
  code: string;
  type: VehicleType;
  color: string;
  status: 'normal' | 'disrupted' | 'maintenance';
  stationsCount: number;
}

// ==========================================
// User Administration & Auth DTOs
// ==========================================

export type UserRole = 1 | 2 | 3; // 1: Admin, 2: Operator, 3: Commuter

export interface UserDto {
  id: string;
  userName: string;
  email: string;
  fullName: string;
  phoneNumber?: string;
  role: UserRole;
  roleName: string;
  isActive: boolean;
  createdAtUtc: string;
  updatedAtUtc?: string;
  lastLoginAtUtc?: string;
}

export interface UserQueryParameters {
  searchTerm?: string;
  role?: UserRole;
  isActive?: boolean;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDescending?: boolean;
}

export interface PagedResult<T> {
  items: T[];
  pageIndex: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface CreateUserRequest {
  userName: string;
  email: string;
  password?: string;
  fullName: string;
  phoneNumber?: string;
  role: UserRole;
}

export interface UpdateUserRequest {
  email: string;
  fullName: string;
  phoneNumber?: string;
  role: UserRole;
}

export interface ChangePasswordRequest {
  currentPassword?: string;
  newPassword?: string;
}
