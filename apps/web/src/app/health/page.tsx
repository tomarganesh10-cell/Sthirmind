'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import Link from 'next/link';

export default function HealthPage() {
  const qc = useQueryClient();
  const [logData, setLogData] = useState({ sleepHours: 7, sleepQuality: 7, stressLevel: 5, energyLevel: 6, exerciseMin: 30, waterMl: 1500, stepsCount: 8000 });

  const { data: habits } = useQuery({ queryKey: ['habits'], queryFn: () => api.get('/health/habits').then(r => r.data) });
  const { data: history } = useQuery({ queryKey: ['healthHistory'], queryFn: () => api.get('/health/log?days=7').then(r => r.data) });

  const logToday = useMutation({
    mutationFn: (data: any) => api.post('/health/log', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['healthHistory'] }),
  });

  const logHabit = useMutation({
    mutationFn: (id: string) => api.post(`/health/habits/${id}/log`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['habits'] }),
  });

  const metrics = [
    { key: 'sleepHours', emoji: '😴', label: 'Sleep Hours', min: 0, max: 12, step: 0.5, unit: 'h' },
    { key: 'sleepQuality', emoji: '⭐', label: 'Sleep Quality', min: 1, max: 10, step: 1, unit: '/10' },
    { key: 'stressLevel', emoji: '😤', label: 'Stress Level', min: 1, max: 10, step: 1, unit: '/10' },
    { key: 'energyLevel', emoji: '⚡', label: 'Energy Level', min: 1, max: 10, step: 1, unit: '/10' },
    { key: 'exerciseMin', emoji: '🏃', label: 'Exercise', min: 0, max: 180, step: 5, unit: 'min' },
    { key: 'waterMl', emoji: '💧', label: 'Water', min: 0, max: 4000, step: 100, unit: 'ml' },
  ];

  return (
    <div className="min-h-screen bg-[#0D1B2A] pt-6 px-4 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard" className="text-[#8B9BB4] hover:text-white text-sm">← Dashboard</Link>
        <span className="text-[#8B9BB4]">/</span>
        <span className="text-[#52B788] font-bold">💪 Health</span>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-extrabold mb-1">Health Pillar <span className="text-[#52B788]">27%</span></h1>
        <p className="text-[#8B9BB4]">Body optimization, habits, and mental wellness</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#1A2A3D] border border-white/10 rounded-2xl p-6">
          <h3 className="font-semibold mb-4">Today's Health Log</h3>
          <div className="space-y-4">
            {metrics.map(m => (
              <div key={m.key}>
                <div className="flex justify-between text-sm mb-1">
                  <span>{m.emoji} {m.label}</span>
                  <span className="text-[#52B788] font-bold">{(logData as any)[m.key]}{m.unit}</span>
                </div>
                <input type="range" min={m.min} max={m.max} step={m.step} value={(logData as any)[m.key]}
                  onChange={e => setLogData(p => ({ ...p, [m.key]: +e.target.value }))}
                  className="w-full" style={{ accentColor: '#52B788' }} />
              </div>
            ))}
          </div>
          <button onClick={() => logToday.mutate(logData)} disabled={logToday.isPending} className="w-full mt-4 bg-[#52B788] text-white font-bold py-3 rounded-xl text-sm disabled:opacity-50">
            {logToday.isPending ? 'Saving...' : 'Save Health Log ✨'}
          </button>
        </div>

        <div>
          <div className="bg-[#1A2A3D] border border-white/10 rounded-2xl p-6 mb-4">
            <h3 className="font-semibold mb-4">Habits ({habits?.length ?? 0} active)</h3>
            <div className="space-y-3">
              {habits?.map((h: any) => (
                <div key={h.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span>{h.emoji}</span>
                    <div>
                      <div className="text-sm font-medium">{h.title}</div>
                      <div className="text-xs text-[#8B9BB4]">🔥 {h.streak} day streak</div>
                    </div>
                  </div>
                  <button onClick={() => logHabit.mutate(h.id)}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${h.logs?.length > 0 ? 'bg-[#52B788] border-[#52B788] text-white' : 'border-white/30 hover:border-[#52B788]'}`}>
                    {h.logs?.length > 0 ? '✓' : ''}
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#1A2A3D] border border-white/10 rounded-2xl p-6">
            <h3 className="font-semibold mb-4">7-Day Overview</h3>
            <div className="space-y-2">
              {history?.slice(0, 7).map((h: any) => (
                <div key={h.id} className="flex items-center justify-between text-sm">
                  <span className="text-[#8B9BB4]">{new Date(h.date).toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                  <div className="flex gap-4 text-xs">
                    {h.sleepHours && <span>😴 {h.sleepHours}h</span>}
                    {h.exerciseMin && <span>🏃 {h.exerciseMin}m</span>}
                    {h.stressLevel && <span>😤 {h.stressLevel}/10</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
