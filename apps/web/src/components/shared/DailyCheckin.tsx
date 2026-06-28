'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Zap } from 'lucide-react';
import { api } from '@/lib/api/client';

const MOODS = ['😔', '😕', '😐', '🙂', '😊', '😄', '🤩'];
const PILLARS = [
  { key: 'heart',  emoji: '❤️',  label: 'Heart' },
  { key: 'hope',   emoji: '🌟', label: 'Hope' },
  { key: 'health', emoji: '💪', label: 'Health' },
  { key: 'help',   emoji: '🤝', label: 'Help' },
] as const;

interface Props {
  onComplete: () => void;
}

export function DailyCheckin({ onComplete }: Props) {
  const qc = useQueryClient();
  const [step, setStep] = useState<'mood' | 'pillars' | 'gratitude'>('mood');
  const [mood, setMood] = useState(4);
  const [energy, setEnergy] = useState(6);
  const [pillarRatings, setPillarRatings] = useState({ heart: 5, hope: 5, health: 5, help: 5 });
  const [gratitude, setGratitude] = useState(['', '', '']);

  const checkinMutation = useMutation({
    mutationFn: () => api.post('/happiness/checkin', { mood, energy, pillarRatings, gratitude: gratitude.filter(Boolean) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['dashboard-overview'] });
      qc.invalidateQueries({ queryKey: ['habits-today'] });
      onComplete();
    },
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="gradient-navy rounded-2xl p-6 text-white"
    >
      <div className="flex items-center gap-2 mb-4">
        <Zap size={18} className="text-[var(--gold)]" />
        <h2 className="font-bold text-lg">Daily 5H Check-in</h2>
        <span className="ml-auto text-xs opacity-60">
          {step === 'mood' ? '1/3' : step === 'pillars' ? '2/3' : '3/3'}
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1 bg-white/20 rounded-full mb-6">
        <motion.div
          className="h-full bg-[var(--gold)] rounded-full"
          animate={{ width: step === 'mood' ? '33%' : step === 'pillars' ? '66%' : '100%' }}
        />
      </div>

      {/* Step 1: Mood */}
      {step === 'mood' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <p className="text-sm opacity-80 mb-4">How are you feeling right now?</p>
          <div className="flex justify-between mb-6">
            {MOODS.map((emoji, i) => (
              <button
                key={i}
                onClick={() => setMood(i + 1)}
                className={`text-2xl transition-all ${mood === i + 1 ? 'scale-125' : 'opacity-50 hover:opacity-80'}`}
              >
                {emoji}
              </button>
            ))}
          </div>
          <p className="text-sm opacity-80 mb-2">Energy level: {energy}/10</p>
          <input
            type="range" min={1} max={10} value={energy}
            onChange={e => setEnergy(Number(e.target.value))}
            className="w-full accent-[#F4A261]"
          />
          <button
            onClick={() => setStep('pillars')}
            className="mt-6 w-full py-3 bg-[var(--gold)] text-[var(--navy)] rounded-xl font-bold hover:opacity-90 transition-opacity"
          >
            Continue →
          </button>
        </motion.div>
      )}

      {/* Step 2: Pillar ratings */}
      {step === 'pillars' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <p className="text-sm opacity-80 mb-4">Rate each area of your life today (1–10)</p>
          <div className="space-y-4">
            {PILLARS.map(p => (
              <div key={p.key}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm">{p.emoji} {p.label}</span>
                  <span className="text-sm font-bold text-[var(--gold)]">{pillarRatings[p.key]}</span>
                </div>
                <input
                  type="range" min={1} max={10}
                  value={pillarRatings[p.key]}
                  onChange={e => setPillarRatings(prev => ({ ...prev, [p.key]: Number(e.target.value) }))}
                  className="w-full accent-[#F4A261]"
                />
              </div>
            ))}
          </div>
          <div className="flex gap-3 mt-6">
            <button onClick={() => setStep('mood')} className="flex-1 py-3 bg-white/10 rounded-xl font-medium hover:bg-white/20 transition-colors">← Back</button>
            <button onClick={() => setStep('gratitude')} className="flex-2 py-3 px-6 bg-[var(--gold)] text-[var(--navy)] rounded-xl font-bold hover:opacity-90 transition-opacity">Continue →</button>
          </div>
        </motion.div>
      )}

      {/* Step 3: Gratitude */}
      {step === 'gratitude' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <p className="text-sm opacity-80 mb-4">Name 3 things you're grateful for today 🙏</p>
          <div className="space-y-3">
            {gratitude.map((g, i) => (
              <input
                key={i}
                value={g}
                onChange={e => setGratitude(prev => { const n = [...prev]; n[i] = e.target.value; return n; })}
                placeholder={`Grateful for #${i + 1}…`}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-sm placeholder:opacity-50 outline-none focus:border-[var(--gold)] transition-colors"
              />
            ))}
          </div>
          <div className="flex gap-3 mt-6">
            <button onClick={() => setStep('pillars')} className="flex-1 py-3 bg-white/10 rounded-xl font-medium hover:bg-white/20 transition-colors">← Back</button>
            <button
              onClick={() => checkinMutation.mutate()}
              disabled={checkinMutation.isPending}
              className="flex-2 py-3 px-6 bg-[var(--gold)] text-[var(--navy)] rounded-xl font-bold hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              {checkinMutation.isPending ? 'Saving…' : 'Complete ✓'}
            </button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
