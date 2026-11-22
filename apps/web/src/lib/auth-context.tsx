'use client';

import type { AuthUserProfile, ClubRole } from '@smash-bill/shared';
import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { fetchCurrentUser, logoutUser } from './api-client';

export interface AuthContextValue {
  user: AuthUserProfile | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const profile = await fetchCurrentUser();
      setUser(profile);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    fetchCurrentUser()
      .then((profile) => {
        if (active) {
          setUser(profile);
        }
      })
      .catch(() => {
        if (active) {
          setUser(null);
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutUser();
    } catch {
      // Clear local user state even if cookie was already cleared
    } finally {
      setUser(null);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      refreshUser,
      logout,
    }),
    [user, loading, refreshUser, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useCurrentUser(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    return {
      user: null,
      loading: false,
      refreshUser: async () => {},
      logout: async () => {},
    };
  }
  return context;
}

export interface ClubPermissions {
  myRole: ClubRole | null;
  canManageClub: boolean;
  canManageMatches: boolean;
  isClubMember: boolean;
  isPlatformAdmin: boolean;
}

export function useClubPermissions(myRole?: ClubRole | null): ClubPermissions {
  const { user } = useCurrentUser();
  const normalizedRole = myRole ?? null;

  return useMemo<ClubPermissions>(
    () => ({
      myRole: normalizedRole,
      canManageClub: normalizedRole === 'ADMIN',
      canManageMatches: normalizedRole === 'ADMIN',
      isClubMember:
        normalizedRole === 'ADMIN' || normalizedRole === 'MEMBER' || normalizedRole === 'GUEST',
      isPlatformAdmin: user?.role === 'ADMIN',
    }),
    [normalizedRole, user?.role],
  );
}

export const usePermissions = useClubPermissions;
