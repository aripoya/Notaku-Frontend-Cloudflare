import { useAuthStore } from "@/lib/auth";

export function useAuth() {
  const { token, user, setAuth, logout } = useAuthStore();
  return { token, user, setAuth, logout };
}
