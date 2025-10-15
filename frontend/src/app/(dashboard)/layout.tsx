import { ProtectedRoute } from "@/components/ProtectedRoute";
import DashboardLayoutClient from "@/components/layout/DashboardLayoutClient";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <DashboardLayoutClient>{children}</DashboardLayoutClient>
    </ProtectedRoute>
  );
}
