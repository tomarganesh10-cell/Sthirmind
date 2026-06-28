import type { Metadata, Viewport } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';
import { Providers } from './providers';
import { Nav } from '@/components/layout/Nav';
import { MobileNav } from '@/components/layout/MobileNav';
import { PWAInstallBanner } from '@/components/layout/PWAInstallBanner';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair', display: 'swap' });

export const metadata: Metadata = {
  title: { default: 'SthirMind — Lead With Clarity. Build With Equanimity.', template: '%s | SthirMind' },
  description: 'The world\'s most advanced AI-powered Human Operating System. Heart · Hope · Health · Help → Happiness.',
  keywords: ['leadership', 'equanimity', 'vipassana', 'mindfulness', 'AI coach', '5H framework', 'wisdom library', 'book summaries'],
  authors: [{ name: 'SthirMind', url: 'https://sthirmind.hopecommonersfoundation.com' }],
  creator: 'SthirMind',
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://sthirmind.hopecommonersfoundation.com',
    title: 'SthirMind — AI-Powered Human Operating System',
    description: '5H Framework: Heart · Hope · Health · Help → Happiness',
    siteName: 'SthirMind',
  },
  twitter: { card: 'summary_large_image', title: 'SthirMind', description: 'Lead With Clarity. Build With Equanimity.' },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'SthirMind',
    startupImage: [
      { url: '/icons/icon-512.png', media: '(device-width: 390px)' },
    ],
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
    'apple-touch-fullscreen': 'yes',
    'format-detection': 'telephone=no',
    'msapplication-TileColor': '#0D1B2A',
    'msapplication-TileImage': '/icons/icon-144.png',
  },
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
            <main className="pb-[72px] md:pb-0">{children}</main>
            <MobileNav />
            <PWAInstallBanner />
          </Providers>
        </ClerkProvider>
      </body>
    </html>
  );
}
