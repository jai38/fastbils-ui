import React, { createContext, useContext, useEffect, useState } from 'react';
import { api, setAccessToken } from '@/api/client';
import type { AuthResponse, LoginRequest, Organisation, RegisterRequest, User } from './types';

interface AuthContextType {
  user: User | null;
  organisation: Organisation | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ACCESS_TOKEN_KEY = 'fastbills_access_token';
const REFRESH_TOKEN_KEY = 'fastbills_refresh_token';
const USER_KEY = 'fastbills_user';
const ORG_KEY = 'fastbills_org';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem(USER_KEY);
    return saved ? JSON.parse(saved) : null;
  });
  const [organisation, setOrganisation] = useState<Organisation | null>(() => {
    const saved = localStorage.getItem(ORG_KEY);
    return saved ? JSON.parse(saved) : null;
  });
  const [accessToken, setToken] = useState<string | null>(() => {
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (token) {
      setAccessToken(token);
    }
    return token;
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const handleAuthSuccess = (response: AuthResponse) => {
    setToken(response.accessToken);
    setUser(response.user);
    setOrganisation(response.organisation);

    setAccessToken(response.accessToken);
    localStorage.setItem(ACCESS_TOKEN_KEY, response.accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, response.refreshToken);
    localStorage.setItem(USER_KEY, JSON.stringify(response.user));
    localStorage.setItem(ORG_KEY, JSON.stringify(response.organisation));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setOrganisation(null);
    setAccessToken(null);
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(ORG_KEY);
  };

  useEffect(() => {
    const initAuth = async () => {
      const storedRefreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
      if (!storedRefreshToken) {
        setIsLoading(false);
        return;
      }

      try {
        // Attempt token refresh on session startup
        const { data, error } = await api.POST('/api/v1/auth/refresh', {
          body: { refreshToken: storedRefreshToken },
        });

        if (error || !data) {
          logout();
        } else {
          handleAuthSuccess(data);
        }
      } catch {
        logout();
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (credentials: LoginRequest) => {
    const { data, error } = await api.POST('/api/v1/auth/login', {
      body: credentials,
    });

    if (error || !data) {
      const message = (error as { message?: string })?.message || 'Invalid email or password';
      throw new Error(message);
    }

    handleAuthSuccess(data);
  };

  const register = async (dataPayload: RegisterRequest) => {
    const { data, error } = await api.POST('/api/v1/auth/register', {
      body: dataPayload,
    });

    if (error || !data) {
      const message = (error as { message?: string })?.message || 'Registration failed';
      throw new Error(message);
    }

    handleAuthSuccess(data);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        organisation,
        accessToken,
        isAuthenticated: !!accessToken && !!user,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
