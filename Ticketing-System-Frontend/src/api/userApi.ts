import { apiClient, extractErrorMessage, type ApiResponse } from './client';
import type {
  UserDto,
  UserQueryParameters,
  PagedResult,
  CreateUserRequest,
  UpdateUserRequest,
  ChangePasswordRequest,
} from '../types';

export const userApi = {
  /**
   * Fetches a paginated, sorted, and filtered list of system users.
   */
  async getUsers(
    params?: UserQueryParameters
  ): Promise<{ success: boolean; data?: PagedResult<UserDto>; message: string }> {
    try {
      const response = await apiClient.get<ApiResponse<PagedResult<UserDto>>>('/users', {
        params,
      });
      const json = response.data;
      return {
        success: json.isSuccess,
        data: json.data,
        message: json.message,
      };
    } catch (error) {
      return {
        success: false,
        message: extractErrorMessage(error, 'Failed to fetch users.'),
      };
    }
  },

  /**
   * Fetches a single system user by identifier.
   */
  async getUserById(
    id: string
  ): Promise<{ success: boolean; user?: UserDto; message: string }> {
    try {
      const response = await apiClient.get<ApiResponse<UserDto>>(`/users/${id}`);
      const json = response.data;
      return {
        success: json.isSuccess,
        user: json.data,
        message: json.message,
      };
    } catch (error) {
      return {
        success: false,
        message: extractErrorMessage(error, `Failed to fetch user ${id}.`),
      };
    }
  },

  /**
   * Creates a new system user.
   */
  async createUser(
    payload: CreateUserRequest
  ): Promise<{ success: boolean; user?: UserDto; message: string }> {
    try {
      const response = await apiClient.post<ApiResponse<UserDto>>('/users', payload);
      const json = response.data;
      return {
        success: json.isSuccess,
        user: json.data,
        message: json.message,
      };
    } catch (error) {
      return {
        success: false,
        message: extractErrorMessage(error, 'Failed to create user.'),
      };
    }
  },

  /**
   * Updates an existing user profile.
   */
  async updateUser(
    id: string,
    payload: UpdateUserRequest
  ): Promise<{ success: boolean; user?: UserDto; message: string }> {
    try {
      const response = await apiClient.put<ApiResponse<UserDto>>(`/users/${id}`, payload);
      const json = response.data;
      return {
        success: json.isSuccess,
        user: json.data,
        message: json.message,
      };
    } catch (error) {
      return {
        success: false,
        message: extractErrorMessage(error, 'Failed to update user.'),
      };
    }
  },

  /**
   * Changes an existing user's password.
   */
  async changePassword(
    id: string,
    payload: ChangePasswordRequest
  ): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiClient.put<ApiResponse<unknown>>(`/users/${id}/password`, payload);
      const json = response.data;
      return {
        success: json.isSuccess,
        message: json.message,
      };
    } catch (error) {
      return {
        success: false,
        message: extractErrorMessage(error, 'Failed to update password.'),
      };
    }
  },

  /**
   * Sets active/deactivated status for a user.
   */
  async setActiveStatus(
    id: string,
    isActive: boolean
  ): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiClient.patch<ApiResponse<unknown>>(`/users/${id}/status`, { isActive });
      const json = response.data;
      return {
        success: json.isSuccess,
        message: json.message,
      };
    } catch (error) {
      return {
        success: false,
        message: extractErrorMessage(error, 'Failed to modify user status.'),
      };
    }
  },

  /**
   * Deletes a user by identifier.
   */
  async deleteUser(
    id: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiClient.delete<ApiResponse<unknown>>(`/users/${id}`);
      const json = response.data;
      return {
        success: json.isSuccess,
        message: json.message,
      };
    } catch (error) {
      return {
        success: false,
        message: extractErrorMessage(error, 'Failed to delete user.'),
      };
    }
  },
};

export default userApi;
