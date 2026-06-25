'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import Link from 'next/link';

const PILLAR_OPTIONS = ['HEART','HOPE','HEALTH','HELP'];

export default function HopePage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', pillar: 'HOPE', targetDate: '', whyStatement: '' });

  const { data: goals } = useQuery({ queryKey: ['goals'], queryFn: () => api.get('/hope/goals').then(r => r.data) });

  const createGoal = useMutation({
    mutationFn: (data: any) => api.post('/hope/goals', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['goals'] }); setShowForm(false); setForm({ title: '', pillar: 'HOPE', targetDate: '', whyStatement: '' }); },
  });

  const updateProgress = useMutation({
    mutationFn: ({ id, progress }: any) => api.patch(`/hope/goals/${id}/progress`, { progress }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['goals'] }),
  });

  const completeMilestone = useMutation({
    mutationFn: (id: string) => api.patch(`/hope/milestones/${id}/complete`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['goals'] }),
  });

  const pillarColors: Record<string, string> = { HEART:'#E63946', HOPE:'#457B9D', HEALTH:'#52B788', HELP:'#7B2D8B' };

  return (
    <div className="min-h-screen bg-[#0D1B2A] pt-6 px-4 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard" className="text-[#8B9BB4] hover:text-white text-sm">← Dashboard</Link>
        <span className="text-[#8B9BB4]">/</span>
        <span className="text-[#457B9D] font-bold">🌟 Hope</span>
      </div>

      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-extrabold mb-1">Hope Pillar <span className="text-[#457B9D]">25%</span></h1>
          <p className="text-[#8B9BB4]">Goals, purpose, and future vision</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="bg-[#457B9D] text-white font-bold px-4 py-2 rounded-xl text-sm">+ New Goal</button>
      </div>

      {showForm && (
        <div className="bg-[#1A2A3D] border border-white/10 rounded-2xl p-6 mb-6">
          <h3 className="font-semibold mb-4">Create New Goal</h3>
          <div className="space-y-4">
            <input value={form.title} onChange={e => setForm(p=>({...p, title: e.target.value}))} placeholder="Goal title..." className="w-full bg-[#243447] border border-white/10 rounded-xl p-3 text-white text-sm outline-none" />
            <div className="grid grid-cols-2 gap-4">
              <select value={form.pillar} onChange={e => setForm(p=>({...p, pillar: e.target.value}))} className="bg-[#243447] border border-white/10 rounded-xl p-3 text-white text-sm outline-none">
                {PILLAR_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <input type="date" value={form.targetDate} onChange={e => setForm(p=>({...p, targetDate: e.target.value}))} className="bg-[#243447] border border-white/10 rounded-xl p-3 text-white text-sm outline-none" />
            </div>
            <input value={form.whyStatement} onChange={e => setForm(p=>({...p, whyStatement: e.target.value}))} placeholder="Why does this matter to you?" className="w-full bg-[#243447] border border-white/10 rounded-xl p-3 text-white text-sm outline-none" />
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <button onClick={() => setShowForm(false)} className="bg-[#243447] border border-white/10 text-white px-4 py-2 rounded-xl text-sm">Cancel</button>
            <button onClick={() => createGoal.mutate(form)} disabled={!form.title} className="bg-[#457B9D] text-white font-bold px-6 py-2 rounded-xl text-sm disabled:opacity-50">Create Goal</button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {goals?.map((g: any) => (
          <div key={g.id} className="bg-[#1A2A3D] border border-white/10 rounded-2xl p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-3 h-3 rounded-full" style={{ background: pillarColors[g.pillar] }} />
                  <span className="text-xs text-[#8B9BB4] uppercase">{g.pillar}</span>
                </div>
                <h3 className="font-bold text-lg">{g.title}</h3>
                {g.whyStatement && <p className="text-sm text-[#8B9BB4] mt-1">Why: {g.whyStatement}</p>}
              </div>
              <span className="text-2xl font-black" style={{ color: pillarColors[g.pillar] }}>{Math.round(g.progress)}%</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-4">
              <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${g.progress}%`, background: pillarColors[g.pillar] }} />
            </div>
            <div className="flex gap-2 items-center">
              <input type="range" min={0} max={100} defaultValue={g.progress}
                onMouseUp={e => updateProgress.mutate({ id: g.id, progress: +(e.target as HTMLInputElement).value })}
                className="flex-1" style={{ accentColor: pillarColors[g.pillar] }} />
              <span className="text-xs text-[#8B9BB4]">{g.targetDate ? `Due ${new Date(g.targetDate).toLocaleDateString()}` : 'No deadline'}</span>
            </div>
            {g.milestones?.length > 0 && (
              <div className="mt-4 space-y-2">
                {g.milestones.map((m: any) => (
                  <div key={m.id} className="flex items-center gap-3 text-sm">
                    <button onClick={() => !m.isCompleted && completeMilestone.mutate(m.id)}
                      className={`w-5 h-5 rounded-full border-2 flex-shrink-0 transition-all ${m.isCompleted ? 'bg-[#52B788] border-[#52B788]' : 'border-white/30 hover:border-[#52B788]'}`}>
                      {m.isCompleted && <span className="text-xs text-white w-full grid place-items-center">✓</span>}
                    </button>
                    <span className={m.isCompleted ? 'line-through text-[#8B9BB4]' : ''}>{m.title}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
