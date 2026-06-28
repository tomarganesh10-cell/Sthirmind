'use client';

import Link from 'next/link';

interface Insight {
  id?: string;
  type?: string;
  title?: string;
  message: string;
  pillar?: string;
  actionUrl?: string;
  actionLabel?: string;
  emoji?: string;
}

const PILLAR_COLORS: Record<string, string> = {
  HEART: '#E91E63',
  HOPE: '#F4A261',
  HEALTH: '#4CAF50',
  HELP: '#2196F3',
};

export function InsightCard({ insight }: { insight: Insight }) {
  const color = insight.pillar ? PILLAR_COLORS[insight.pillar.toUpperCase()] ?? '#F4A261' : '#F4A261';

  return (
    <div className="bg-[#1A2A3D] rounded-xl p-4 border border-white/5 hover:border-white/15 transition-colors"
      style={{ borderLeft: `3px solid ${color}` }}>
      <div className="flex items-start gap-3">
        {insight.emoji && <span className="text-xl flex-shrink-0">{insight.emoji}</span>}
        <div className="flex-1 min-w-0">
          {insight.title && (
            <p className="text-white text-xs font-bold mb-1">{insight.title}</p>
          )}
          <p className="text-[#8B9BB4] text-xs leading-relaxed">{insight.message}</p>
          {insight.actionUrl && insight.actionLabel && (
            <Link href={insight.actionUrl}
              className="inline-block mt-2 text-xs font-semibold hover:underline"
              style={{ color }}>
              {insight.actionLabel} →
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
