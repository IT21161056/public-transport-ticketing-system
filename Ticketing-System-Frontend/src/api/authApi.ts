import { apiClient, extractErrorMessage } from './client';
import type { RegisteredUser } from '../types';

export interface RequestOtpPayload {
  fullName?: string;
  phoneNumber: string;
  mode?: 'register' | 'login';
}

export interface RequestOtpResult {
  success: boolean;
  message: string;
  debugOtp?: string;
  data?: {
    devOtpCode?: string;
    expiresInSeconds?: number;
    cooldownSeconds?: number;
    phoneNumber?: string;
  };
}

export interface VerifyOtpPayload {
  phoneNumber: string;
  otpCode: string;
  fullName?: string;
}

export interface AuthBackendUser {
  id: string;
  fullName: string;
  phoneNumber: string | null;
  creditBalance: number;
  persistentQrToken: string | null;
  isPhoneVerified: boolean;
}

export interface BackendAuthResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: AuthBackendUser;
}

export interface AuthVerifyResult {
  success: boolean;
  message: string;
  token?: string;
  user?: RegisteredUser;
}

export const authApi = {
  /**
   * Requests an SMS OTP from the ASP.NET Core backend API.
   */
  async requestOtp(
    payload: RequestOtpPayload
  ): Promise<RequestOtpResult> {
    try {
      const response = await apiClient.post<RequestOtpResult>('/auth/request-otp', {
        phoneNumber: payload.phoneNumber,
        fullName: payload.fullName,
      });

      const res = response.data;
      return {
        success: res.success,
        message: res.message || 'OTP sent successfully.',
        debugOtp: res.debugOtp,
        data: {
          devOtpCode: res.debugOtp,
          expiresInSeconds: 120,
          cooldownSeconds: 45,
          phoneNumber: payload.phoneNumber,
        },
      };
    } catch (error) {
      console.warn('Backend API request-otp offline or unreachable:', error);
      return {
        success: false,
        message: extractErrorMessage(error, 'Failed to request OTP from backend server.'),
      };
    }
  },

  /**
   * Verifies the OTP and logs in / registers the commuter against the backend API.
   */
  async verifyOtp(
    payload: VerifyOtpPayload
  ): Promise<AuthVerifyResult> {
    try {
      const response = await apiClient.post<BackendAuthResponse>('/auth/verify-otp', {
        phoneNumber: payload.phoneNumber,
        otpCode: payload.otpCode,
        fullName: payload.fullName,
      });

      const res = response.data;
      if (res.success && res.user) {
        if (res.token) {
          localStorage.setItem('auth_token', res.token);
        }

        const mappedUser: RegisteredUser = {
          userId: res.user.id,
          fullName: res.user.fullName,
          phoneNumber: res.user.phoneNumber || payload.phoneNumber,
          isPhoneVerified: res.user.isPhoneVerified,
          registeredAt: new Date().toISOString(),
          creditBalance: Number(res.user.creditBalance) || 0,
          persistentQrToken: res.user.persistentQrToken || '',
          accountStatus: 'active',
        };

        return {
          success: true,
          message: res.message || 'Authentication successful.',
          token: res.token,
          user: mappedUser,
        };
      }

      return {
        success: false,
        message: res.message || 'Verification failed.',
      };
    } catch (error) {
      console.warn('Backend API verify-otp failed:', error);
      return {
        success: false,
        message: extractErrorMessage(error, 'Incorrect or expired OTP. Please try again.'),
      };
    }
  },

  /**
   * Compatibility method for register.
   */
  async register(payload: {
    fullName: string;
    phoneNumber: string;
    otp: string;
  }): Promise<{ success: boolean; user?: RegisteredUser; message: string }> {
    const result = await authApi.verifyOtp({
      fullName: payload.fullName,
      phoneNumber: payload.phoneNumber,
      otpCode: payload.otp,
    });
    return {
      success: result.success,
      user: result.user,
      message: result.message,
    };
  },

  /**
   * Compatibility method for login.
   */
  async login(payload: {
    phoneNumber: string;
    otp: string;
  }): Promise<{ success: boolean; user?: RegisteredUser; message: string }> {
    const result = await authApi.verifyOtp({
      phoneNumber: payload.phoneNumber,
      otpCode: payload.otp,
    });
    return {
      success: result.success,
      user: result.user,
      message: result.message,
    };
  },

  /**
   * Retrieves logged-in commuter profile using the JWT token.
   */
  async getProfile(): Promise<{ success: boolean; user?: RegisteredUser; message: string }> {
    try {
      const response = await apiClient.get<AuthBackendUser>('/account/profile');
      const bUser = response.data;
      const mappedUser: RegisteredUser = {
        userId: bUser.id,
        fullName: bUser.fullName,
        phoneNumber: bUser.phoneNumber || '',
        isPhoneVerified: bUser.isPhoneVerified,
        registeredAt: new Date().toISOString(),
        creditBalance: Number(bUser.creditBalance) || 0,
        persistentQrToken: bUser.persistentQrToken || '',
        accountStatus: 'active',
      };
      return {
        success: true,
        user: mappedUser,
        message: 'Profile fetched successfully.',
      };
    } catch (error) {
      return {
        success: false,
        message: extractErrorMessage(error, 'Could not fetch commuter profile from backend.'),
      };
    }
  },

  /**
   * Compatibility alias for commuter fetching.
   */
  async getCommuterById(_userId: string): Promise<{ success: boolean; user?: RegisteredUser; message: string }> {
    return authApi.getProfile();
  },

  async getCommuterByPhone(_phoneNumber: string): Promise<{ success: boolean; user?: RegisteredUser; message: string }> {
    return authApi.getProfile();
  },
};

// Convenience export aliases
export const requestOtpApi = (fullName: string, phoneNumber: string, mode: 'register' | 'login') =>
  authApi.requestOtp({ fullName, phoneNumber, mode });

export const registerLocalUserApi = (fullName: string, phoneNumber: string, otp: string) =>
  authApi.register({ fullName, phoneNumber, otp });

export const loginWithOtpApi = (phoneNumber: string, otp: string) =>
  authApi.login({ phoneNumber, otp });

export const fetchCommuterProfileApi = (userId: string) =>
  authApi.getCommuterById(userId);

export default authApi;
