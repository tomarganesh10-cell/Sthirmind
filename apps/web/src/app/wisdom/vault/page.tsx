'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';

const NOTE_TYPES = [
  { id: 'all', label: 'All', emoji: '📚' },
  { id: 'NOTE', label: 'Notes', emoji: '📝' },
  { id: 'HIGHLIGHT', label: 'Highlights', emoji: '🖊️' },
  { id: 'QUOTE', label: 'Quotes', emoji: '💬' },
  { id: 'INSIGHT', label: 'Insights', emoji: '💡' },
];

export default function KnowledgeVaultPage() {
  const [activeType, setActiveType] = useState('all');
  const [search, setSearch] = useState('');
  const qc = useQueryClient();

  const { data: notes } = useQuery({
    queryKey: ['vault-notes', activeType],
    queryFn: () => api.get(`/wisdom/notes${activeType !== 'all' ? `?type=${activeType}` : ''}`).then(r => r.data),
  });

  const { data: graph } = useQuery({
    queryKey: ['knowledge-graph'],
    queryFn: () => api.get('/wisdom/knowledge-graph').then(r => r.data),
  });

  const toggleStar = useMutation({
    mutationFn: (id: string) => api.patch(`/wisdom/notes/${id}/star`).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vault-notes'] }),
  });

  const buildGraph = useMutation({
    mutationFn: () => api.post('/wisdom/knowledge-graph/build').then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['knowledge-graph'] }),
  });

  const notesList: any[] = notes ?? [];
  const filtered = notesList.filter((n: any) =>
    search ? n.content.toLowerCase().includes(search.toLowerCase()) : true
  );

  const starred = filtered.filter((n: any) => n.isStarred);
  const unstarred = filtered.filter((n: any) => !n.isStarred);

  return (
    <div className="min-h-screen bg-[#0D1B2A] pt-16">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-white mb-1">🗄️ Knowledge Vault</h1>
            <p className="text-[#8B9BB4]">Your personal library of insights, quotes, and learnings</p>
          </div>
          <button onClick={() => buildGraph.mutate()} disabled={buildGraph.isPending}
            className="bg-[#7B2D8B] text-white text-sm font-bold px-5 py-2.5 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-60">
            {buildGraph.isPending ? '⚙️ Building...' : '🧠 Build Knowledge Graph'}
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Total Notes', value: notesList.length },
            { label: 'Starred', value: notesList.filter((n: any) => n.isStarred).length },
            { label: 'Graph Nodes', value: graph?.nodes?.length ?? 0 },
            { label: 'Connections', value: graph?.edges?.length ?? 0 },
          ].map(s => (
            <div key={s.label} className="bg-[#1A2A3D] rounded-xl p-3 border border-white/5 text-center">
              <p className="text-xl font-black text-[#F4A261]">{s.value}</p>
              <p className="text-[#8B9BB4] text-xs mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Search + Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search your notes..."
            className="flex-1 bg-[#1A2A3D] border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-[#8B9BB4] text-sm outline-none focus:border-[#F4A261]/50"
          />
          <div className="flex gap-2">
            {NOTE_TYPES.map(t => (
              <button key={t.id} onClick={() => setActiveType(t.id)}
                className={`px-3 py-2 rounded-full text-xs font-medium transition-all whitespace-nowrap ${activeType === t.id ? 'bg-[#F4A261] text-white' : 'bg-[#1A2A3D] border border-white/10 text-[#8B9BB4] hover:text-white'}`}>
                {t.emoji} {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Starred Notes */}
        {starred.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#F4A261] mb-3">⭐ Starred</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
              {starred.map((note: any) => <NoteCard key={note.id} note={note} onStar={() => toggleStar.mutate(note.id)} />)}
            </div>
          </div>
        )}

        {/* All Notes */}
        <div>
          <h2 className="text-xs font-bold uppercase tracking-widest text-[#8B9BB4] mb-3">
            {search ? `🔍 Results (${filtered.length})` : 'All Notes'}
          </h2>
          {unstarred.length === 0 && starred.length === 0 ? (
            <div className="text-center py-20 text-[#8B9BB4]">
              <div className="text-5xl mb-4">📝</div>
              <p>No notes yet. Start capturing wisdom from books!</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
              {unstarred.map((note: any) => <NoteCard key={note.id} note={note} onStar={() => toggleStar.mutate(note.id)} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function NoteCard({ note, onStar }: { note: any; onStar: () => void }) {
  const TYPE_ICONS: Record<string, string> = { NOTE: '📝', HIGHLIGHT: '🖊️', QUOTE: '💬', INSIGHT: '💡' };
  return (
    <div className="bg-[#1A2A3D] rounded-xl p-4 border border-white/10 hover:border-[#F4A261]/20 transition-colors group">
      <div className="flex items-start justify-between mb-2">
        <span className="text-xs">{TYPE_ICONS[note.type] ?? '📝'}</span>
        <button onClick={onStar} className="opacity-0 group-hover:opacity-100 transition-opacity text-sm">
          {note.isStarred ? '⭐' : '☆'}
        </button>
      </div>
      <p className="text-white text-sm leading-relaxed line-clamp-4 mb-3">{note.content}</p>
      <div className="flex items-center justify-between">
        {note.book && <p className="text-[#F4A261] text-xs truncate">{note.book.title}</p>}
        <p className="text-[#8B9BB4] text-xs ml-auto">{new Date(note.createdAt).toLocaleDateString()}</p>
      </div>
      {note.tags?.length > 0 && (
        <div className="flex gap-1 mt-2 flex-wrap">
          {note.tags.slice(0, 3).map((t: string) => (
            <span key={t} className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/5 text-[#8B9BB4]">#{t}</span>
          ))}
        </div>
      )}
    </div>
  );
}
