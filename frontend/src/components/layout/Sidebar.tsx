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
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={onMobileClose}
          />
          
          {/* Sidebar */}
          <aside className="fixed left-0 top-16 bottom-0 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 z-50 md:hidden overflow-y-auto">
            <nav className="p-4 space-y-1">
              {items.map(({ href, label, icon: Icon }) => {
                const active = pathname === href || pathname.startsWith(href + "/");
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={onMobileClose}
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
        </>
      )}
    </>
  );
}
