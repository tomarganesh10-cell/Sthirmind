'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import Link from 'next/link';

const RELATIONSHIP_TYPES = ['Partner', 'Family', 'Friend', 'Colleague', 'Mentor'];

export default function HeartPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<'journal' | 'relationships' | 'gratitude'>('journal');
  const [journalContent, setJournalContent] = useState('');
  const [gratItems, setGratItems] = useState(['', '', '']);
  const [showNewRelForm, setShowNewRelForm] = useState(false);
  const [newRel, setNewRel] = useState({ name: '', type: 'Friend', closeness: 7 });

  const { data: journal } = useQuery({ queryKey: ['journal'], queryFn: () => api.get('/heart/journal').then(r => r.data) });
  const { data: relationships } = useQuery({ queryKey: ['relationships'], queryFn: () => api.get('/heart/relationships').then(r => r.data) });
  const { data: gratitude } = useQuery({ queryKey: ['gratitude'], queryFn: () => api.get('/heart/gratitude').then(r => r.data) });

  const addJournal = useMutation({
    mutationFn: (content: string) => api.post('/heart/journal', { content }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['journal'] }); setJournalContent(''); },
  });

  const addGratitude = useMutation({
    mutationFn: (items: string[]) => api.post('/heart/gratitude', { items }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['gratitude'] }); setGratItems(['', '', '']); },
  });

  const addRelationship = useMutation({
    mutationFn: (data: any) => api.post('/heart/relationships', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['relationships'] }); setShowNewRelForm(false); },
  });

  return (
    <div className="min-h-screen bg-[#0D1B2A] pt-6 px-4 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard" className="text-[#8B9BB4] hover:text-white text-sm">← Dashboard</Link>
        <span className="text-[#8B9BB4]">/</span>
        <span className="text-[#E63946] font-bold">❤️ Heart</span>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-extrabold mb-1">Heart Pillar <span className="text-[#E63946]">28%</span></h1>
        <p className="text-[#8B9BB4]">Relationships, emotional depth, and love</p>
      </div>

      <div className="flex gap-2 mb-6 border-b border-white/10 pb-0">
        {(['journal', 'relationships', 'gratitude'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 capitalize text-sm font-medium border-b-2 transition-all ${tab === t ? 'border-[#E63946] text-white' : 'border-transparent text-[#8B9BB4]'}`}>
            {t === 'journal' ? '📖 Journal' : t === 'relationships' ? '💞 Connections' : '🙏 Gratitude'}
          </button>
        ))}
      </div>

      {tab === 'journal' && (
        <div>
          <div className="bg-[#1A2A3D] border border-white/10 rounded-2xl p-6 mb-6">
            <h3 className="font-semibold mb-3">Today's Entry</h3>
            <textarea value={journalContent} onChange={e => setJournalContent(e.target.value)} placeholder="What's on your heart today? Write freely..." rows={5} className="w-full bg-[#243447] border border-white/10 rounded-xl p-4 text-white resize-none outline-none focus:border-[#E63946]/40 text-sm leading-relaxed" />
            <div className="flex justify-end mt-3">
              <button onClick={() => addJournal.mutate(journalContent)} disabled={!journalContent.trim() || addJournal.isPending} className="bg-[#E63946] text-white font-bold px-6 py-2 rounded-xl text-sm disabled:opacity-50">
                {addJournal.isPending ? 'Saving...' : 'Save Entry ✨'}
              </button>
            </div>
          </div>
          <div className="space-y-4">
            {journal?.items?.map((e: any) => (
              <div key={e.id} className="bg-[#1A2A3D] border border-white/10 rounded-xl p-5">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs text-[#8B9BB4]">{new Date(e.createdAt).toLocaleDateString()}</span>
                  {e.mood && <span className="text-lg">{['😔','😰','😐','🙂','😊','😄','🤩'][e.mood-1]}</span>}
                </div>
                <p className="text-sm text-[#E8F0FE] leading-relaxed">{e.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'relationships' && (
        <div>
          <div className="flex justify-end mb-4">
            <button onClick={() => setShowNewRelForm(!showNewRelForm)} className="bg-[#E63946] text-white font-bold px-4 py-2 rounded-xl text-sm">+ Add Connection</button>
          </div>
          {showNewRelForm && (
            <div className="bg-[#1A2A3D] border border-white/10 rounded-2xl p-6 mb-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-[#8B9BB4] mb-1 block">Name</label>
                  <input value={newRel.name} onChange={e => setNewRel(p => ({...p, name: e.target.value}))} className="w-full bg-[#243447] border border-white/10 rounded-xl p-3 text-white text-sm outline-none" />
                </div>
                <div>
                  <label className="text-xs text-[#8B9BB4] mb-1 block">Type</label>
                  <select value={newRel.type} onChange={e => setNewRel(p => ({...p, type: e.target.value}))} className="w-full bg-[#243447] border border-white/10 rounded-xl p-3 text-white text-sm outline-none">
                    {RELATIONSHIP_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div className="mt-4">
                <label className="text-xs text-[#8B9BB4] mb-1 block">Closeness: {newRel.closeness}/10</label>
                <input type="range" min={1} max={10} value={newRel.closeness} onChange={e => setNewRel(p => ({...p, closeness: +e.target.value}))} className="w-full" style={{accentColor:'#E63946'}} />
              </div>
              <div className="flex justify-end gap-3 mt-4">
                <button onClick={() => setShowNewRelForm(false)} className="bg-[#243447] border border-white/10 text-white px-4 py-2 rounded-xl text-sm">Cancel</button>
                <button onClick={() => addRelationship.mutate(newRel)} className="bg-[#E63946] text-white font-bold px-6 py-2 rounded-xl text-sm">Save</button>
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            {relationships?.map((r: any) => (
              <div key={r.id} className="bg-[#1A2A3D] border border-white/10 rounded-xl p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-[#E63946] grid place-items-center font-bold text-white">{r.name.charAt(0)}</div>
                  <div>
                    <div className="font-semibold">{r.name}</div>
                    <div className="text-xs text-[#8B9BB4]">{r.type}</div>
                  </div>
                </div>
                <div className="text-xs text-[#8B9BB4]">Closeness: <span className="text-[#E63946] font-bold">{r.closeness}/10</span></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'gratitude' && (
        <div>
          <div className="bg-[#1A2A3D] border border-white/10 rounded-2xl p-6 mb-6">
            <h3 className="font-semibold mb-4">3 Things I'm Grateful For 🙏</h3>
            {gratItems.map((item, i) => (
              <input key={i} value={item} onChange={e => { const n=[...gratItems]; n[i]=e.target.value; setGratItems(n); }} placeholder={`I'm grateful for...`} className="w-full bg-[#243447] border border-white/10 rounded-xl p-3 text-white text-sm outline-none focus:border-[#E63946]/40 mb-3" />
            ))}
            <button onClick={() => addGratitude.mutate(gratItems.filter(Boolean))} disabled={!gratItems.some(Boolean)} className="bg-[#E63946] text-white font-bold px-6 py-2 rounded-xl text-sm disabled:opacity-50">Save Gratitude ✨</button>
          </div>
          <div className="space-y-3">
            {gratitude?.map((g: any) => (
              <div key={g.id} className="bg-[#1A2A3D] border border-white/10 rounded-xl p-4">
                <div className="text-xs text-[#8B9BB4] mb-2">{new Date(g.createdAt).toLocaleDateString()}</div>
                <div className="space-y-1">{g.items.map((item: string, i: number) => <div key={i} className="text-sm">🙏 {item}</div>)}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
