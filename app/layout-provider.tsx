// app/layout-provider.tsx
'use client'

import { Toaster } from '@/components/ui/toaster';
import '@uploadthing/react/styles.css';
import NextTopLoader from 'nextjs-toploader';
import { Inter } from 'next/font/google';
import Sidebar from '@/components/layout/sidebar';
import { ThemeProvider } from "next-themes"

const inter = Inter({ subsets: ['latin'] });

export function LayoutProvider({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`${inter.className} overflow-hidden`} suppressHydrationWarning={true}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <NextTopLoader showSpinner={false} />
        <Toaster />
        <div className="flex h-screen">
          <Sidebar />
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </ThemeProvider>
    </div>
  );
}