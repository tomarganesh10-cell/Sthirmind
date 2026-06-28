'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  { href: '/dashboard', icon: '🏠', label: 'Home' },
  { href: '/wisdom', icon: '📚', label: 'Wisdom' },
  { href: '/wisdom/daily', icon: '✨', label: 'Daily' },
  { href: '/wisdom/library', icon: '🗂', label: 'Library' },
  { href: '/profile', icon: '👤', label: 'Me' },
];

export function MobileNav() {
  const path = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-[#0F1E2E]/95 backdrop-blur-xl border-t border-white/8 safe-area-pb">
      <div className="flex items-center justify-around px-2 py-2">
        {TABS.map(tab => {
          const active = path === tab.href || (tab.href !== '/dashboard' && path.startsWith(tab.href));
          return (
            <Link key={tab.href} href={tab.href}
              className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all min-w-[60px] ${active ? 'bg-[#F4A261]/10' : ''}`}>
              <span className={`text-xl transition-all ${active ? 'scale-110' : 'opacity-40'}`}>{tab.icon}</span>
              <span className={`text-[10px] font-semibold transition-colors ${active ? 'text-[#F4A261]' : 'text-[#8B9BB4]'}`}>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
