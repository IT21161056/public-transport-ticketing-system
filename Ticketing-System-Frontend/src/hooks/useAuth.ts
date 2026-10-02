import { useState, useCallback, useEffect } from 'react';
import type { RegisteredUser } from '../types';
import { getSavedUser, saveUser, clearUser } from '../utils/storage';
import { authApi } from '../api/authApi';

export interface OtpSessionState {
  fullName: string;
  phoneNumber: string;
  code: string;
  mode: 'register' | 'login';
}

export function useAuth() {
  const [user, setUser] = useState<RegisteredUser | null>(() => getSavedUser());
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [otpData, setOtpData] = useState<OtpSessionState | null>(null);
  const [toastCode, setToastCode] = useState<string | null>(null);

  // Sync profile from backend if auth token exists
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      authApi.getProfile().then((res) => {
        if (res.success && res.user) {
          saveUser(res.user);
          setUser(res.user);
        }
      }).catch(() => {
        // Fall back to saved local user
      });
    }
  }, []);

  /**
   * Requests an OTP code from the backend API.
   */
  const requestOtp = useCallback(async (
    fullName: string,
    phoneNumber: string,
    mode: 'register' | 'login'
  ) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authApi.requestOtp({ fullName, phoneNumber, mode });
      const devCode =
        response.debugOtp ||
        response.data?.devOtpCode ||
        Math.floor(100000 + Math.random() * 900000).toString();

      setOtpData({
        fullName,
        phoneNumber,
        code: devCode,
        mode,
      });

      // Show simulated SMS toast notification
      setToastCode(devCode);

      return {
        success: response.success,
        code: devCode,
        message: response.message,
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to request OTP';
      setError(msg);
      return { success: false, message: msg };
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Verifies the OTP code against the backend API and authenticates the user.
   */
  const verifyOtp = useCallback(async (enteredOtp: string) => {
    if (!otpData) {
      return { success: false, message: 'No active OTP verification session found' };
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await authApi.verifyOtp({
        phoneNumber: otpData.phoneNumber,
        otpCode: enteredOtp,
        fullName: otpData.fullName,
      });

      if (result.success && result.user) {
        saveUser(result.user);
        setUser(result.user);
        setOtpData(null);
        setToastCode(null);
        return { success: true, user: result.user, message: result.message };
      }

      const failMsg = result.message || 'Incorrect verification code. Please try again.';
      setError(failMsg);
      return { success: false, message: failMsg };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'OTP verification failed';
      setError(msg);
      return { success: false, message: msg };
    } finally {
      setIsLoading(false);
    }
  }, [otpData]);

  /**
   * Clears session and logs out user.
   */
  const logout = useCallback(() => {
    clearUser();
    setUser(null);
    setOtpData(null);
    setToastCode(null);
    localStorage.removeItem('auth_token');
  }, []);

  /**
   * Refreshes user profile from backend.
   */
  const refreshProfile = useCallback(async () => {
    if (!user) return;
    try {
      const res = await authApi.getProfile();
      if (res.success && res.user) {
        saveUser(res.user);
        setUser(res.user);
      }
    } catch {
      // Keep existing user on failure
    }
  }, [user]);

  /**
   * Updates user balance in local state and persistence.
   */
  const updateUserState = useCallback((updated: RegisteredUser) => {
    saveUser(updated);
    setUser(updated);
  }, []);

  return {
    user,
    isAuthenticated: !!user,
    isLoading,
    error,
    otpData,
    toastCode,
    setToastCode,
    requestOtp,
    verifyOtp,
    logout,
    refreshProfile,
    updateUserState,
  };
}

export default useAuth;
