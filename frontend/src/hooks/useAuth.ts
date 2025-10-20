import { create } from "zustand";
import { persist } from "zustand/middleware";
import ApiClient from "@/lib/api-client";

interface User {
  id: string;
  email: string;
  username?: string;
  name?: string;
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
          
          // API returns user object directly (session managed via cookies)
          set({
            user: response.user,
            token: null, // Session managed via HTTP-only cookies
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      register: async (data) => {
        set({ isLoading: true });
        try {
          // Call API register endpoint
          const response = await ApiClient.register(data);
          
          // API returns user object directly (session managed via cookies)
          set({
            user: response.user,
            token: null, // Session managed via HTTP-only cookies
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: async () => {
        try {
          // Call API logout endpoint to clear session
          await ApiClient.logout();
        } catch (error) {
          console.error('Logout error:', error);
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
        try {
          // Verify session with API
          const user = await ApiClient.getCurrentUser();
          set({
            user,
            isAuthenticated: true,
          });
        } catch (error) {
          // Session invalid or expired, clear state
          set({
            user: null,
            token: null,
            isAuthenticated: false,
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
