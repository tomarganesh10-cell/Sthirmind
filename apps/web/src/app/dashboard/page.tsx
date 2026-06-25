'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Heart, Sparkles, Activity, Users, Trophy, TrendingUp, Zap, ChevronRight } from 'lucide-react';
import { HappinessRing } from '@/components/happiness/HappinessRing';
import { PillarCard } from '@/components/shared/PillarCard';
import { DailyCheckin } from '@/components/shared/DailyCheckin';
import { AiChatBubble } from '@/components/ai/AiChatBubble';
import { HabitStrip } from '@/components/health/HabitStrip';
import { GoalProgress } from '@/components/hope/GoalProgress';
import { InsightCard } from '@/components/shared/InsightCard';
import { api } from '@/lib/api/client';

const PILLARS = [
  { key: 'heart',  label: 'Heart',  icon: Heart,    color: '#E63946', desc: 'Relationships & Emotions' },
  { key: 'hope',   label: 'Hope',   icon: Sparkles, color: '#457B9D', desc: 'Purpose & Vision' },
  { key: 'health', label: 'Health', icon: Activity, color: '#52B788', desc: 'Body & Mind' },
  { key: 'help',   label: 'Help',   icon: Users,    color: '#7B2D8B', desc: 'Impact & Community' },
] as const;

export default function DashboardPage() {
  const [greeting, setGreeting] = useState('');
  const [checkinDone, setCheckinDone] = useState(false);

  const { data: overview } = useQuery({
    queryKey: ['dashboard-overview'],
    queryFn: () => api.get('/happiness/overview'),
  });

  const { data: insights } = useQuery({
    queryKey: ['today-insights'],
    queryFn: () => api.get('/analytics/insights/today'),
  });

  const { data: habits } = useQuery({
    queryKey: ['habits-today'],
    queryFn: () => api.get('/health/habits/today'),
  });

  const { data: goals } = useQuery({
    queryKey: ['goals-active'],
    queryFn: () => api.get('/hope/goals?status=active&limit=3'),
  });

  useEffect(() => {
    const h = new Date().getHours();
    setGreeting(h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening');
  }, []);

  const scores = overview?.data?.scores ?? { heart: 0, hope: 0, health: 0, help: 0, happiness: 0 };
  const user = overview?.data?.user;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-8">

      {/* ── Hero Row ─────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
      >
        <div>
          <p className="text-[var(--muted)] text-sm font-medium">{greeting},</p>
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-[var(--navy)] mt-1">
            {user?.displayName ?? user?.fullName ?? 'Leader'} 🙏
          </h1>
          <p className="text-[var(--muted)] text-sm mt-2">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>

        {/* Happiness Ring */}
        <HappinessRing score={scores.happiness} tier={overview?.data?.tier} />
      </motion.div>

      {/* ── Daily Check-in (if not done) ─────────────────── */}
      <AnimatePresence>
        {!checkinDone && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <DailyCheckin onComplete={() => setCheckinDone(true)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 4 Pillar Cards ───────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {PILLARS.map((p, i) => (
          <motion.div
            key={p.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            <PillarCard
              pillar={p.key}
              label={p.label}
              icon={p.icon}
              color={p.color}
              desc={p.desc}
              score={scores[p.key]}
              href={`/dashboard/${p.key}`}
            />
          </motion.div>
        ))}
      </div>

      {/* ── Main Grid ────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* LEFT: Habits + Goals */}
        <div className="lg:col-span-2 space-y-6">

          {/* Today's Habits */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-[var(--navy)] flex items-center gap-2">
                <Zap size={16} className="text-[var(--gold)]" /> Today's Habits
              </h2>
              <a href="/dashboard/health" className="text-xs text-[var(--hope)] hover:underline flex items-center gap-1">
                See all <ChevronRight size={12} />
              </a>
            </div>
            <HabitStrip habits={habits?.data ?? []} />
          </section>

          {/* Active Goals */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-[var(--navy)] flex items-center gap-2">
                <Trophy size={16} className="text-[var(--gold)]" /> Active Goals
              </h2>
              <a href="/dashboard/hope" className="text-xs text-[var(--hope)] hover:underline flex items-center gap-1">
                See all <ChevronRight size={12} />
              </a>
            </div>
            <div className="space-y-3">
              {(goals?.data ?? []).map((goal: any) => (
                <GoalProgress key={goal.id} goal={goal} />
              ))}
              {(!goals?.data?.length) && (
                <div className="card p-6 text-center text-[var(--muted)] text-sm">
                  No active goals yet.{' '}
                  <a href="/dashboard/hope/goals/new" className="text-[var(--navy)] font-medium hover:underline">
                    Set your first goal →
                  </a>
                </div>
              )}
            </div>
          </section>

          {/* Progress Chart */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp size={16} className="text-[var(--gold)]" />
              <h2 className="font-semibold text-[var(--navy)]">7-Day Happiness Trend</h2>
            </div>
            <WeeklyTrendChart userId={user?.id} />
          </section>
        </div>

        {/* RIGHT: AI Chat + Insights */}
        <div className="space-y-6">
          <AiChatBubble defaultAgent="life_coach" />

          {/* Insights */}
          <section>
            <h2 className="font-semibold text-[var(--navy)] mb-3 flex items-center gap-2">
              <Sparkles size={16} className="text-[var(--gold)]" /> Today's Insights
            </h2>
            <div className="space-y-3">
              {(insights?.data ?? []).slice(0, 3).map((insight: any) => (
                <InsightCard key={insight.id} insight={insight} />
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

// ── Inline weekly trend chart ─────────────────────────────────
function WeeklyTrendChart({ userId }: { userId?: string }) {
  const { data } = useQuery({
    queryKey: ['weekly-trend', userId],
    queryFn: () => api.get('/happiness/trend/7days'),
    enabled: !!userId,
  });

  // Lazy import Chart.js to avoid SSR issues
  const [ChartComponent, setChartComponent] = useState<any>(null);

  useEffect(() => {
    import('react-chartjs-2').then(m => {
      import('chart.js').then(({ Chart, CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip }) => {
        Chart.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip);
        setChartComponent(() => m.Line);
      });
    });
  }, []);

  if (!ChartComponent || !data?.data?.length) {
    return (
      <div className="card p-6 flex items-center justify-center text-[var(--muted)] text-sm h-40">
        Tracking your happiness trend…
      </div>
    );
  }

  const days = data.data;
  const chartData = {
    labels: days.map((d: any) => new Date(d.date).toLocaleDateString('en-IN', { weekday: 'short' })),
    datasets: [
      {
        label: 'Happiness',
        data: days.map((d: any) => d.happinessScore),
        borderColor: '#F4A261',
        backgroundColor: 'rgba(244,162,97,0.12)',
        tension: 0.4,
        fill: true,
        pointRadius: 4,
        pointBackgroundColor: '#F4A261',
      },
    ],
  };

  return (
    <div className="card p-4">
      <ChartComponent
        data={chartData}
        options={{
          responsive: true,
          plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c: any) => `${c.raw}/100` } } },
          scales: {
            y: { min: 0, max: 100, grid: { color: '#F0F4F8' }, ticks: { font: { size: 11 } } },
            x: { grid: { display: false }, ticks: { font: { size: 11 } } },
          },
        }}
      />
    </div>
  );
}
