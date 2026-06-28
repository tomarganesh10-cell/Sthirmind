'use client';

import Link from 'next/link';

interface Goal {
  id: string;
  title: string;
  pillar: string;
  progress: number;
  targetDate?: string;
  status: string;
}

const PILLAR_COLORS: Record<string, string> = {
  HEART: '#E91E63',
  HOPE: '#F4A261',
  HEALTH: '#4CAF50',
  HELP: '#2196F3',
};

export function GoalProgress({ goals = [] }: { goals: Goal[] }) {
  const active = goals.filter(g => g.status === 'ACTIVE').slice(0, 3);

  if (!active.length) {
    return (
      <div className="text-center py-6 text-[#8B9BB4] text-sm">
        No active goals. <Link href="/hope" className="text-[#F4A261] hover:underline">Set a goal →</Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {active.map(goal => {
        const color = PILLAR_COLORS[goal.pillar] ?? '#F4A261';
        const pct = Math.min(100, Math.max(0, goal.progress ?? 0));
        return (
          <Link key={goal.id} href="/hope" className="block group">
            <div className="bg-[#1A2A3D] rounded-xl p-3 border border-white/5 hover:border-[#F4A261]/20 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <p className="text-white text-xs font-semibold line-clamp-1 flex-1 mr-2">{goal.title}</p>
                <span className="text-xs font-bold flex-shrink-0" style={{ color }}>{pct}%</span>
              </div>
              <div className="h-1.5 bg-white/10 rounded-full">
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
              </div>
              {goal.targetDate && (
                <p className="text-[#8B9BB4] text-[10px] mt-1.5">
                  Target: {new Date(goal.targetDate).toLocaleDateString()}
                </p>
              )}
            </div>
          </Link>
        );
      })}
      {goals.length > 3 && (
        <Link href="/hope" className="block text-center text-xs text-[#F4A261] hover:underline pt-1">
          +{goals.length - 3} more goals →
        </Link>
      )}
    </div>
  );
}
