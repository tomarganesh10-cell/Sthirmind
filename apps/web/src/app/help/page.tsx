'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import Link from 'next/link';
import { useState } from 'react';

export default function HelpPage() {
  const qc = useQueryClient();
  const [form, setForm] = useState({ organization: '', hours: 2, cause: '', date: new Date().toISOString().slice(0, 10) });
  const [showForm, setShowForm] = useState(false);

  const { data: impact } = useQuery({ queryKey: ['impact'], queryFn: () => api.get('/help/impact').then(r => r.data) });
  const { data: volunteer } = useQuery({ queryKey: ['volunteer'], queryFn: () => api.get('/help/volunteer').then(r => r.data) });
  const { data: challenges } = useQuery({ queryKey: ['challenges'], queryFn: () => api.get('/help/challenges').then(r => r.data) });

  const logVolunteer = useMutation({
    mutationFn: (data: any) => api.post('/help/volunteer', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['volunteer', 'impact'] }); setShowForm(false); },
  });

  const joinChallenge = useMutation({
    mutationFn: (id: string) => api.post(`/help/challenges/${id}/join`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['challenges'] }),
  });

  return (
    <div className="min-h-screen bg-[#0D1B2A] pt-6 px-4 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard" className="text-[#8B9BB4] hover:text-white text-sm">← Dashboard</Link>
        <span className="text-[#8B9BB4]">/</span>
        <span className="text-[#7B2D8B] font-bold">🤝 Help</span>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-extrabold mb-1">Help Pillar <span className="text-[#7B2D8B]">20%</span></h1>
        <p className="text-[#8B9BB4]">Contribution, service, and creating positive impact</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Volunteer Hours', value: impact?.totalHours?.toFixed(1) ?? '0', emoji: '⏱️' },
          { label: 'Impact Score', value: impact?.impactScore?.toFixed(0) ?? '0', emoji: '🌟' },
          { label: 'Activities', value: volunteer?.length ?? 0, emoji: '🎯' },
        ].map(s => (
          <div key={s.label} className="bg-[#1A2A3D] border border-white/10 rounded-xl p-4 text-center">
            <div className="text-2xl mb-1">{s.emoji}</div>
            <div className="text-2xl font-black text-[#7B2D8B]">{s.value}</div>
            <div className="text-xs text-[#8B9BB4]">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold">Volunteer Activities</h3>
            <button onClick={() => setShowForm(!showForm)} className="bg-[#7B2D8B] text-white font-bold px-3 py-1.5 rounded-lg text-xs">+ Log Activity</button>
          </div>

          {showForm && (
            <div className="bg-[#1A2A3D] border border-white/10 rounded-xl p-4 mb-4 space-y-3">
              <input value={form.organization} onChange={e => setForm(p=>({...p, organization: e.target.value}))} placeholder="Organization / cause name" className="w-full bg-[#243447] border border-white/10 rounded-xl p-3 text-white text-sm outline-none" />
              <input value={form.cause} onChange={e => setForm(p=>({...p, cause: e.target.value}))} placeholder="Cause (education, environment...)" className="w-full bg-[#243447] border border-white/10 rounded-xl p-3 text-white text-sm outline-none" />
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-xs text-[#8B9BB4] block mb-1">Hours: {form.hours}</label>
                  <input type="range" min={0.5} max={24} step={0.5} value={form.hours} onChange={e => setForm(p=>({...p, hours: +e.target.value}))} className="w-full" style={{accentColor:'#7B2D8B'}} />
                </div>
                <input type="date" value={form.date} onChange={e => setForm(p=>({...p, date: e.target.value}))} className="bg-[#243447] border border-white/10 rounded-xl p-2 text-white text-xs outline-none" />
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={() => setShowForm(false)} className="bg-[#243447] border border-white/10 text-white px-3 py-1.5 rounded-lg text-xs">Cancel</button>
                <button onClick={() => logVolunteer.mutate({...form, date: new Date(form.date)})} className="bg-[#7B2D8B] text-white font-bold px-4 py-1.5 rounded-lg text-xs">Save</button>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {volunteer?.map((v: any) => (
              <div key={v.id} className="bg-[#1A2A3D] border border-white/10 rounded-xl p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-semibold text-sm">{v.organization}</div>
                    {v.cause && <div className="text-xs text-[#8B9BB4]">{v.cause}</div>}
                  </div>
                  <div className="text-right">
                    <div className="text-[#7B2D8B] font-bold">{v.hours}h</div>
                    <div className="text-xs text-[#8B9BB4]">{new Date(v.date).toLocaleDateString()}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="font-semibold mb-4">Active Challenges</h3>
          <div className="space-y-3">
            {challenges?.map((c: any) => (
              <div key={c.id} className="bg-[#1A2A3D] border border-white/10 rounded-xl p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="font-semibold text-sm">{c.emoji} {c.title}</div>
                    <div className="text-xs text-[#8B9BB4]">{c._count?.participants ?? 0} participants · {c.rewardXp} XP</div>
                  </div>
                  <button onClick={() => joinChallenge.mutate(c.id)} className="bg-[#7B2D8B] text-white font-bold px-3 py-1 rounded-lg text-xs">Join</button>
                </div>
                {c.description && <p className="text-xs text-[#8B9BB4]">{c.description}</p>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
