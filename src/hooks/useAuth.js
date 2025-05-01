import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useToast } from 'native-base';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

// Base URL for API
const API_URL = 'http://localhost:5000/api';

// Create auth axios instance
const authAxios = axios.create({
  baseURL: API_URL,
  // No withCredentials needed with JWT
});

// Create auth context
const AuthContext = createContext(null);

// Auth provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);
  const toast = useToast();

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
  const fetchCurrentUser = async (currentToken) => {
    try {
      const response = await authAxios.get('/user', {
        headers: { Authorization: `Bearer ${currentToken}` }
      });
      if (response.data?.success && response.data?.user) {
        setUser(response.data.user);
      } else {
        // If no user data in the response, token might be invalid
        throw new Error('Invalid token or user data');
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      await AsyncStorage.removeItem('auth_token');
      setToken(null);
    } finally {
      setLoading(false);
    }
  };

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials) => {
      const response = await authAxios.post('/login', credentials);
      return response.data;
    },
    onSuccess: async (data) => {
      if (data.success && data.token && data.user) {
        await AsyncStorage.setItem('auth_token', data.token);
        setToken(data.token);
        setUser(data.user);
        
        toast.show({
          title: "Login successful",
          status: "success",
          placement: "top",
          duration: 3000,
        });
      } else {
        throw new Error('Invalid response format');
      }
    },
    onError: (error) => {
      console.error('Login error:', error);
      toast.show({
        title: "Login failed",
        description: error.response?.data?.message || "Please check your credentials",
        status: "error",
        placement: "top",
        duration: 3000,
      });
    },
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: async (userData) => {
      const response = await authAxios.post('/register', userData);
      return response.data;
    },
    onSuccess: async (data) => {
      if (data.success && data.token && data.user) {
        await AsyncStorage.setItem('auth_token', data.token);
        setToken(data.token);
        setUser(data.user);
        
        toast.show({
          title: "Registration successful",
          status: "success",
          placement: "top",
          duration: 3000,
        });
      } else {
        throw new Error('Invalid response format');
      }
    },
    onError: (error) => {
      console.error('Registration error:', error);
      toast.show({
        title: "Registration failed",
        description: error.response?.data?.message || "Please try again",
        status: "error",
        placement: "top",
        duration: 3000,
      });
    },
  });

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
        status: "info",
        placement: "top",
        duration: 2000,
      });
    }
  }, [toast]);

  // Update user profile
  const update = useCallback(async (userData) => {
    try {
      const response = await authAxios.put('/user', userData);
      if (response.data?.success && response.data?.data) {
        setUser(response.data.data);
        return response.data.data;
      }
      throw new Error('Invalid response format');
    } catch (error) {
      console.error('Update user error:', error);
      throw error;
    }
  }, []);
  
  // Refresh token
  const refreshToken = useCallback(async () => {
    try {
      const currentToken = await AsyncStorage.getItem('auth_token');
      if (!currentToken) return false;
      
      const response = await authAxios.post('/refresh', null, {
        headers: { Authorization: `Bearer ${currentToken}` }
      });
      
      if (response.data?.success && response.data?.token) {
        await AsyncStorage.setItem('auth_token', response.data.token);
        setToken(response.data.token);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Token refresh error:', error);
      return false;
    }
  }, []);

  // Login function
  const login = useCallback(async (credentials) => {
    return loginMutation.mutateAsync(credentials);
  }, [loginMutation]);

  // Register function
  const register = useCallback(async (userData) => {
    return registerMutation.mutateAsync(userData);
  }, [registerMutation]);

  const isLoading = loading || loginMutation.isPending || registerMutation.isPending;

  const value = {
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

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
