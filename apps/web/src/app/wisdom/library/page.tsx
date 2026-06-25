'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { BookCard } from '@/components/wisdom/BookCard';

const STATUS_FILTERS = [
  { id: 'all', label: 'All Books' },
  { id: 'READING', label: 'Reading' },
  { id: 'COMPLETED', label: 'Completed' },
  { id: 'WANT_TO_READ', label: 'Want to Read' },
];

export default function MyLibraryPage() {
  const [filter, setFilter] = useState('all');
  const qc = useQueryClient();

  const { data: library, isLoading } = useQuery({
    queryKey: ['library'],
    queryFn: () => api.get('/wisdom/library').then(r => r.data),
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/wisdom/library/${id}`, { status }).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['library'] }),
  });

  const items: any[] = library ?? [];
  const filtered = filter === 'all' ? items : items.filter((i: any) => i.status === filter);

  const stats = {
    total: items.length,
    completed: items.filter((i: any) => i.status === 'COMPLETED').length,
    reading: items.filter((i: any) => i.status === 'READING').length,
    wantToRead: items.filter((i: any) => i.status === 'WANT_TO_READ').length,
  };

  return (
    <div className="min-h-screen bg-[#0D1B2A] pt-16">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-white mb-2">📚 My Library</h1>
          <p className="text-[#8B9BB4]">Your personal wisdom collection</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Books', value: stats.total, color: '#F4A261' },
            { label: 'Completed', value: stats.completed, color: '#4CAF50' },
            { label: 'Reading', value: stats.reading, color: '#2196F3' },
            { label: 'Want to Read', value: stats.wantToRead, color: '#9C27B0' },
          ].map(s => (
            <div key={s.label} className="bg-[#1A2A3D] rounded-xl p-4 border border-white/5 text-center">
              <p className="text-2xl font-black" style={{ color: s.color }}>{s.value}</p>
              <p className="text-[#8B9BB4] text-xs mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6">
          {STATUS_FILTERS.map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${filter === f.id ? 'bg-[#F4A261] text-white' : 'bg-[#1A2A3D] border border-white/10 text-[#8B9BB4] hover:text-white'}`}>
              {f.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="text-center py-20 text-[#8B9BB4]">Loading your library...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">📭</div>
            <p className="text-[#8B9BB4] mb-4">No books here yet</p>
            <a href="/wisdom" className="bg-[#F4A261] text-white font-bold px-6 py-3 rounded-xl text-sm">Browse Library</a>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filtered.map((entry: any) => {
              const book = entry.book ?? entry;
              return (
                <div key={entry.id} className="relative group">
                  <BookCard book={book} />
                  <div className="absolute bottom-12 left-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <select
                      value={entry.status}
                      onChange={e => updateStatus.mutate({ id: entry.id, status: e.target.value })}
                      className="w-full text-xs bg-black/80 border border-white/20 text-white rounded-lg px-2 py-1 backdrop-blur"
                      onClick={e => e.preventDefault()}
                    >
                      <option value="WANT_TO_READ">Want to Read</option>
                      <option value="READING">Reading</option>
                      <option value="COMPLETED">Completed</option>
                    </select>
                  </div>
                  <div className="mt-1 px-1">
                    <div className="h-1 bg-white/5 rounded-full">
                      <div className="h-full bg-[#F4A261] rounded-full" style={{ width: `${entry.progress ?? 0}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
