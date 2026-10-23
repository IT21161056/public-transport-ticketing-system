import type { AppRoute, RegisteredUser } from './types';

/**
 * Single source of truth mapping the logical AppRoute names used across
 * components (via `onNavigate`) to real URL paths handled by React Router.
 */
export const ROUTE_PATHS: Record<AppRoute, string> = {
  home: '/',
  landing: '/',
  login: '/login',
  register: '/register',
  'verify-phone': '/verify',
  dashboard: '/dashboard',
  profile: '/profile',
  'account-credits': '/account/credits',
  'account-qr': '/account/qr',
  guest: '/guest',
  'guest-period': '/guest/period',
  'guest-checkout': '/guest/checkout',
  'guest-payment': '/guest/payment',
  'guest-qr': '/guest/qr',
};

/**
 * Resolves a URL pathname back to its logical AppRoute (used by Navbar highlighting
 * and the guest-flow stepper).
 */
export function pathToRoute(pathname: string): AppRoute {
  const normalized = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
  const match = (Object.keys(ROUTE_PATHS) as AppRoute[]).find(
    (key) => key !== 'landing' && ROUTE_PATHS[key] === normalized
  );
  return match ?? 'home';
}

/** Admin flow lives under its own router tree, separate from commuter routes. */
export const ADMIN_PATHS = {
  login: '/admin/login',
  home: '/admin',
} as const;

export function homePathFor(_user: RegisteredUser | null | undefined): string {
  return ROUTE_PATHS.dashboard;
}
