// app/layout.tsx
import { Metadata } from 'next';
import { LayoutProvider } from '@/app/layout-provider';
import './globals.css';


export const metadata: Metadata = {
  title: 'Mastering the Pokemon Arena',
  description: 'Basic dashboard with Next.js and Shadcn',
  icons: '/starmie.png'
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head />
      <body>
        <LayoutProvider>{children}</LayoutProvider>
      </body>
    </html>
  );
}