import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "./use-toast";
import { useEffect } from "react";

interface AuthUser {
  id: number;
  username: string;
  email: string;
  role: string;
  isActive: boolean;
}

interface LoginData {
  email: string;
  password: string;
}

interface RegisterData {
  username: string;
  email: string;
  password: string;
  mobile_number?: string;
  role?: string;
}

interface AuthResponse {
  user: AuthUser;
  token: string;
  refreshToken: string;
  message: string;
}

// Save token to localStorage
const saveTokens = (token: string, refreshToken: string) => {
  localStorage.setItem('auth_token', token);
  localStorage.setItem('refresh_token', refreshToken);
};

// Clear tokens from localStorage
const clearTokens = () => {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('refresh_token');
};

// Get token from localStorage
const getToken = (): string | null => {
  return localStorage.getItem('auth_token');
};

// Get refresh token from localStorage
const getRefreshToken = (): string | null => {
  return localStorage.getItem('refresh_token');
};

export function useAuth() {
  const { toast } = useToast();

  // Check if JWT auth is enabled
  const useJwtAuth = true; // Set to true to use JWT-based auth, false to use session auth

  // Get JWT token
  const authToken = getToken();
  
  // Function to add auth header to requests
  const getAuthHeaders = (): Record<string, string> => {
    const token = getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const { data: user, isLoading, error, refetch } = useQuery<AuthUser | null, Error>({
    queryKey: [useJwtAuth ? "/auth/user" : "/api/user"],
    queryFn: async ({ queryKey }): Promise<AuthUser | null> => {
      try {
        // Use different endpoints based on auth method
        const endpoint = useJwtAuth ? "/auth/user" : "/api/user";
        
        // Add auth header for JWT auth
        const headers: HeadersInit = useJwtAuth ? getAuthHeaders() : {};
        
        const res = await fetch(endpoint, { headers });
        
        if (!res.ok) {
          if (res.status === 401) {
            // Try refresh token if available
            if (useJwtAuth && getRefreshToken()) {
              try {
                const refreshed = await refreshToken();
                if (refreshed) {
                  // Manual refetch with new token
                  const newHeaders: HeadersInit = getAuthHeaders();
                  const newRes = await fetch(endpoint, { headers: newHeaders });
                  if (newRes.ok) {
                    return await newRes.json();
                  }
                }
              } catch (e) {
                console.error("Error refreshing token:", e);
              }
            }
            return null;
          }
          throw new Error("Failed to fetch user");
        }
        return await res.json();
      } catch (err) {
        console.error("Error fetching user:", err);
        return null;
      }
    },
    retry: false,
    enabled: useJwtAuth ? !!authToken : true, // Only run if we have a token when using JWT auth
  });

  // Add token refresh functionality
  const refreshToken = async (): Promise<boolean> => {
    try {
      const currentRefreshToken = getRefreshToken();
      if (!currentRefreshToken) return false;
      
      const res = await apiRequest("POST", "/auth/refresh", { refreshToken: currentRefreshToken });
      
      if (res.ok) {
        const data = await res.json();
        saveTokens(data.token, data.refreshToken);
        return true;
      }
      return false;
    } catch (err) {
      console.error("Error refreshing token:", err);
      return false;
    }
  };

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      // Use different endpoints based on auth method
      const endpoint = useJwtAuth ? "/auth/login" : "/api/login";
      const res = await apiRequest("POST", endpoint, credentials);
      return await res.json();
    },
    onSuccess: (response: AuthResponse) => {
      if (useJwtAuth && response.token) {
        // Save JWT tokens
        saveTokens(response.token, response.refreshToken);
      }
      
      queryClient.setQueryData([useJwtAuth ? "/auth/user" : "/api/user"], response.user);
      
      toast({
        title: "Login successful",
        description: `Welcome back, ${response.user.username}!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message || "Invalid credentials",
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (userData: RegisterData) => {
      // Use different endpoints based on auth method
      const endpoint = useJwtAuth ? "/auth/register" : "/api/register";
      const res = await apiRequest("POST", endpoint, userData);
      return await res.json();
    },
    onSuccess: (response: AuthResponse) => {
      if (useJwtAuth && response.token) {
        // Save JWT tokens
        saveTokens(response.token, response.refreshToken);
      }
      
      queryClient.setQueryData([useJwtAuth ? "/auth/user" : "/api/user"], response.user);
      
      toast({
        title: "Registration successful",
        description: `Welcome, ${response.user.username}!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message || "Username might already be taken",
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      // Use different endpoints based on auth method
      const endpoint = useJwtAuth ? "/auth/logout" : "/api/logout";
      
      // Add auth header for JWT auth
      const headers = useJwtAuth ? getAuthHeaders() : {};
      
      await apiRequest("POST", endpoint, undefined, headers);
    },
    onSuccess: () => {
      if (useJwtAuth) {
        // Clear JWT tokens
        clearTokens();
      }
      
      queryClient.setQueryData([useJwtAuth ? "/auth/user" : "/api/user"], null);
      
      toast({
        title: "Logged out",
        description: "You have been logged out successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Automatically fetch user if we have a token but no user data
  useEffect(() => {
    if (useJwtAuth && authToken && !user && !isLoading) {
      refetch();
    }
  }, [useJwtAuth, authToken, user, isLoading, refetch]);

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login: loginMutation.mutate,
    register: registerMutation.mutate,
    logout: logoutMutation.mutate,
    loginStatus: loginMutation.status,
    registerStatus: registerMutation.status,
    logoutStatus: logoutMutation.status,
    refreshToken,
  };
}