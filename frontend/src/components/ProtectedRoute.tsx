"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, isLoading, checkAuth } = useAuth();
  const [hydrated, setHydrated] = useState(false);

  // Hydrate Zustand store from localStorage
  useEffect(() => {
    useAuth.persist.rehydrate();
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated && !isAuthenticated && !isLoading) {
      // Check auth when hydrated and not authenticated
      checkAuth();
    }
  }, [hydrated, isAuthenticated, isLoading, checkAuth]);

  useEffect(() => {
    // Redirect to login if not authenticated after loading completes
    if (hydrated && !isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [hydrated, isLoading, isAuthenticated, router]);

  if (!hydrated || isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto" />
          <p className="text-muted-foreground">Memuat...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
