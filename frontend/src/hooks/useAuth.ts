import { create } from "zustand";
import { persist } from "zustand/middleware";
import ApiClient from "@/lib/api-client";

export type Tier = "basic" | "starter" | "pro";

export interface User {
  id: string;
  email: string;
  username?: string;
  name?: string;
  full_name?: string;
  preferred_name?: string;
  tier?: Tier;
  businessName?: string;
  createdAt?: string;
  lastLogin?: string;
  isActive?: boolean;
  role?: string;
  image?: string | null;
}

interface AuthState {
  user: User | null;
  token: string | null; // optional kalau backend juga kirim bearer
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions utama (dipakai Context & komponen)
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;

  // Actions sinkronisasi (dipakai Context)
  setAuthFromSession: (user: Partial<User>) => void;
  setAuth: (user: Partial<User> | null, token?: string | null) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      // --- Actions utama ---
      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const res = await ApiClient.login({ email, password });
          const user = (res?.user ?? null) as User | null;
          const token = (res?.token ?? null) as string | null;
          set({
            user,
            token,
            isAuthenticated: !!user,
            isLoading: false,
          });
        } catch (err) {
          set({ isLoading: false });
          throw err;
        }
      },

      register: async (data) => {
        set({ isLoading: true });
        try {
          const res = await ApiClient.register(data);
          const user = (res?.user ?? null) as User | null;
          const token = (res?.token ?? null) as string | null;

          set({
            user,
            token,
            isAuthenticated: !!user,
            isLoading: false,
          });
          console.log("[AuthStore] register ok:", user?.email);
        } catch (err) {
          console.error("[AuthStore] register failed:", err);
          set({ isLoading: false });
          throw err;
        }
      },

      logout: async () => {
        try {
          await ApiClient.logout();
          console.log("[AuthStore] logout ok");
        } catch (err) {
          console.error("[AuthStore] logout error:", err);
        } finally {
          set({ user: null, token: null, isAuthenticated: false });
        }
      },

      checkAuth: async () => {
        const cur = get();
        if (cur.isAuthenticated && cur.user) {
          set({ isLoading: false });
          return;
        }

        set({ isLoading: true });
        try {
          const u = (await ApiClient.getCurrentUser()) as User;
          set({ user: u, isAuthenticated: true, isLoading: false });
        } catch (err: any) {
          if (err?.statusCode !== 401) {
            console.error("[AuthStore] checkAuth error:", err);
          }
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },

      // --- Actions sinkronisasi ---
      setAuthFromSession: (partial) => {
        const user: User = {
          id: String(partial.id ?? ""),
          email: String(partial.email ?? ""),
          name: partial.name,
          full_name: partial.full_name,
          preferred_name: partial.preferred_name,
          username: partial.username,
          tier: partial.tier,
          businessName: partial.businessName,
          role: partial.role ?? "user",
          image: partial.image ?? null,
        };
        set({ user, isAuthenticated: true });
      },

      setAuth: (partial, token) => {
        if (!partial) {
          set({ user: null, token: null, isAuthenticated: false });
          return;
        }
        const prev = get().user ?? ({} as User);
        const user: User = { ...prev, ...(partial as User) };
        set({ user, token: token ?? get().token, isAuthenticated: !!user });
      },

      clearAuth: () => {
        set({ user: null, token: null, isAuthenticated: false });
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
