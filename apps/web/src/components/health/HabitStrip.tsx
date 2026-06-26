'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';

interface Habit {
  id: string;
  name: string;
  emoji: string;
  frequency: string;
  streak: number;
  completedToday?: boolean;
}

export function HabitStrip({ habits = [] }: { habits: Habit[] }) {
  const qc = useQueryClient();

  const logHabit = useMutation({
    mutationFn: (habitId: string) => api.post(`/health/habits/${habitId}/log`).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['health'] }),
  });

  if (!habits.length) {
    return (
      <div className="text-center py-6 text-[#8B9BB4] text-sm">
        No habits yet. <a href="/health" className="text-[#F4A261] hover:underline">Add habits →</a>
      </div>
    );
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
      {habits.map(habit => (
        <button
          key={habit.id}
          onClick={() => !habit.completedToday && logHabit.mutate(habit.id)}
          className={`flex-shrink-0 flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all min-w-[72px] ${
            habit.completedToday
              ? 'bg-[#4CAF50]/10 border-[#4CAF50]/40 opacity-80'
              : 'bg-[#1A2A3D] border-white/10 hover:border-[#F4A261]/40 hover:bg-[#F4A261]/5'
          }`}
        >
          <span className="text-xl">{habit.emoji}</span>
          <span className="text-white text-[10px] font-medium text-center leading-tight line-clamp-1 w-full">{habit.name}</span>
          {habit.streak > 0 && (
            <span className="text-[10px] text-[#F4A261]">🔥 {habit.streak}</span>
          )}
          {habit.completedToday && (
            <span className="text-[10px] text-[#4CAF50] font-bold">✓</span>
          )}
        </button>
      ))}
    </div>
  );
}
