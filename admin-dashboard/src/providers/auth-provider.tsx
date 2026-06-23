import { useEffect, useMemo, useState, type PropsWithChildren } from 'react';

import { AuthContext, type AuthContextValue } from '../contexts/auth-context';
import { apiClient, extractApiData } from '../lib/api-client';
import { authStorage } from '../lib/auth-storage';
import type { AuthUser } from '../types/app';

type LoginPayload = {
  token?: string;
  accessToken?: string;
  rememberMe?: boolean;
  user: AuthUser;
};

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  useEffect(() => {
    const bootstrap = async () => {
      const storedToken = authStorage.restoreToken();

      if (!storedToken) {
        setIsBootstrapping(false);
        return;
      }

      setToken(storedToken);

      try {
        const response = await apiClient.get('/auth/me');
        const authenticatedUser = extractApiData<AuthUser>(response);
        setUser(authenticatedUser);
      } catch {
        authStorage.clearToken();
        setToken(null);
        setUser(null);
      } finally {
        setIsBootstrapping(false);
      }
    };

    void bootstrap();
  }, []);

  useEffect(() => {
    const handleUnauthorized = () => {
      authStorage.clearToken();
      setToken(null);
      setUser(null);
    };

    window.addEventListener('medientry:unauthorized', handleUnauthorized);

    return () => {
      window.removeEventListener('medientry:unauthorized', handleUnauthorized);
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isAuthenticated: !!(user && token),
      isBootstrapping,
      async login(credentials) {
        const response = await apiClient.post('/auth/login', credentials);
        const result = extractApiData<LoginPayload>(response);
        const resolvedToken = result.token ?? result.accessToken;

        if (!resolvedToken) {
          throw new Error('Authentication token was not returned by the server.');
        }

        authStorage.setToken(resolvedToken, credentials.rememberMe ?? result.rememberMe ?? false);
        setToken(resolvedToken);
        setUser(result.user);
      },
      async logout() {
        try {
          await apiClient.post('/auth/logout');
        } catch {
          // Always clear the local session even when the server-side token is already invalid.
        } finally {
          authStorage.clearToken();
          setToken(null);
          setUser(null);
        }
      },
    }),
    [isBootstrapping, token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
