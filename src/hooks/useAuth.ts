import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useToast } from 'native-base';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
// Import our custom useAsync hook
import { useAsync } from './useAsync';
// Import Zod types directly
import { User, UserLogin, UserUpdate } from '../../shared/db/zod-schema';

// Base URL for API
const API_URL = 'http://localhost:5000/api';

// Create auth axios instance
const authAxios = axios.create({
  baseURL: API_URL,
  // No withCredentials needed with JWT
});

// Define auth context type
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (credentials: UserLogin) => Promise<any>;
  logout: () => Promise<void>;
  register: (userData: Partial<User>) => Promise<any>;
  update: (userData: UserUpdate) => Promise<User>;
  refreshToken: () => Promise<boolean>;
  isAuthenticated: boolean;
  isAdmin: boolean;
  token: string | null;
}

// Create auth context
const AuthContext = createContext<AuthContextType | null>(null);

// Auth provider component props
interface AuthProviderProps {
  children: ReactNode;
}

// Auth provider component
export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const toast = useToast();
  
  // Create async hooks for auth operations
  const loginAsync = useAsync<{success: boolean, token: string, user: User}, Error, [UserLogin]>();
  const registerAsync = useAsync<{success: boolean, token: string, user: User}, Error, [Partial<User>]>();
  const updateUserAsync = useAsync<User, Error, [UserUpdate]>();
  const refreshTokenAsync = useAsync<boolean, Error, []>();
  const fetchUserAsync = useAsync<User, Error, [string]>();

  // Set auth token for axios requests
  useEffect(() => {
    if (token) {
      authAxios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete authAxios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // Load token and user on startup
  useEffect(() => {
    const loadStoredToken = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('auth_token');
        if (storedToken) {
          setToken(storedToken);
          fetchCurrentUser(storedToken);
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error('Error loading token:', error);
        setLoading(false);
      }
    };

    loadStoredToken();
  }, []);

  // Fetch current user with token
  const fetchCurrentUser = async (currentToken: string) => {
    try {
      const user = await fetchUserAsync.execute(async (token) => {
        const response = await authAxios.get<{success: boolean, user: User}>('/user', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.data?.success && response.data?.user) {
          return response.data.user;
        } else {
          throw new Error('Invalid token or user data');
        }
      }, currentToken);
      
      setUser(user);
    } catch (error) {
      console.error('Error fetching user:', error);
      await AsyncStorage.removeItem('auth_token');
      setToken(null);
    } finally {
      setLoading(false);
    }
  };

  // Login function with proper types
  const login = useCallback(async (credentials: UserLogin) => {
    try {
      const result = await loginAsync.execute(async (creds) => {
        const response = await authAxios.post<{success: boolean, token: string, user: User}>('/login', creds);
        return response.data;
      }, credentials);
      
      if (result.success && result.token && result.user) {
        await AsyncStorage.setItem('auth_token', result.token);
        setToken(result.token);
        setUser(result.user);
        
        toast.show({
          title: "Login successful",
          placement: "top",
          duration: 3000,
          variant: "solid",
        });
        
        return result;
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.show({
        title: "Login failed",
        description: error instanceof Error ? error.message : "Please check your credentials",
        placement: "top",
        duration: 3000,
        variant: "solid",
      });
      throw error;
    }
  }, [loginAsync, toast]);

  // Register function with proper type safety
  const register = useCallback(async (userData: Partial<User>) => {
    try {
      const result = await registerAsync.execute(async (data) => {
        const response = await authAxios.post<{success: boolean, token: string, user: User}>('/register', data);
        return response.data;
      }, userData);
      
      if (result.success && result.token && result.user) {
        await AsyncStorage.setItem('auth_token', result.token);
        setToken(result.token);
        setUser(result.user);
        
        toast.show({
          title: "Registration successful",
          placement: "top",
          duration: 3000,
          variant: "solid",
        });
        
        return result;
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast.show({
        title: "Registration failed",
        description: error instanceof Error ? error.message : "Please try again",
        placement: "top",
        duration: 3000,
        variant: "solid",
      });
      throw error;
    }
  }, [registerAsync, toast]);

  // Logout function
  const logout = useCallback(async () => {
    try {
      // For JWT, we only need to notify the server and do client-side cleanup
      // The server doesn't track sessions, so this is just a courtesy call
      await authAxios.post('/logout');
    } catch (error) {
      console.error('Logout error:', error);
      // Continue with client-side logout even if server call fails
    } finally {
      // The important part is removing the token from local storage
      await AsyncStorage.removeItem('auth_token');
      setToken(null);
      setUser(null);
      delete authAxios.defaults.headers.common['Authorization'];
      
      toast.show({
        title: "Logged out",
        placement: "top",
        duration: 2000,
        variant: "solid",
      });
    }
  }, [toast]);

  // Update user profile with type safety
  const update = useCallback(async (userData: UserUpdate): Promise<User> => {
    try {
      const result = await updateUserAsync.execute(async (data) => {
        const response = await authAxios.put<{success: boolean, data: User}>('/user', data);
        if (response.data?.success && response.data?.data) {
          return response.data.data;
        }
        throw new Error('Invalid response format');
      }, userData);
      
      setUser(result);
      return result;
    } catch (error) {
      console.error('Update user error:', error);
      throw error;
    }
  }, [updateUserAsync]);
  
  // Refresh token
  const refreshToken = useCallback(async (): Promise<boolean> => {
    try {
      return await refreshTokenAsync.execute(async () => {
        const currentToken = await AsyncStorage.getItem('auth_token');
        if (!currentToken) return false;
        
        const response = await authAxios.post<{success: boolean, token: string}>('/refresh', null, {
          headers: { Authorization: `Bearer ${currentToken}` }
        });
        
        if (response.data?.success && response.data?.token) {
          await AsyncStorage.setItem('auth_token', response.data.token);
          setToken(response.data.token);
          return true;
        }
        return false;
      });
    } catch (error) {
      console.error('Token refresh error:', error);
      return false;
    }
  }, [refreshTokenAsync]);

  // Combined loading state
  const isLoading = loading || 
                    loginAsync.isPending || 
                    registerAsync.isPending || 
                    updateUserAsync.isPending || 
                    refreshTokenAsync.isPending ||
                    fetchUserAsync.isPending;

  const value: AuthContextType = {
    user,
    isLoading,
    login,
    logout,
    register,
    update,
    refreshToken,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    token, // Export token for custom usage if needed
  };

  return React.createElement(AuthContext.Provider, { value }, children);
};

// Hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
