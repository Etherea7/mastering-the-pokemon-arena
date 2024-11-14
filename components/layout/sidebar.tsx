'use client';
import React from 'react';
import Image from 'next/image'; // Add this import
import { DashboardNav } from '@/components/dashboard-nav';
import { navItems } from '@/constants/data';
import { cn } from '@/lib/utils';
import { ChevronLeft, Sun, Moon } from 'lucide-react';
import { useSidebar } from '@/hooks/useSidebar';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

type SidebarProps = {
  className?: string;
};

export default function Sidebar({ className }: SidebarProps) {
  const { isMinimized, toggle } = useSidebar();
  const { theme, setTheme } = useTheme();

  const handleToggle = () => {
    toggle();
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <aside
      className={cn(
        `relative hidden h-screen flex-none border-r bg-card transition-[width] duration-500 md:block`,
        !isMinimized ? 'w-72' : 'w-[72px]',
        className
      )}
    >
      <div className="flex items-center justify-between p-5 pt-10">
        <div className={cn("transition-all duration-300", 
          isMinimized ? "w-full flex justify-center" : "w-auto"
        )}>
          <Link href="/">
            <Image
              src="/pokemonLogo.png"
              alt="Pokemon Logo"
              width={isMinimized ? 80 : 100}
              height={isMinimized ? 80 : 100}
              className="transition-transform duration-300 hover:scale-110"
            />
          </Link>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "rounded-full",
            isMinimized && "absolute right-0" // Position when minimized
          )}
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </div>
      {/* Rest of your sidebar code remains the same */}
      <ChevronLeft
        className={cn(
          'absolute -right-3 top-10 z-50 cursor-pointer rounded-full border bg-background text-3xl text-foreground',
          isMinimized && 'rotate-180'
        )}
        onClick={handleToggle}
      />
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <div className="mt-3 space-y-1">
            <DashboardNav items={navItems} />
          </div>
        </div>
      </div>
    </aside>
  );
}