"use client";

import { Moon, Sun } from 'lucide-react';

export function ThemeToggle() {
  const toggleTheme = () => {
    const root = document.documentElement;
    const dark = !root.classList.contains('dark');
    root.classList.toggle('dark', dark);
    try {
      localStorage.setItem('aivora-supply-theme', dark ? 'dark' : 'light');
    } catch {
      // Theme remains applied for this page even when storage is unavailable.
    }
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-950"
      aria-label="切换日间或夜间主题"
      title="切换主题"
    >
      <Moon className="h-4 w-4 dark:hidden" />
      <Sun className="hidden h-4 w-4 dark:block" />
    </button>
  );
}
