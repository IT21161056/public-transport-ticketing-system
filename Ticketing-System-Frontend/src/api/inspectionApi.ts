import axios from 'axios';
import { API_BASE_URL, ADMIN_TOKEN_KEY, extractErrorMessage } from './client';
import type { InspectionResponse } from '../types/inspection';

/**
 * Inspectors sign in through the admin login, so inspection calls carry the admin session token.
 * A dedicated instance is used because the shared apiClient attaches the admin token only to /admin URLs.
 */
const inspectionClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

inspectionClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(ADMIN_TOKEN_KEY);
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const inspectionApi = {
  /**
   * Sends a scanned QR payload to the inspector reader endpoint and returns the recorded inspection.
   */
  async scanTicket(qrPayload: string, location?: string): Promise<{ success: boolean; data?: InspectionResponse; message: string }> {
    try {
      const response = await inspectionClient.post<InspectionResponse>('/inspection/scan', {
        qrPayload,
        location: location || null,
      });
      return { success: true, data: response.data, message: response.data.message };
    } catch (error) {
      return { success: false, message: extractErrorMessage(error, 'Ticket inspection failed. Please try again.') };
    }
  },
};
