'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import Link from 'next/link';
import { DailyWisdomCard } from '@/components/wisdom/DailyWisdomCard';
import { BookCard } from '@/components/wisdom/BookCard';
import { WisdomStats } from '@/components/wisdom/WisdomStats';

const CATEGORIES = [
  { id: 'all', label: 'All', emoji: '📚' },
  { id: 'mindset', label: 'Mindset', emoji: '🧠' },
  { id: 'leadership', label: 'Leadership', emoji: '👑' },
  { id: 'health', label: 'Health', emoji: '💪' },
  { id: 'startup', label: 'Startup', emoji: '🚀' },
  { id: 'relationships', label: 'Relationships', emoji: '❤️' },
  { id: 'productivity', label: 'Productivity', emoji: '⚡' },
  { id: 'spirituality', label: 'Spirituality', emoji: '🙏' },
  { id: 'finance', label: 'Finance', emoji: '💰' },
];

export default function WisdomLibraryPage() {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: featured } = useQuery({
    queryKey: ['wisdom-featured'],
    queryFn: () => api.get('/wisdom/books').then(r => r.data),
  });

  const { data: searchResults } = useQuery({
    queryKey: ['wisdom-search', searchQuery, activeCategory],
    queryFn: () => api.get(`/wisdom/books?q=${searchQuery}&pillar=${activeCategory === 'all' ? '' : activeCategory}`).then(r => r.data),
    enabled: searchQuery.length > 0 || activeCategory !== 'all',
  });

  const { data: dailyWisdom } = useQuery({
    queryKey: ['daily-wisdom'],
    queryFn: () => api.get('/wisdom/daily').then(r => r.data),
  });

  const { data: recommendations } = useQuery({
    queryKey: ['wisdom-recommendations'],
    queryFn: () => api.get('/wisdom/recommendations').then(r => r.data),
  });

  const { data: stats } = useQuery({
    queryKey: ['wisdom-stats'],
    queryFn: () => api.get('/wisdom/analytics').then(r => r.data),
  });

  const books = (searchQuery || activeCategory !== 'all') ? (searchResults?.items ?? searchResults ?? []) : (featured ?? []);

  return (
    <div className="min-h-screen bg-[#0D1B2A] pt-16">
      {/* Hero Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#1B3A6B] via-[#0D1B2A] to-[#1A0A2E] py-16 px-4">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, #F4A261 0%, transparent 50%), radial-gradient(circle at 80% 20%, #7B2D8B 0%, transparent 50%)' }} />
        <div className="max-w-5xl mx-auto relative">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-4xl">📚</span>
            <span className="text-xs font-bold uppercase tracking-[3px] text-[#F4A261] bg-[#F4A261]/10 px-3 py-1 rounded-full">Premium Feature</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-3">
            Wisdom Library
          </h1>
          <p className="text-[#8B9BB4] text-lg mb-8 max-w-2xl">
            The world's largest AI-powered wisdom platform. Every book summarized, audio narrated, and connected to your Happiness OS.
          </p>

          {/* Search */}
          <div className="flex gap-3 max-w-2xl">
            <div className="flex-1 relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8B9BB4]">🔍</span>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && setSearchQuery(search)}
                placeholder="Search books, authors, concepts..."
                className="w-full bg-white/10 backdrop-blur border border-white/20 rounded-2xl pl-12 pr-4 py-4 text-white placeholder-[#8B9BB4] outline-none focus:border-[#F4A261]/50 text-sm"
              />
            </div>
            <button onClick={() => setSearchQuery(search)} className="bg-[#F4A261] text-white font-bold px-6 py-4 rounded-2xl hover:opacity-90 transition-opacity">
              Search
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Stats Row */}
        {stats && <WisdomStats stats={stats} />}

        {/* Daily Wisdom */}
        {dailyWisdom && (
          <div className="mb-10">
            <h2 className="text-sm font-bold uppercase tracking-widest text-[#F4A261] mb-4">☀️ Today's Wisdom</h2>
            <DailyWisdomCard wisdom={dailyWisdom} />
          </div>
        )}

        {/* Category Pills */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-8 scrollbar-hide">
          {CATEGORIES.map(c => (
            <button key={c.id} onClick={() => setActiveCategory(c.id)}
              className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                activeCategory === c.id ? 'bg-[#F4A261] text-white' : 'bg-[#1A2A3D] border border-white/10 text-[#8B9BB4] hover:text-white'
              }`}>
              {c.emoji} {c.label}
            </button>
          ))}
        </div>

        {/* Recommendations */}
        {recommendations?.length > 0 && !searchQuery && (
          <div className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold uppercase tracking-widest text-[#8B9BB4]">🤖 AI Picks for You</h2>
              <Link href="/wisdom/recommendations" className="text-xs text-[#F4A261] hover:underline">View all</Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {(recommendations?.items ?? recommendations ?? []).slice(0, 5).map((rec: any) => (
                <BookCard key={rec.id ?? rec.book?.id} book={rec.book ?? rec} badge="AI Pick" />
              ))}
            </div>
          </div>
        )}

        {/* Book Grid */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold uppercase tracking-widest text-[#8B9BB4]">
              {searchQuery ? `🔍 Results for "${searchQuery}"` : activeCategory !== 'all' ? `📖 ${activeCategory}` : '🌟 Featured Books'}
            </h2>
            <div className="flex gap-2">
              <Link href="/wisdom/library" className="text-xs text-[#F4A261] hover:underline flex items-center gap-1">My Library →</Link>
            </div>
          </div>

          {books.length === 0 ? (
            <div className="text-center py-20 text-[#8B9BB4]">
              <div className="text-5xl mb-4">📚</div>
              <p className="mb-4">No books found</p>
              <Link href="/wisdom/upload" className="bg-[#F4A261] text-white font-bold px-6 py-3 rounded-xl text-sm">Upload Your Book</Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {books.map((book: any) => (
                <BookCard key={book.id} book={book} />
              ))}
            </div>
          )}
        </div>

        {/* CTA — Upload */}
        <div className="mt-12 bg-gradient-to-r from-[#1A2A3D] to-[#1A0A2E] border border-white/10 rounded-2xl p-8 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h3 className="text-xl font-bold mb-2">📤 Upload Your Own Books</h3>
            <p className="text-[#8B9BB4] text-sm">Upload legally owned PDFs. Our AI will generate summaries, audio, and connect insights to your OS.</p>
          </div>
          <Link href="/wisdom/upload" className="bg-[#F4A261] text-white font-bold px-8 py-4 rounded-xl whitespace-nowrap">Upload Book →</Link>
        </div>
      </div>
    </div>
  );
}
