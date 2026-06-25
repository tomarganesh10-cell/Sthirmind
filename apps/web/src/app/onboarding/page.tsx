'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { api } from '@/lib/api/client';

const steps = ['Welcome', 'About You', 'Focus Area', 'Assessment', 'Your Formula'];

const pillars = [
  { id: 'HEART', emoji: '❤️', label: 'Heart', desc: 'Deepen relationships & love' },
  { id: 'HOPE', emoji: '🌟', label: 'Hope', desc: 'Achieve goals & find purpose' },
  { id: 'HEALTH', emoji: '💪', label: 'Health', desc: 'Optimize body & mind' },
  { id: 'HELP', emoji: '🤝', label: 'Help', desc: 'Contribute & create impact' },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { user } = useUser();
  const [step, setStep] = useState(0);
  const [primaryPillar, setPrimaryPillar] = useState('');
  const [occupation, setOccupation] = useState('');
  const [bio, setBio] = useState('');
  const [scores, setScores] = useState({ heart: 50, hope: 50, health: 50, help: 50 });
  const [loading, setLoading] = useState(false);

  const happinessScore = Math.round(
    0.28 * scores.heart + 0.25 * scores.hope + 0.27 * scores.health + 0.20 * scores.help
  );

  const finish = async () => {
    setLoading(true);
    try {
      await api.patch('/users/profile', { primaryPillar, occupation, bio, onboardingDone: true });
      await api.post('/happiness/checkin', {
        heartScore: scores.heart, hopeScore: scores.hope,
        healthScore: scores.health, helpScore: scores.help,
      });
      router.push('/dashboard');
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0D1B2A] flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Progress */}
        <div className="flex gap-2 mb-8">
          {steps.map((_, i) => (
            <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= step ? 'bg-[#F4A261]' : 'bg-white/10'}`} />
          ))}
        </div>

        <div className="bg-[#1A2A3D] border border-white/8 rounded-2xl p-8">
          {step === 0 && (
            <div className="text-center">
              <div className="text-6xl mb-4">💎</div>
              <h1 className="text-3xl font-extrabold text-[#F4A261] mb-2">Welcome to SthirMind</h1>
              <p className="text-[#8B9BB4] mb-6">The world's most advanced AI-Powered Human Operating System. Let's calibrate your personal Happiness OS.</p>
              <p className="text-sm text-[#8B9BB4] mb-8">Hey {user?.firstName}! 5 minutes to set up your life.</p>
              <button onClick={() => setStep(1)} className="bg-gradient-to-r from-[#F4A261] to-[#e8834a] text-white font-bold px-8 py-3 rounded-xl">Begin Journey →</button>
            </div>
          )}

          {step === 1 && (
            <div>
              <h2 className="text-xl font-bold mb-6">Tell us about yourself</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-[#8B9BB4] block mb-2">What do you do?</label>
                  <input value={occupation} onChange={e => setOccupation(e.target.value)} placeholder="Entrepreneur, Developer, Artist..." className="w-full bg-[#243447] border border-white/10 rounded-xl p-3 text-white outline-none focus:border-[#F4A261]/50" />
                </div>
                <div>
                  <label className="text-sm text-[#8B9BB4] block mb-2">Bio (optional)</label>
                  <textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="What drives you..." rows={3} className="w-full bg-[#243447] border border-white/10 rounded-xl p-3 text-white outline-none focus:border-[#F4A261]/50 resize-none" />
                </div>
              </div>
              <div className="flex gap-3 mt-6 justify-end">
                <button onClick={() => setStep(2)} className="bg-gradient-to-r from-[#F4A261] to-[#e8834a] text-white font-bold px-6 py-3 rounded-xl">Continue →</button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="text-xl font-bold mb-2">What's your primary focus?</h2>
              <p className="text-[#8B9BB4] text-sm mb-6">We'll personalize your AI coaches for this pillar</p>
              <div className="grid grid-cols-2 gap-3">
                {pillars.map(p => (
                  <button key={p.id} onClick={() => setPrimaryPillar(p.id)} className={`p-4 rounded-xl border-2 text-left transition-all ${primaryPillar === p.id ? 'border-[#F4A261] bg-[#F4A261]/10' : 'border-white/10 bg-[#243447]'}`}>
                    <div className="text-2xl mb-2">{p.emoji}</div>
                    <div className="font-bold">{p.label}</div>
                    <div className="text-xs text-[#8B9BB4]">{p.desc}</div>
                  </button>
                ))}
              </div>
              <div className="flex gap-3 mt-6 justify-end">
                <button onClick={() => setStep(1)} className="bg-[#243447] border border-white/10 text-white px-4 py-3 rounded-xl">← Back</button>
                <button onClick={() => setStep(3)} className="bg-gradient-to-r from-[#F4A261] to-[#e8834a] text-white font-bold px-6 py-3 rounded-xl">Continue →</button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 className="text-xl font-bold mb-2">Initial Assessment</h2>
              <p className="text-[#8B9BB4] text-sm mb-6">Rate yourself honestly — this calibrates your baseline</p>
              <div className="space-y-5">
                {([['heart','❤️ Heart','#E63946'],['hope','🌟 Hope','#457B9D'],['health','💪 Health','#52B788'],['help','🤝 Help','#7B2D8B']] as const).map(([key, label, color]) => (
                  <div key={key}>
                    <div className="flex justify-between text-sm mb-2">
                      <span>{label}</span>
                      <span style={{ color }} className="font-bold">{scores[key]}</span>
                    </div>
                    <input type="range" min={0} max={100} value={scores[key]}
                      onChange={e => setScores(prev => ({ ...prev, [key]: +e.target.value }))}
                      className="w-full" style={{ accentColor: color }} />
                  </div>
                ))}
              </div>
              <div className="flex gap-3 mt-6 justify-end">
                <button onClick={() => setStep(2)} className="bg-[#243447] border border-white/10 text-white px-4 py-3 rounded-xl">← Back</button>
                <button onClick={() => setStep(4)} className="bg-gradient-to-r from-[#F4A261] to-[#e8834a] text-white font-bold px-6 py-3 rounded-xl">See My Score →</button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="text-center">
              <h2 className="text-xl font-bold mb-2">Your Happiness Formula</h2>
              <div className="bg-[#243447] rounded-xl p-4 my-4 font-mono text-sm text-[#F4A261]">
                H = 0.28×{scores.heart} + 0.25×{scores.hope} + 0.27×{scores.health} + 0.20×{scores.help}
              </div>
              <div className="text-6xl font-black text-[#F4A261] my-6">{happinessScore}</div>
              <div className="text-[#8B9BB4] mb-6">
                {happinessScore >= 80 ? '🚀 Thriving' : happinessScore >= 60 ? '🌱 Flourishing' : happinessScore >= 40 ? '🌿 Developing' : '🌱 Struggling'}
              </div>
              <p className="text-sm text-[#8B9BB4] mb-8">Your AI coaches are calibrated. Let's start your journey to a higher Happiness Score!</p>
              <button onClick={finish} disabled={loading} className="bg-gradient-to-r from-[#F4A261] to-[#e8834a] text-white font-bold px-8 py-4 rounded-xl text-lg disabled:opacity-50">
                {loading ? 'Setting up...' : 'Enter My OS →'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
