'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api/client';

interface DailyWisdom {
  id: string;
  quote: string;
  quoteAuthor: string;
  insight: string;
  reflectionQuestion: string;
  pillarFocus?: string;
  bookSuggestion?: string;
  openedAt?: string;
}

const PILLAR_ICONS: Record<string, string> = {
  HEART: '❤️',
  HOPE: '🌟',
  HEALTH: '💪',
  HELP: '🤝',
};

export function DailyWisdomCard({ wisdom }: { wisdom: DailyWisdom }) {
  const [opened, setOpened] = useState(!!wisdom.openedAt);
  const [reflected, setReflected] = useState(false);

  const openMutation = useMutation({
    mutationFn: () => api.post(`/wisdom/daily/${wisdom.id}/open`),
    onSuccess: () => setOpened(true),
  });

  const pillarIcon = wisdom.pillarFocus ? PILLAR_ICONS[wisdom.pillarFocus.toUpperCase()] ?? '✨' : '✨';

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#1A2A3D] via-[#1A1A2E] to-[#0D1B2A] p-6">
      <div className="absolute top-0 right-0 w-64 h-64 opacity-5" style={{ background: 'radial-gradient(circle, #F4A261, transparent)' }} />

      <div className="relative grid md:grid-cols-3 gap-6">
        {/* Quote */}
        <div className="md:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">{pillarIcon}</span>
            <span className="text-xs font-bold uppercase tracking-widest text-[#F4A261]">
              {wisdom.pillarFocus ?? 'Daily'} Focus
            </span>
          </div>
          <blockquote className="text-white text-lg font-medium italic leading-relaxed mb-2">
            "{wisdom.quote}"
          </blockquote>
          <p className="text-[#F4A261] text-sm font-semibold mb-4">— {wisdom.quoteAuthor}</p>
          <p className="text-[#8B9BB4] text-sm leading-relaxed">{wisdom.insight}</p>
        </div>

        {/* Reflection */}
        <div className="bg-white/5 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[#8B9BB4] mb-3">Today's Reflection</p>
            <p className="text-white text-sm leading-relaxed font-medium">{wisdom.reflectionQuestion}</p>
          </div>
          <div className="mt-4 space-y-2">
            {!opened && (
              <button
                onClick={() => openMutation.mutate()}
                className="w-full bg-[#F4A261] text-white text-xs font-bold py-2 rounded-lg hover:opacity-90 transition-opacity"
              >
                Mark as Read ✓
              </button>
            )}
            {opened && !reflected && (
              <button
                onClick={() => setReflected(true)}
                className="w-full bg-white/10 border border-white/20 text-white text-xs font-bold py-2 rounded-lg hover:bg-white/20 transition-colors"
              >
                I Reflected 🙏
              </button>
            )}
            {reflected && (
              <p className="text-center text-xs text-[#4CAF50] font-bold">✓ Reflection complete</p>
            )}
            {wisdom.bookSuggestion && (
              <p className="text-[10px] text-[#8B9BB4] text-center pt-1">📚 {wisdom.bookSuggestion}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
