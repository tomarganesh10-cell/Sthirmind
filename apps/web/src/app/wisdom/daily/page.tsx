'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { DailyWisdomCard } from '@/components/wisdom/DailyWisdomCard';
import Link from 'next/link';

export default function DailyWisdomPage() {
  const qc = useQueryClient();

  const { data: wisdom, isLoading } = useQuery({
    queryKey: ['daily-wisdom'],
    queryFn: () => api.get('/wisdom/daily').then(r => r.data),
  });

  const generate = useMutation({
    mutationFn: () => api.post('/wisdom/analytics/sync').then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['daily-wisdom'] }),
  });

  return (
    <div className="min-h-screen bg-[#0D1B2A] pt-16">
      {/* Full-screen background */}
      <div className="fixed inset-0 opacity-5 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% 0%, #F4A261, transparent 60%), radial-gradient(ellipse at 80% 80%, #7B2D8B, transparent 60%)' }} />

      <div className="max-w-4xl mx-auto px-4 py-12 relative">
        <div className="text-center mb-10">
          <span className="text-6xl">☀️</span>
          <h1 className="text-3xl font-extrabold text-white mt-4 mb-2">Today's Wisdom</h1>
          <p className="text-[#8B9BB4]">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>

        {isLoading ? (
          <div className="text-center py-20 text-[#8B9BB4]">
            <div className="text-4xl mb-4 animate-pulse">✨</div>
            <p>Preparing your daily wisdom...</p>
          </div>
        ) : wisdom ? (
          <div className="space-y-6">
            <DailyWisdomCard wisdom={wisdom} />

            {/* Book suggestion */}
            {wisdom.bookSuggestion && (
              <div className="bg-[#1A2A3D] rounded-2xl border border-white/10 p-5 flex items-center gap-4">
                <span className="text-3xl">📚</span>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-[#F4A261] mb-1">Book Suggestion</p>
                  <p className="text-white text-sm">{wisdom.bookSuggestion}</p>
                </div>
                <Link href="/wisdom" className="ml-auto bg-[#F4A261]/10 border border-[#F4A261]/30 text-[#F4A261] text-xs font-bold px-4 py-2 rounded-xl hover:bg-[#F4A261]/20 transition-colors whitespace-nowrap">
                  Browse Library →
                </Link>
              </div>
            )}

            {/* Navigation */}
            <div className="grid grid-cols-2 gap-3">
              <Link href="/wisdom" className="bg-[#1A2A3D] border border-white/10 rounded-xl p-4 text-center hover:border-[#F4A261]/30 transition-colors">
                <span className="text-2xl">📚</span>
                <p className="text-white text-sm font-bold mt-2">Wisdom Library</p>
                <p className="text-[#8B9BB4] text-xs">Browse all books</p>
              </Link>
              <Link href="/wisdom/vault" className="bg-[#1A2A3D] border border-white/10 rounded-xl p-4 text-center hover:border-[#F4A261]/30 transition-colors">
                <span className="text-2xl">🗄️</span>
                <p className="text-white text-sm font-bold mt-2">Knowledge Vault</p>
                <p className="text-[#8B9BB4] text-xs">Your saved insights</p>
              </Link>
            </div>
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">✨</div>
            <p className="text-[#8B9BB4] mb-6">No wisdom generated yet for today</p>
            <button onClick={() => generate.mutate()} disabled={generate.isPending}
              className="bg-[#F4A261] text-white font-bold px-8 py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-60">
              {generate.isPending ? '✨ Generating...' : '✨ Generate Daily Wisdom'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
