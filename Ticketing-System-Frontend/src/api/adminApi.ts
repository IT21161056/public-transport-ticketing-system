import { apiClient, extractErrorMessage, ADMIN_TOKEN_KEY, ADMIN_USER_KEY } from './client';
import type { 
  AdminDashboardStats, 
  AdminUserItem, 
  AdminJourneyItem, 
  AdminGuestPassItem, 
  RegisteredUser 
} from '../types';

export interface AdminLoginResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: RegisteredUser;
}

export const adminSession = {
  getUser(): RegisteredUser | null {
    if (!localStorage.getItem(ADMIN_TOKEN_KEY)) return null;
    try {
      const raw = localStorage.getItem(ADMIN_USER_KEY);
      return raw ? (JSON.parse(raw) as RegisteredUser) : null;
    } catch {
      return null;
    }
  },
  save(token: string, user: RegisteredUser) {
    localStorage.setItem(ADMIN_TOKEN_KEY, token);
    localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(user));
  },
  clear() {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    localStorage.removeItem(ADMIN_USER_KEY);
  },
};

export const adminApi = {
  /**
   * Authenticates administrator using Username/Email and password.
   */
  async login(usernameOrEmail: string, password: string): Promise<AdminLoginResponse> {
    try {
      const response = await apiClient.post<any>('/auth/admin-login', {
        usernameOrEmail,
        password,
      });

      const res = response.data;
      if (res.success && res.token && res.user) {
        const mappedUser: RegisteredUser = {
          userId: res.user.id,
          fullName: res.user.fullName,
          phoneNumber: res.user.phoneNumber || '',
          isPhoneVerified: res.user.isPhoneVerified,
          registeredAt: new Date().toISOString(),
          creditBalance: Number(res.user.creditBalance) || 0,
          persistentQrToken: res.user.persistentQrToken || '',
          accountStatus: 'active',
          role: res.user.role ?? 2,
          email: res.user.email,
          userName: res.user.userName,
        };

        adminSession.save(res.token, mappedUser);

        return {
          success: true,
          message: res.message || 'Administrator login successful.',
          token: res.token,
          user: mappedUser,
        };
      }

      return {
        success: false,
        message: res.message || 'Administrator login failed.',
      };
    } catch (error) {
      return {
        success: false,
        message: extractErrorMessage(error, 'Invalid administrator credentials.'),
      };
    }
  },

  /**
   * Fetches high-level operational statistics for the transit network.
   */
  async getDashboardStats(): Promise<{ success: boolean; stats?: AdminDashboardStats; message: string }> {
    try {
      const response = await apiClient.get<AdminDashboardStats>('/admin/stats');
      return {
        success: true,
        stats: response.data,
        message: 'Stats retrieved successfully.',
      };
    } catch (error) {
      return {
        success: false,
        message: extractErrorMessage(error, 'Failed to fetch dashboard statistics.'),
      };
    }
  },

  /**
   * Fetches users/commuters list with optional search and filters.
   */
  async getUsers(search?: string, role?: number, isActive?: boolean): Promise<{ success: boolean; users: AdminUserItem[]; message: string }> {
    try {
      const params: Record<string, unknown> = {};
      if (search) params.search = search;
      if (role !== undefined) params.role = role;
      if (isActive !== undefined) params.isActive = isActive;

      const response = await apiClient.get<AdminUserItem[]>('/admin/users', { params });
      return {
        success: true,
        users: response.data || [],
        message: 'Users retrieved successfully.',
      };
    } catch (error) {
      return {
        success: false,
        users: [],
        message: extractErrorMessage(error, 'Failed to fetch users.'),
      };
    }
  },

  /**
   * Activates or suspends a commuter account.
   */
  async updateUserStatus(userId: string, isActive: boolean): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiClient.put<any>(`/admin/users/${userId}/status`, { isActive });
      return {
        success: response.data?.success ?? true,
        message: response.data?.message || `User account status updated.`,
      };
    } catch (error) {
      return {
        success: false,
        message: extractErrorMessage(error, 'Failed to update account status.'),
      };
    }
  },

  /**
   * Adjusts credit balance on a commuter's transit wallet.
   */
  async adjustUserBalance(userId: string, amount: number, reason: string): Promise<{ success: boolean; newBalance?: number; message: string }> {
    try {
      const response = await apiClient.post<any>(`/admin/users/${userId}/balance`, { amount, reason });
      return {
        success: response.data?.success ?? true,
        newBalance: response.data?.newBalance,
        message: response.data?.message || 'Balance adjusted successfully.',
      };
    } catch (error) {
      return {
        success: false,
        message: extractErrorMessage(error, 'Failed to adjust credit balance.'),
      };
    }
  },

  /**
   * Fetches recent transit network journeys and gate tap events.
   */
  async getJourneys(limit = 50): Promise<{ success: boolean; journeys: AdminJourneyItem[]; message: string }> {
    try {
      const response = await apiClient.get<AdminJourneyItem[]>('/admin/journeys', { params: { limit } });
      return {
        success: true,
        journeys: response.data || [],
        message: 'Journeys retrieved successfully.',
      };
    } catch (error) {
      return {
        success: false,
        journeys: [],
        message: extractErrorMessage(error, 'Failed to fetch journeys.'),
      };
    }
  },

  /**
   * Fetches all issued guest passes across the transit system.
   */
  async getGuestPasses(limit = 50): Promise<{ success: boolean; passes: AdminGuestPassItem[]; message: string }> {
    try {
      const response = await apiClient.get<AdminGuestPassItem[]>('/admin/guest-passes', { params: { limit } });
      return {
        success: true,
        passes: response.data || [],
        message: 'Guest passes retrieved successfully.',
      };
    } catch (error) {
      return {
        success: false,
        passes: [],
        message: extractErrorMessage(error, 'Failed to fetch guest passes.'),
      };
    }
  },
};

export default adminApi;
