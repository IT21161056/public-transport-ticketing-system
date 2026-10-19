import { useState, useCallback } from 'react';
import { adminApi, adminSession } from '../api/adminApi';
import type { RegisteredUser } from '../types';

/** Admin-only auth state. Fully separate from the commuter `useAuth` session. */
export function useAdminAuth() {
  const [adminUser, setAdminUser] = useState<RegisteredUser | null>(() => adminSession.getUser());

  const login = useCallback(async (identifier: string, password: string) => {
    const res = await adminApi.login(identifier, password);
    if (res.success && res.user) {
      setAdminUser(res.user);
    }
    return { success: res.success, message: res.message };
  }, []);

  const logout = useCallback(() => {
    adminSession.clear();
    setAdminUser(null);
  }, []);

  return { adminUser, login, logout };
}
