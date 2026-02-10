import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';

interface User {
  id: number;
  email: string;
  name: string;
  avatar_config?: string;
  created_at: string;
  last_login?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  updateProfile: (name?: string, avatarConfig?: string) => Promise<void>;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL = 'http://localhost:8081';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('auth_token');
      
      if (savedToken) {
        setToken(savedToken);
        try {
          await fetchCurrentUser(savedToken);
        } catch (err) {
          console.error('Failed to fetch current user:', err);
          localStorage.removeItem('auth_token');
          setToken(null);
        }
      }
      
      setLoading(false);
    };

    initAuth();
  }, []);

  const fetchCurrentUser = async (authToken: string) => {
    const response = await fetch(`${API_URL}/api/auth/me`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user');
    }

    const userData = await response.json();
    setUser(userData);
  };

  const login = async (email: string, password: string) => {
    setError(null);
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Login failed');
      }

      const data = await response.json();
      
   
      localStorage.setItem('auth_token', data.token);
      setToken(data.token);
      setUser(data.user);

      console.log('✅ Login successful:', data.user.email);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, password: string, name: string) => {
    setError(null);
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, name }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Registration failed');
      }

      const data = await response.json();
      
      localStorage.setItem('auth_token', data.token);
      setToken(data.token);
      setUser(data.user);

      console.log('✅ Registration successful:', data.user.email);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Registration failed';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    setToken(null);
    setUser(null);
    console.log('✅ Logout successful');
  };


  const updateProfile = async (name?: string, avatarConfig?: string) => {
    if (!token) {
      throw new Error('Not authenticated');
    }

    setError(null);

    try {
      const updates: { name?: string; avatar_config?: string } = {};
      if (name) updates.name = name;
      if (avatarConfig) updates.avatar_config = avatarConfig;

      const response = await fetch(`${API_URL}/api/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Profile update failed');
      }

      const updatedUser = await response.json();
      setUser(updatedUser);

      console.log('✅ Profile updated');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Profile update failed';
      setError(errorMessage);
      throw err;
    }
  };

  const clearError = () => {
    setError(null);
  };

  const value: AuthContextType = {
    user,
    token,
    loading,
    isAuthenticated: !!user && !!token,
    login,
    register,
    logout,
    updateProfile,
    error,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};