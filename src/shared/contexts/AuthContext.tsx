import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI, User } from '../utils/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (referrer?: string) => void;
  logout: (redirectUrl?: string) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUser = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await authAPI.getCurrentUser();
      const data = response.data;
      
      // Handle both legacy and non-legacy response formats
      let user: User;
      
      if (data.client) {
        // Legacy mode - user data is in the "client" object
        const client = data.client;
        user = {
          id: client.id,
          email: client.email,
          preferred_username: client.display_name,
          full_name: client.full_name,
          email_verified: data.email_verified || "unknown",
          group_memberships: data.group_memberships || [],
          pending_invitations_count: data.pending_invitations_count || 0,
        };
      } else {
        // Non-legacy mode - user data is at top level
        user = {
          id: data.id,
          email: data.email,
          preferred_username: data.preferred_username,
          full_name: data.full_name,
          email_verified: data.email_verified,
          group_memberships: data.group_memberships || [],
          pending_invitations_count: data.pending_invitations_count || 0,
        };
      }
      
      setUser(user);
    } catch (err: any) {
      if (err.response?.status === 404) {
        // User not authenticated
        setUser(null);
      } else {
        setError('Failed to fetch user information');
        console.error('Auth error:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  const login = (referrer?: string) => {
    authAPI.login(referrer);
  };

  const logout = async (redirectUrl?: string) => {
    await authAPI.logout(redirectUrl); // This will handle both legacy and non-legacy modes
  };

  const refreshUser = async () => {
    await fetchUser();
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const value: AuthContextType = {
    user,
    loading,
    error,
    login,
    logout,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};