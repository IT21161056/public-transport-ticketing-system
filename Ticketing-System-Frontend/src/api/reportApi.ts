import axios from 'axios';
import { API_BASE_URL, ADMIN_TOKEN_KEY, extractErrorMessage } from './client';
import type { FareEvasionReport, RevenueReport, RidershipReport } from '../types/report';

/**
 * Managers sign in through the admin login, so report calls carry the admin session token.
 * A dedicated instance is used because the shared apiClient attaches the admin token only to /admin URLs.
 */
const reportClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

reportClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(ADMIN_TOKEN_KEY);
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

type ReportResult<T> = { success: boolean; data?: T; message: string };

/** Dates are yyyy-MM-dd in the city's local time; leaving both out returns the last 30 days. */
async function getReport<T>(path: string, from?: string, to?: string): Promise<ReportResult<T>> {
  try {
    const response = await reportClient.get<T>(`/report/${path}`, {
      params: { from: from || undefined, to: to || undefined },
    });
    return { success: true, data: response.data, message: 'OK' };
  } catch (error) {
    return { success: false, message: extractErrorMessage(error, 'Could not load the report. Please try again.') };
  }
}

export const reportApi = {
  getRidership: (from?: string, to?: string) => getReport<RidershipReport>('ridership', from, to),
  getRevenue: (from?: string, to?: string) => getReport<RevenueReport>('revenue', from, to),
  getFareEvasion: (from?: string, to?: string) => getReport<FareEvasionReport>('fare-evasion', from, to),
};
