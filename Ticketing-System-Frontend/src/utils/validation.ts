/**
 * Validation utilities for forms, authentication, and commuter data.
 */

/**
 * Validates whether the given full name is valid (at least 2 letters, letters/spaces/hyphens).
 */
export function isValidFullName(name: string): boolean {
  if (!name || name.trim().length < 2) return false;
  return /^[\p{L}\s'-]+$/u.test(name.trim());
}

/**
 * Validates international or local telephone number formats.
 * Accepts numbers with optional leading +, 9 to 15 digits.
 */
export function isValidPhoneNumber(phone: string): boolean {
  if (!phone) return false;
  const cleaned = phone.replace(/[\s\-()]/g, '');
  return /^\+?[0-9]{9,15}$/.test(cleaned);
}

/**
 * Formats a raw phone number into a cleaner display format.
 */
export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/[^\d+]/g, '');
  return cleaned;
}

/**
 * Validates a 6-digit SMS OTP code.
 */
export function isValidOtp(otp: string): boolean {
  return /^[0-9]{6}$/.test(otp.trim());
}

/**
 * Validates standard email address format.
 */
export function isValidEmail(email: string): boolean {
  if (!email) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/**
 * Validates password strength (min 6 chars).
 */
export function isValidPassword(password: string): boolean {
  return typeof password === 'string' && password.length >= 6;
}

/**
 * Validates credit top-up amount (must be positive number).
 */
export function isValidCreditAmount(amount: number): boolean {
  return !isNaN(amount) && amount > 0 && amount <= 50000;
}
