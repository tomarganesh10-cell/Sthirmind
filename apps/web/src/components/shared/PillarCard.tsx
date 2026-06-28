'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { LucideIcon, ChevronRight } from 'lucide-react';

interface Props {
  pillar: 'heart' | 'hope' | 'health' | 'help';
  label: string;
  icon: LucideIcon;
  color: string;
  desc: string;
  score: number;
  href: string;
}

export function PillarCard({ pillar, label, icon: Icon, color, desc, score, href }: Props) {
  const pct = Math.min(100, Math.max(0, score));
  const tier = pct >= 80 ? 'Excellent' : pct >= 60 ? 'Good' : pct >= 40 ? 'Growing' : 'Focus Area';

  return (
    <Link href={href}>
      <motion.div
        whileHover={{ y: -4, boxShadow: '0 8px 32px rgba(0,0,0,.12)' }}
        whileTap={{ scale: 0.97 }}
        className="card p-4 cursor-pointer select-none group h-full"
        style={{ borderTop: `3px solid ${color}` }}
      >
        <div className="flex items-center justify-between mb-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: `${color}18` }}
          >
            <Icon size={20} style={{ color }} />
          </div>
          <span className="text-xs font-bold rounded-full px-2 py-0.5" style={{ background: `${color}18`, color }}>
            {tier}
          </span>
        </div>

        <div className="mb-1">
          <span className="text-2xl font-black" style={{ color }}>{pct}</span>
          <span className="text-sm text-[var(--muted)]">/100</span>
        </div>

        <p className="font-bold text-[var(--navy)] text-sm">{label}</p>
        <p className="text-xs text-[var(--muted)] mt-0.5">{desc}</p>

        {/* Progress bar */}
        <div className="mt-3 h-1.5 bg-[var(--border)] rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="h-full rounded-full"
            style={{ background: color }}
          />
        </div>

        <div className="flex items-center gap-1 mt-3 text-xs text-[var(--muted)] group-hover:text-[var(--navy)] transition-colors">
          <span>View details</span>
          <ChevronRight size={10} />
        </div>
      </motion.div>
    </Link>
  );
}
