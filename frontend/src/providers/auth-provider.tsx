'use client';

import {
  createContext,
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import type { User, LoginCredentials, LoginResponse, ChangePasswordResponse, MfaSetupResponse } from '@/types';
import * as authLib from '@/lib/auth';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<LoginResponse>;
  verifyMfa: (mfaToken: string, code: string) => Promise<void>;
  changePassword: (mfaToken: string, newPassword: string) => Promise<ChangePasswordResponse>;
  setupMfa: (mfaToken: string) => Promise<MfaSetupResponse>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = user !== null;

  const refreshUser = useCallback(async () => {
    try {
      const userData = await authLib.getMe();
      setUser(userData);
    } catch {
      setUser(null);
      authLib.clearStoredTokens();
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const credentials: LoginCredentials = { email, password };
    const response = await authLib.login(credentials);
    if (response.user) {
      setUser(response.user);
    }
    return response;
  }, []);

  const verifyMfa = useCallback(async (mfaToken: string, code: string) => {
    const response = await authLib.verifyMfa({ mfaToken, code });
    if (!response.user) {
      throw new Error('Invalid MFA response');
    }
    setUser(response.user);
  }, []);

  const changePassword = useCallback(async (mfaToken: string, newPassword: string) => {
    return authLib.changePassword({ mfaToken, newPassword });
  }, []);

  const setupMfa = useCallback(async (mfaToken: string) => {
    return authLib.setupMfa(mfaToken);
  }, []);

  const logout = useCallback(async () => {
    await authLib.logout();
    setUser(null);
  }, []);

  // Check for existing session on mount
  useEffect(() => {
    const initAuth = async () => {
      if (authLib.hasStoredTokens()) {
        try {
          await refreshUser();
        } catch {
          // Token invalid, already cleared in refreshUser
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, [refreshUser]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        login,
        verifyMfa,
        changePassword,
        setupMfa,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
