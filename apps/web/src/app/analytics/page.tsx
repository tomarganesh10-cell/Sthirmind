'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import Link from 'next/link';
import dynamic from 'next/dynamic';

const Chart = dynamic(() => import('@/components/analytics/Charts'), { ssr: false });

export default function AnalyticsPage() {
  const { data: pillarData } = useQuery({ queryKey: ['pillarBreakdown'], queryFn: () => api.get('/analytics/pillars?days=30').then(r => r.data) });
  const { data: dashboard } = useQuery({ queryKey: ['analyticsDashboard'], queryFn: () => api.get('/analytics/dashboard').then(r => r.data) });

  const stats = [
    { label: 'Avg Happiness (30d)', value: dashboard?.scores?.length ? (dashboard.scores.reduce((a:number,b:any)=>a+b.totalScore,0)/dashboard.scores.length).toFixed(1) : '--', color: '#F4A261', emoji: '😊' },
    { label: 'Check-in Streak', value: dashboard?.scores?.length ?? 0, suffix: ' days 🔥', color: '#52B788', emoji: '✅' },
    { label: 'Active Goals', value: dashboard?.goals?.length ?? 0, color: '#457B9D', emoji: '🎯' },
    { label: 'Active Habits', value: dashboard?.habits?.length ?? 0, color: '#7B2D8B', emoji: '⚡' },
  ];

  return (
    <div className="min-h-screen bg-[#0D1B2A] pt-6 px-4 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard" className="text-[#8B9BB4] hover:text-white text-sm">← Dashboard</Link>
        <span className="text-[#8B9BB4]">/</span>
        <span className="text-[#F4A261] font-bold">📊 Analytics</span>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-extrabold mb-1">Life Analytics</h1>
        <p className="text-[#8B9BB4]">Deep insights into your happiness patterns and growth</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {stats.map(s => (
          <div key={s.label} className="bg-[#1A2A3D] border border-white/10 rounded-xl p-4">
            <div className="text-2xl mb-2">{s.emoji}</div>
            <div className="text-2xl font-black" style={{ color: s.color }}>{s.value}{s.suffix ?? ''}</div>
            <div className="text-xs text-[#8B9BB4] mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <Chart data={pillarData} scores={dashboard?.scores} />
    </div>
  );
}
