"use client";

import { useState } from "react";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import Footer from "@/components/layout/Footer";

interface DashboardLayoutClientProps {
  children: React.ReactNode;
}

export default function DashboardLayoutClient({ children }: DashboardLayoutClientProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col">
      <Header onMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)} />
      <div className="flex flex-1">
        <Sidebar 
          mobileOpen={mobileMenuOpen} 
          onMobileClose={() => setMobileMenuOpen(false)} 
        />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-slate-50 dark:bg-slate-900/30">
          {children}
        </main>
      </div>
      <Footer />
    </div>
  );
}
