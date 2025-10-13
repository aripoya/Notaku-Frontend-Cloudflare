"use client";
import Link from "next/link";
import { useTheme } from "next-themes";
import { Menu, Moon, Sun } from "lucide-react";
import { useState } from "react";

export default function Header() {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  return (
    <header className="w-full border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button className="sm:hidden" aria-label="Toggle menu" onClick={() => setOpen(!open)}>
            <Menu className="w-6 h-6" />
          </button>
          <Link href="/" className="font-bold text-lg">NotaKu</Link>
        </div>
        <nav className="hidden sm:flex items-center gap-6 text-sm">
          <Link href="/pricing">Harga</Link>
          <Link href="/about">Tentang</Link>
          <Link href="/login" className="text-blue-600 font-medium">Masuk</Link>
        </nav>
        <button
          aria-label="Toggle dark mode"
          className="p-2 rounded-md border border-slate-200 dark:border-slate-700"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      </div>
      {open && (
        <div className="sm:hidden border-t border-slate-200 dark:border-slate-700 px-4 py-3 space-y-2">
          <Link href="/pricing" className="block">Harga</Link>
          <Link href="/about" className="block">Tentang</Link>
          <Link href="/login" className="block text-blue-600 font-medium">Masuk</Link>
        </div>
      )}
    </header>
  );
}
