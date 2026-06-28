'use client';

import { useUser, UserProfile } from '@clerk/nextjs';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import Link from 'next/link';

export default function ProfilePage() {
  const { user } = useUser();
  const { data: stats } = useQuery({ queryKey: ['userStats'], queryFn: () => api.get('/users/stats').then(r => r.data) });
  const { data: xp } = useQuery({ queryKey: ['userXp'], queryFn: () => api.get('/users/me').then(r => r.data?.xp) });

  const level = xp?.level ?? 1;
  const totalXp = xp?.totalXp ?? 0;
  const nextLevelXp = level * 1000;
  const progress = Math.min(100, (totalXp % 1000) / 10);

  return (
    <div className="min-h-screen bg-[#0D1B2A] pt-6 px-4 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard" className="text-[#8B9BB4] hover:text-white text-sm">← Dashboard</Link>
        <span className="text-[#8B9BB4]">/</span>
        <span className="text-[#F4A261] font-bold">Profile</span>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <div className="bg-[#1A2A3D] border border-white/10 rounded-2xl p-6 text-center mb-4">
            <div className="w-20 h-20 rounded-full mx-auto mb-3 bg-gradient-to-br from-[#F4A261] to-[#E63946] grid place-items-center text-3xl font-bold text-white overflow-hidden">
              {user?.imageUrl ? <img src={user.imageUrl} alt="" className="w-full h-full object-cover" /> : user?.firstName?.[0]}
            </div>
            <h2 className="font-bold text-lg">{user?.firstName} {user?.lastName}</h2>
            <p className="text-[#8B9BB4] text-sm">{user?.emailAddresses[0]?.emailAddress}</p>

            <div className="mt-4">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-[#F4A261] font-bold">Level {level}</span>
                <span className="text-[#8B9BB4]">{totalXp} XP</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-[#F4A261] to-[#E63946] rounded-full" style={{ width: `${progress}%` }} />
              </div>
              <div className="text-xs text-[#8B9BB4] mt-1">{nextLevelXp - (totalXp % 1000)} XP to Level {level+1}</div>
            </div>
          </div>

          <div className="bg-[#1A2A3D] border border-white/10 rounded-2xl p-5">
            <h3 className="font-semibold text-sm mb-4">Life Stats</h3>
            {[
              ['Active Goals', stats?.activeGoals ?? 0, '🎯'],
              ['Active Habits', stats?.activeHabits ?? 0, '⚡'],
              ['Journal Entries', stats?.journalEntries ?? 0, '📖'],
              ['Check-in Streak', `${stats?.checkInStreak ?? 0} 🔥`, '✅'],
            ].map(([l, v, e]) => (
              <div key={l as string} className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
                <span className="text-xs text-[#8B9BB4]">{e} {l}</span>
                <span className="font-bold text-sm text-[#F4A261]">{v}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="md:col-span-2">
          <div className="bg-[#1A2A3D] border border-white/10 rounded-2xl p-6">
            <h3 className="font-semibold mb-4">Account Settings</h3>
            <UserProfile
              appearance={{
                elements: {
                  rootBox: 'w-full',
                  card: 'bg-transparent shadow-none border-0 p-0',
                  navbar: 'hidden',
                  pageScrollBox: 'p-0',
                },
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
