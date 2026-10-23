import { apiClient, extractErrorMessage } from './client';

export type TopUpChannelMethod = 'ONLINE' | 'MOBILE' | 'PAYSTATION';

export interface TopUpTransactionRecord {
  id: string;
  amount: number;
  bonusAmount: number;
  totalCredits: number;
  method: TopUpChannelMethod | string;
  channelName: string;
  status: 'SUCCESS' | 'FAILED' | 'PENDING' | string;
  paymentReference?: string | null;
  failureReason?: string | null;
  balanceAfter: number;
  createdAtUtc: string;
}

export const accountApi = {
  /**
   * Fetches the commuter's top-up transaction ledger.
   */
  async getTopUpHistory(
    userId?: string
  ): Promise<{ success: boolean; data: TopUpTransactionRecord[]; message: string }> {
    try {
      const query = userId ? `?userId=${encodeURIComponent(userId)}` : '';
      const response = await apiClient.get<TopUpTransactionRecord[]>(`/account/topup-history${query}`);
      const list = Array.isArray(response.data) ? response.data : [];
      return {
        success: true,
        data: list,
        message: 'Top-up history fetched successfully.',
      };
    } catch (error) {
      return {
        success: false,
        data: [],
        message: extractErrorMessage(error, 'Failed to fetch top-up history.'),
      };
    }
  },
};

export default accountApi;
