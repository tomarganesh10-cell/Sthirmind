'use client';

import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api/client';

export default function WisdomAnalyticsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['wisdom-analytics'],
    queryFn: () => api.get('/wisdom/analytics').then(r => r.data),
  });

  const syncMutation = useMutation({
    mutationFn: () => api.post('/wisdom/analytics/sync').then(r => r.data),
  });

  const scores = data?.scores;
  const stats = data?.stats;
  const history: any[] = data?.history ?? [];

  const ScoreRing = ({ value, label, color }: { value: number; label: string; color: string }) => {
    const r = 36;
    const circ = 2 * Math.PI * r;
    const dash = (value / 100) * circ;
    return (
      <div className="flex flex-col items-center">
        <svg width={90} height={90} viewBox="0 0 90 90">
          <circle cx={45} cy={45} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={8} />
          <circle cx={45} cy={45} r={r} fill="none" stroke={color} strokeWidth={8}
            strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
            transform="rotate(-90 45 45)" />
          <text x={45} y={50} textAnchor="middle" fill="white" fontSize={16} fontWeight="bold">{value}</text>
        </svg>
        <p className="text-[#8B9BB4] text-xs mt-1">{label}</p>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#0D1B2A] pt-16">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-white mb-1">📊 Wisdom Analytics</h1>
            <p className="text-[#8B9BB4]">Track your learning journey and knowledge growth</p>
          </div>
          <button onClick={() => syncMutation.mutate()} disabled={syncMutation.isPending}
            className="bg-[#1A2A3D] border border-white/10 text-white text-sm font-bold px-4 py-2 rounded-xl hover:border-[#F4A261]/30 transition-colors disabled:opacity-60">
            {syncMutation.isPending ? '⚙️ Syncing...' : '↻ Sync'}
          </button>
        </div>

        {isLoading ? (
          <div className="text-center py-20 text-[#8B9BB4]">Loading analytics...</div>
        ) : (
          <>
            {/* Score Rings */}
            {scores && (
              <div className="bg-[#1A2A3D] rounded-2xl border border-white/10 p-6 mb-6">
                <h2 className="text-sm font-bold uppercase tracking-widest text-[#8B9BB4] mb-6">Wisdom Scores (Last 30 Days)</h2>
                <div className="flex justify-around flex-wrap gap-6">
                  <ScoreRing value={scores.wisdomScore ?? 0} label="Wisdom Score" color="#F4A261" />
                  <ScoreRing value={scores.knowledgeScore ?? 0} label="Knowledge" color="#7B2D8B" />
                  <ScoreRing value={scores.consistencyScore ?? 0} label="Consistency" color="#4CAF50" />
                </div>
              </div>
            )}

            {/* Breakdown */}
            {scores?.breakdown && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                {[
                  { label: 'Books Completed', value: scores.breakdown.booksCompleted ?? 0, icon: '📚' },
                  { label: 'Listening Minutes', value: scores.breakdown.totalListeningMin ?? 0, icon: '🎧' },
                  { label: 'Notes Created', value: scores.breakdown.notesCreated ?? 0, icon: '📝' },
                  { label: 'Chat Sessions', value: scores.breakdown.chatSessions ?? 0, icon: '💬' },
                  { label: 'Daily Wisdom Streak', value: scores.breakdown.dailyWisdomStreak ?? 0, icon: '🔥' },
                  { label: 'Daily Wisdom Opened', value: scores.breakdown.dailyWisdomOpened ?? 0, icon: '☀️' },
                ].map(item => (
                  <div key={item.label} className="bg-[#1A2A3D] rounded-xl p-4 border border-white/5">
                    <div className="flex items-center gap-2 mb-1">
                      <span>{item.icon}</span>
                      <p className="text-[#8B9BB4] text-xs">{item.label}</p>
                    </div>
                    <p className="text-2xl font-black text-white">{item.value}</p>
                  </div>
                ))}
              </div>
            )}

            {/* History Table */}
            {history.length > 0 && (
              <div className="bg-[#1A2A3D] rounded-2xl border border-white/10 p-6">
                <h2 className="text-sm font-bold uppercase tracking-widest text-[#8B9BB4] mb-4">📅 History</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-[#8B9BB4] text-xs border-b border-white/10">
                        <th className="text-left py-2">Date</th>
                        <th className="text-right py-2">Wisdom</th>
                        <th className="text-right py-2">Knowledge</th>
                        <th className="text-right py-2">Consistency</th>
                        <th className="text-right py-2">Minutes</th>
                        <th className="text-right py-2">Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.slice(0, 30).map((entry: any) => (
                        <tr key={entry.id} className="border-b border-white/5 text-white hover:bg-white/5 transition-colors">
                          <td className="py-2 text-[#8B9BB4]">{new Date(entry.date).toLocaleDateString()}</td>
                          <td className="py-2 text-right text-[#F4A261] font-bold">{entry.wisdomScore}</td>
                          <td className="py-2 text-right">{entry.knowledgeScore}</td>
                          <td className="py-2 text-right">{entry.consistencyScore}</td>
                          <td className="py-2 text-right text-[#8B9BB4]">{entry.minutesListened}</td>
                          <td className="py-2 text-right text-[#8B9BB4]">{entry.notesCreated}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
