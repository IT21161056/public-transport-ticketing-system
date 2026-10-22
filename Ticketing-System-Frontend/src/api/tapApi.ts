import axios from 'axios';
import { API_BASE_URL, ADMIN_TOKEN_KEY, extractErrorMessage } from './client';
import type { TapResponse, TransitNetwork } from '../types/tap';

/**
 * The boarding reader simulator runs in the operations console, so its calls carry the admin session token.
 * A dedicated instance is used because the shared apiClient attaches the admin token only to /admin URLs.
 */
const readerClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

readerClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(ADMIN_TOKEN_KEY);
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const tapApi = {
  /**
   * Routes, stops and buses for setting up the reader, with the fare policy in force.
   */
  async getNetwork(): Promise<{ success: boolean; data?: TransitNetwork; message: string }> {
    try {
      const response = await readerClient.get<TransitNetwork>('/tap/network');
      return { success: true, data: response.data, message: 'Network loaded.' };
    } catch (error) {
      return { success: false, message: extractErrorMessage(error, 'Could not load routes and buses.') };
    }
  },

  /**
   * Sends a tapped QR ticket to the reader endpoint. The backend decides Tap In or Tap Out.
   */
  async tap(qrPayload: string, busId: string, stopId: string): Promise<{ success: boolean; data?: TapResponse; message: string }> {
    try {
      const response = await readerClient.post<TapResponse>('/tap', { qrPayload, busId, stopId });
      return { success: true, data: response.data, message: response.data.message };
    } catch (error) {
      return { success: false, message: extractErrorMessage(error, 'The reader could not process this tap.') };
    }
  },
};
