import type { Metadata, Viewport } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';
import { Providers } from './providers';
import { Nav } from '@/components/layout/Nav';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair', display: 'swap' });

export const metadata: Metadata = {
  title: { default: 'SthirMind — Lead With Clarity. Build With Equanimity.', template: '%s | SthirMind' },
  description: 'The world\'s most advanced AI-powered Human Operating System. Heart · Hope · Health · Help → Happiness.',
  keywords: ['leadership', 'equanimity', 'vipassana', 'mindfulness', 'AI coach', '5H framework'],
  authors: [{ name: 'SthirMind', url: 'https://sthirmind.playplate.in' }],
  creator: 'SthirMind',
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://sthirmind.playplate.in',
    title: 'SthirMind — AI-Powered Human Operating System',
    description: '5H Framework: Heart · Hope · Health · Help → Happiness',
    siteName: 'SthirMind',
  },
  twitter: { card: 'summary_large_image', title: 'SthirMind', description: 'Lead With Clarity. Build With Equanimity.' },
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'SthirMind' },
};

export const viewport: Viewport = {
  themeColor: '#1B3A6B',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${playfair.variable} font-sans antialiased`}>
        <ClerkProvider>
          <Providers>
            <Nav />
            <main>{children}</main>
          </Providers>
        </ClerkProvider>
      </body>
    </html>
  );
}
