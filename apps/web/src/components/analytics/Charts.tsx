'use client';

import { useEffect, useRef } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler, RadialLinearScale } from 'chart.js';
import { Line, Radar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler, RadialLinearScale);

const PILLAR_COLORS = { heart: '#E63946', hope: '#457B9D', health: '#52B788', help: '#7B2D8B' };

export default function Charts({ data, scores }: { data?: any[]; scores?: any[] }) {
  const lineData = {
    labels: data?.map(d => new Date(d.date).toLocaleDateString('en', { month: 'short', day: 'numeric' })) ?? [],
    datasets: [
      { label: '❤️ Heart', data: data?.map(d => d.heart) ?? [], borderColor: PILLAR_COLORS.heart, tension: 0.4, fill: false, pointRadius: 0 },
      { label: '🌟 Hope', data: data?.map(d => d.hope) ?? [], borderColor: PILLAR_COLORS.hope, tension: 0.4, fill: false, pointRadius: 0 },
      { label: '💪 Health', data: data?.map(d => d.health) ?? [], borderColor: PILLAR_COLORS.health, tension: 0.4, fill: false, pointRadius: 0 },
      { label: '🤝 Help', data: data?.map(d => d.help) ?? [], borderColor: PILLAR_COLORS.help, tension: 0.4, fill: false, pointRadius: 0 },
    ],
  };

  const totalLine = {
    labels: scores?.map((s:any) => new Date(s.date).toLocaleDateString('en', { month: 'short', day: 'numeric' })).reverse() ?? [],
    datasets: [{
      label: 'Happiness Score',
      data: scores?.map((s:any) => s.totalScore).reverse() ?? [],
      borderColor: '#F4A261',
      backgroundColor: 'rgba(244,162,97,0.1)',
      tension: 0.4,
      fill: true,
      pointBackgroundColor: '#F4A261',
      pointRadius: 3,
    }],
  };

  const chartOpts: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { labels: { color: '#8B9BB4', boxWidth: 12 } } },
    scales: {
      x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#8B9BB4', maxTicksLimit: 10 } },
      y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#8B9BB4' }, min: 0, max: 100 },
    },
  };

  const latest = scores?.[0];
  const radarData = {
    labels: ['❤️ Heart', '🌟 Hope', '💪 Health', '🤝 Help'],
    datasets: [{
      label: 'Your Scores',
      data: latest ? [latest.heartScore, latest.hopeScore, latest.healthScore, latest.helpScore] : [60, 65, 70, 75],
      backgroundColor: 'rgba(244,162,97,0.2)',
      borderColor: '#F4A261',
      pointBackgroundColor: '#F4A261',
    }],
  };

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-[#1A2A3D] border border-white/10 rounded-2xl p-5">
          <h3 className="font-semibold text-sm mb-4">Happiness Score Trend (30 days)</h3>
          <div style={{ height: 220 }}><Line data={totalLine} options={chartOpts} /></div>
        </div>
        <div className="bg-[#1A2A3D] border border-white/10 rounded-2xl p-5">
          <h3 className="font-semibold text-sm mb-4">Current Pillar Balance</h3>
          <div style={{ height: 220 }}>
            <Radar data={radarData} options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { display: false } },
              scales: { r: {
                grid: { color: 'rgba(255,255,255,0.08)' },
                ticks: { color: '#8B9BB4', backdropColor: 'transparent' },
                pointLabels: { color: '#E8F0FE', font: { size: 12 } },
                min: 0, max: 100,
              }},
            }} />
          </div>
        </div>
      </div>
      <div className="bg-[#1A2A3D] border border-white/10 rounded-2xl p-5">
        <h3 className="font-semibold text-sm mb-4">30-Day Pillar Breakdown</h3>
        <div style={{ height: 240 }}><Line data={lineData} options={chartOpts} /></div>
      </div>
    </div>
  );
}
