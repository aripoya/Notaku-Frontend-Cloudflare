"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, FileText, Home, Image as ImageIcon, MessageSquare, Settings } from "lucide-react";

const items = [
  { href: "/dashboard", label: "Beranda", icon: Home },
  { href: "/dashboard/upload", label: "Upload Nota", icon: ImageIcon },
  { href: "/dashboard/receipts", label: "Daftar Nota", icon: FileText },
  { href: "/dashboard/analytics", label: "Analitik", icon: BarChart3 },
  { href: "/dashboard/chat", label: "Chat AI", icon: MessageSquare },
  { href: "/dashboard/settings", label: "Pengaturan", icon: Settings },
];

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export default function Sidebar({ mobileOpen = false, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  
  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-64 border-r border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 min-h-screen">
        <nav className="p-4 space-y-1">
          {items.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm border ${
                  active
                    ? "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950/40 dark:border-blue-900"
                    : "border-transparent hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Mobile Sidebar */}
      {mobileOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm animate-in fade-in duration-200"
            onClick={onMobileClose}
          />
          
          {/* Sidebar */}
          <aside className="fixed left-0 top-0 bottom-0 w-72 bg-white dark:bg-slate-900 z-50 md:hidden overflow-y-auto shadow-2xl animate-in slide-in-from-left duration-300">
            {/* Sidebar Header */}
            <div className="h-16 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-4">
              <span className="font-bold text-lg">Menu</span>
              <button
                onClick={onMobileClose}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md"
                aria-label="Close menu"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            
            {/* Navigation */}
            <nav className="p-4 space-y-1">
              {items.map(({ href, label, icon: Icon }) => {
                const active = pathname === href || pathname.startsWith(href + "/");
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={onMobileClose}
                    className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                      active
                        ? "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400"
                        : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{label}</span>
                  </Link>
                );
              })}
            </nav>
          </aside>
        </>
      )}
    </>
  );
}
