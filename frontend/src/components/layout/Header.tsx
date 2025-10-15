"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Menu, Moon, Sun, LogOut, User } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface HeaderProps {
  onMenuToggle?: () => void;
}

export default function Header({ onMenuToggle }: HeaderProps) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();

  // Hydrate on mount
  useEffect(() => {
    useAuth.persist.rehydrate();
    setMounted(true);
  }, []);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <header className="w-full border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            className="md:hidden" 
            aria-label="Toggle menu" 
            onClick={() => {
              if (isAuthenticated && onMenuToggle) {
                onMenuToggle();
              } else {
                setMobileMenuOpen(!mobileMenuOpen);
              }
            }}
          >
            <Menu className="w-6 h-6" />
          </button>
          <Link href="/" className="font-bold text-lg">
            NotaKu
          </Link>
        </div>

        <div className="flex items-center gap-3">
          {/* Theme Toggle */}
          <button
            aria-label="Toggle dark mode"
            className="p-2 rounded-md border border-slate-200 dark:border-slate-700"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          {/* User Menu - Only show if authenticated */}
          {isAuthenticated && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar>
                    <AvatarFallback className="bg-blue-600 text-white">
                      {user.name?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.name || "User"}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                    {user.businessName && (
                      <p className="text-xs leading-none text-muted-foreground mt-1">{user.businessName}</p>
                    )}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/settings" className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    <span>Pengaturan</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Keluar</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <nav className="hidden sm:flex items-center gap-6 text-sm">
              <Link href="/pricing">Harga</Link>
              <Link href="/about">Tentang</Link>
              <Link href="/login" className="text-blue-600 font-medium">
                Masuk
              </Link>
            </nav>
          )}
        </div>
      </div>

      {/* Mobile Menu for Non-Authenticated Users */}
      {!isAuthenticated && mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
          <nav className="px-4 py-3 space-y-3">
            <Link 
              href="/pricing" 
              className="block py-2 text-sm hover:text-blue-600"
              onClick={() => setMobileMenuOpen(false)}
            >
              Harga
            </Link>
            <Link 
              href="/about" 
              className="block py-2 text-sm hover:text-blue-600"
              onClick={() => setMobileMenuOpen(false)}
            >
              Tentang
            </Link>
            <Link 
              href="/login" 
              className="block py-2 text-sm text-blue-600 font-medium"
              onClick={() => setMobileMenuOpen(false)}
            >
              Masuk
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
