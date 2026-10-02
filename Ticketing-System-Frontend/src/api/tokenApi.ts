import { apiClient, extractErrorMessage } from './client';

export interface GenerateTokenResponse {
  token: string;
  tokenType: 'LocalUser' | 'GuestPass';
  expiresAtUtc: string | null;
  nonce: string;
  qrPayload: string;
}

export interface GuestPassDto {
  id: string;
  deviceUuid: string;
  passTier: string;
  signedToken: string;
  expiresAtUtc: string;
  isActive: boolean;
}

export interface ScanValidationResult {
  isValid: boolean;
  message: string;
  tokenType: string;
  holderIdentifier: string;
  remainingBalance?: number | null;
}

export const tokenApi = {
  /**
   * Generates or retrieves signed token for either an authenticated Local User
   * or a Guest User identified by deviceUuid.
   */
  async generateToken(deviceUuid?: string, passTier?: string): Promise<{ success: boolean; data?: GenerateTokenResponse; message: string }> {
    try {
      const response = await apiClient.get<GenerateTokenResponse>('/token/generate', {
        params: {
          deviceUuid,
          passTier,
        },
      });
      return {
        success: true,
        data: response.data,
        message: 'Token generated successfully.',
      };
    } catch (error) {
      return {
        success: false,
        message: extractErrorMessage(error, 'Failed to generate signed token from backend.'),
      };
    }
  },

  /**
   * Purchases and issues a cryptographically signed Guest Pass for a specific device UUID.
   */
  async purchaseGuestPass(deviceUuid: string, passTier: string, amount: number): Promise<{ success: boolean; data?: GenerateTokenResponse; message: string }> {
    try {
      const response = await apiClient.post<GenerateTokenResponse>('/token/guest-pass', {
        deviceUuid,
        passTier,
        amount,
      });
      return {
        success: true,
        data: response.data,
        message: 'Guest pass issued successfully.',
      };
    } catch (error) {
      return {
        success: false,
        message: extractErrorMessage(error, 'Failed to issue guest pass.'),
      };
    }
  },

  /**
   * Retrieves active guest pass for a given device UUID.
   */
  async getActiveGuestPass(deviceUuid: string): Promise<{ success: boolean; data?: GuestPassDto; message: string }> {
    try {
      const response = await apiClient.get<GuestPassDto>(`/token/guest-pass/${encodeURIComponent(deviceUuid)}`);
      return {
        success: true,
        data: response.data,
        message: 'Active pass retrieved.',
      };
    } catch (error) {
      return {
        success: false,
        message: extractErrorMessage(error, 'No active guest pass found for device.'),
      };
    }
  },

  /**
   * Validates a scanned QR payload (cryptographic HMAC-SHA256 signature and expiry).
   */
  async validateToken(qrPayload: string): Promise<ScanValidationResult> {
    try {
      const response = await apiClient.post<ScanValidationResult>('/token/validate', qrPayload, {
        headers: { 'Content-Type': 'application/json' },
      });
      return response.data;
    } catch (error) {
      return {
        isValid: false,
        message: extractErrorMessage(error, 'Invalid or expired token payload.'),
        tokenType: 'Unknown',
        holderIdentifier: '',
      };
    }
  },
};

export default tokenApi;
