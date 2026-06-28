'use client';

interface WisdomStatsData {
  stats?: {
    totalBooks?: number;
    booksRead?: number;
    totalListeningHours?: number;
    notesCreated?: number;
  };
  scores?: {
    wisdomScore?: number;
    knowledgeScore?: number;
    consistencyScore?: number;
    breakdown?: {
      dailyWisdomStreak?: number;
    };
  };
}

export function WisdomStats({ stats }: { stats: WisdomStatsData }) {
  const s = stats?.stats ?? {};
  const sc = stats?.scores ?? {};

  const items = [
    { label: 'Wisdom Score', value: sc.wisdomScore ?? 0, suffix: '/100', highlight: true },
    { label: 'Books Read', value: s.booksRead ?? 0, suffix: '' },
    { label: 'Listening Hours', value: s.totalListeningHours ?? 0, suffix: 'h' },
    { label: 'Daily Streak', value: sc.breakdown?.dailyWisdomStreak ?? 0, suffix: 'd' },
    { label: 'Notes Created', value: s.notesCreated ?? 0, suffix: '' },
  ];

  return (
    <div className="grid grid-cols-3 md:grid-cols-5 gap-3 mb-8">
      {items.map(item => (
        <div key={item.label} className={`rounded-xl p-3 text-center border ${item.highlight ? 'bg-[#F4A261]/10 border-[#F4A261]/30' : 'bg-[#1A2A3D] border-white/5'}`}>
          <p className={`text-xl font-black ${item.highlight ? 'text-[#F4A261]' : 'text-white'}`}>
            {item.value}{item.suffix}
          </p>
          <p className="text-[#8B9BB4] text-[10px] mt-0.5">{item.label}</p>
        </div>
      ))}
    </div>
  );
}
