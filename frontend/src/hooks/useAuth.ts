import { create } from "zustand";
import { persist } from "zustand/middleware";
import ApiClient from "@/lib/api-client";

interface User {
  id: string;
  email: string;
  username?: string;
  name?: string;
  full_name?: string;
  preferred_name?: string; // ✅ ADD THIS - Used by chat AI for personalization
  tier?: "basic" | "starter" | "pro";
  businessName?: string;
  createdAt?: string;
  lastLogin?: string;
  isActive?: boolean;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          // Call API login endpoint
          const response = await ApiClient.login({ email, password });
          
          // Store token and user data
          set({
            user: response.user,
            token: response.token || null,
            isAuthenticated: true,
            isLoading: false,
          });
          
          console.log('[Auth] Login successful:', response.user?.email);
        } catch (error) {
          set({ isLoading: false });
          console.error('[Auth] Login failed:', error);
          throw error;
        }
      },

      register: async (data) => {
        set({ isLoading: true });
        try {
          // Call API register endpoint
          const response = await ApiClient.register(data);
          
          // Store token and user data
          set({
            user: response.user,
            token: response.token || null,
            isAuthenticated: true,
            isLoading: false,
          });
          
          console.log('[Auth] Registration successful:', response.user?.email);
        } catch (error) {
          set({ isLoading: false });
          console.error('[Auth] Registration failed:', error);
          throw error;
        }
      },

      logout: async () => {
        try {
          // Call API logout endpoint to clear session
          await ApiClient.logout();
          console.log('[Auth] Logout successful');
        } catch (error) {
          console.error('[Auth] Logout error:', error);
        } finally {
          // Clear local state regardless of API call result
          set({
            user: null,
            token: null,
            isAuthenticated: false,
          });
        }
      },

      checkAuth: async () => {
        // Skip check if already authenticated with user data
        const currentState = get();
        if (currentState.isAuthenticated && currentState.user) {
          set({ isLoading: false });
          return;
        }

        set({ isLoading: true });
        try {
          // Verify session with API
          const user = await ApiClient.getCurrentUser();
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error: any) {
          // Only log if it's not a 401 (which is expected when not logged in)
          if (error?.statusCode !== 401) {
            console.error('Auth check error:', error);
          }
          // Session invalid or expired, clear state
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
      skipHydration: true,
    }
  )
);
