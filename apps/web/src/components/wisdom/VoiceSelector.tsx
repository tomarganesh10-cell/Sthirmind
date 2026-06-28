'use client';

interface Voice {
  id: string;
  label: string;
  name: string;
  style: string;
  emoji: string;
  description: string;
  color: string;
}

const VOICES: Voice[] = [
  {
    id: 'female',
    label: 'Warm Guide',
    name: 'Rachel',
    style: 'warm & clear',
    emoji: '✨',
    description: 'Friendly, clear narration — feels like a wise friend explaining ideas to you.',
    color: '#E91E8C',
  },
  {
    id: 'male',
    label: 'Deep Narrator',
    name: 'Adam',
    style: 'deep & authoritative',
    emoji: '🎙️',
    description: 'Rich, deep voice with authority — like a BBC documentary narrator.',
    color: '#2196F3',
  },
  {
    id: 'mentor',
    label: 'Wise Elder',
    name: 'Dorothy',
    style: 'wise & storytelling',
    emoji: '🧭',
    description: 'Measured, storytelling cadence — like a mentor sharing hard-earned wisdom.',
    color: '#F4A261',
  },
  {
    id: 'founder',
    label: 'Founder Energy',
    name: 'Antoni',
    style: 'confident & energetic',
    emoji: '🚀',
    description: 'Crisp, energetic delivery — startup energy that keeps you locked in.',
    color: '#7B2D8B',
  },
  {
    id: 'meditation',
    label: 'Calm Presence',
    name: 'Elli',
    style: 'calm & meditative',
    emoji: '🧘',
    description: 'Ultra-slow, soothing voice — like a mindfulness teacher guiding you inward.',
    color: '#4CAF50',
  },
];

interface VoiceSelectorProps {
  value: string;
  onChange: (id: string) => void;
}

export function VoiceSelector({ value, onChange }: VoiceSelectorProps) {
  const selected = VOICES.find(v => v.id === value) ?? VOICES[2];

  return (
    <div className="space-y-3">
      <p className="text-[#8B9BB4] text-xs uppercase tracking-widest font-semibold">Choose a Voice</p>

      <div className="grid grid-cols-1 gap-2">
        {VOICES.map(voice => {
          const active = voice.id === value;
          return (
            <button
              key={voice.id}
              onClick={() => onChange(voice.id)}
              className={`w-full text-left p-3.5 rounded-xl border transition-all duration-200 group ${
                active
                  ? 'border-transparent shadow-lg'
                  : 'border-white/10 bg-white/5 hover:bg-white/8 hover:border-white/20'
              }`}
              style={active ? { background: `linear-gradient(135deg, ${voice.color}18, ${voice.color}08)`, borderColor: `${voice.color}50` } : {}}
            >
              <div className="flex items-center gap-3">
                {/* Emoji with glow */}
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 transition-transform group-hover:scale-105"
                  style={{ background: active ? `${voice.color}25` : 'rgba(255,255,255,0.05)' }}>
                  {voice.emoji}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-white font-semibold text-sm">{voice.label}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                      style={active
                        ? { background: `${voice.color}25`, color: voice.color }
                        : { background: 'rgba(255,255,255,0.05)', color: '#8B9BB4' }}>
                      {voice.name}
                    </span>
                  </div>
                  <p className="text-[#8B9BB4] text-xs leading-relaxed">{voice.description}</p>
                </div>

                {/* Active indicator */}
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                  active ? 'border-transparent' : 'border-white/20'
                }`} style={active ? { background: voice.color } : {}}>
                  {active && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>
              </div>

              {/* Style tag */}
              {active && (
                <div className="mt-2.5 ml-13 pl-[52px]">
                  <div className="flex items-center gap-1.5">
                    <div className="h-px flex-1 opacity-20" style={{ background: voice.color }} />
                    <span className="text-[10px] uppercase tracking-widest font-medium" style={{ color: voice.color }}>
                      {voice.style}
                    </span>
                    <div className="h-px flex-1 opacity-20" style={{ background: voice.color }} />
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* ElevenLabs badge */}
      <div className="flex items-center gap-2 pt-1">
        <div className="h-px flex-1 bg-white/5" />
        <span className="text-[10px] text-[#8B9BB4]/60 uppercase tracking-widest">Powered by ElevenLabs AI</span>
        <div className="h-px flex-1 bg-white/5" />
      </div>
    </div>
  );
}

export { VOICES };
