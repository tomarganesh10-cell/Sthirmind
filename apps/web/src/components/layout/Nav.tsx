'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { UserButton } from '@clerk/nextjs';

const links = [
  { href: '/dashboard', label: 'Dashboard', icon: '🏠' },
  { href: '/ai', label: 'AI Coach', icon: '🤖' },
  { href: '/heart', label: 'Heart', icon: '❤️' },
  { href: '/hope', label: 'Hope', icon: '🌟' },
  { href: '/health', label: 'Health', icon: '💪' },
  { href: '/help', label: 'Help', icon: '🤝' },
  { href: '/analytics', label: 'Analytics', icon: '📊' },
  { href: '/community', label: 'Community', icon: '🌍' },
];

export function Nav() {
  const pathname = usePathname();
  const isPublic = ['/', '/sign-in', '/sign-up'].some(p => pathname.startsWith(p));
  if (isPublic) return null;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0D1B2A]/95 backdrop-blur-lg border-b border-white/8 flex items-center justify-between px-4 h-14">
      <Link href="/dashboard" className="font-extrabold text-lg text-[#F4A261]">Sthir<span className="text-white">Mind</span></Link>
      <div className="flex gap-1 overflow-x-auto scrollbar-hide">
        {links.map(l => (
          <Link key={l.href} href={l.href}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${pathname.startsWith(l.href) ? 'bg-white/10 text-white' : 'text-[#8B9BB4] hover:text-white'}`}>
            <span className="mr-1">{l.icon}</span>{l.label}
          </Link>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <Link href="/profile" className="text-xs text-[#8B9BB4] hover:text-white">Profile</Link>
        <UserButton afterSignOutUrl="/" />
      </div>
    </nav>
  );
}
