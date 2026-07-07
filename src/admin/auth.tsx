import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { authDB, adminLogDB } from './db';
import type { AdminUser, Role } from './types';

interface AuthState {
  user: AdminUser | null;
  login: (username: string, password: string) => { success: boolean; error?: string };
  logout: () => void;
  hasPermission: (action: 'manage' | 'query') => boolean;
}

const AuthContext = createContext<AuthState | null>(null);

const SESSION_KEY = 'lumolands_admin_session';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(() => {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      return raw ? (JSON.parse(raw) as AdminUser) : null;
    } catch {
      return null;
    }
  });

  const login = useCallback((username: string, password: string) => {
    const result = authDB.login(username, password);
    if (result.success && result.user) {
      setUser(result.user);
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(result.user));
      adminLogDB.add({
        operator: result.user.username,
        action: 'login',
        target: result.user.username,
      });
      return { success: true };
    }
    return { success: false, error: result.error };
  }, []);

  const logout = useCallback(() => {
    if (user) {
      adminLogDB.add({ operator: user.username, action: 'logout', target: user.username });
    }
    setUser(null);
    sessionStorage.removeItem(SESSION_KEY);
  }, [user]);

  // 管理员可 manage（生成/导出/作废/账号管理），客服只能 query（查询+补救）
  const hasPermission = useCallback(
    (action: 'manage' | 'query') => {
      if (!user) return false;
      if (action === 'query') return true; // 两级都能查询
      return user.role === 'admin';
    },
    [user],
  );

  return (
    <AuthContext.Provider value={{ user, login, logout, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
