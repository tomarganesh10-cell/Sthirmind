'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

interface AudioPlayerProps {
  audioUrl: string;
  durationSec: number;
  title: string;
  voice: string;
  voiceName?: string;
  voiceStyle?: string;
  onComplete?: () => void;
  onProgress?: (sec: number) => void;
}

const SPEEDS = [0.75, 1.0, 1.25, 1.5, 1.75, 2.0];
const BAR_COUNT = 48;

export function AudioPlayer({ audioUrl, durationSec, title, voice, voiceName, voiceStyle, onComplete, onProgress }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const animRef = useRef<number>(0);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [speed, setSpeed] = useState(1.0);
  const [volume, setVolume] = useState(1.0);
  const [bars, setBars] = useState<number[]>(Array(BAR_COUNT).fill(0.15));
  const [loaded, setLoaded] = useState(false);

  // Animate waveform bars when playing
  const animateBars = useCallback(() => {
    if (!audioRef.current?.paused) {
      setBars(prev => prev.map((_, i) => {
        const wave = Math.sin(Date.now() / 180 + i * 0.45) * 0.3
                   + Math.sin(Date.now() / 90  + i * 0.9) * 0.2
                   + Math.random() * 0.1;
        return Math.max(0.08, Math.min(1, 0.35 + wave));
      }));
      animRef.current = requestAnimationFrame(animateBars);
    } else {
      setBars(Array(BAR_COUNT).fill(0.15));
    }
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      onProgress?.(Math.floor(audio.currentTime));
    };
    const onEnded = () => { setPlaying(false); cancelAnimationFrame(animRef.current); setBars(Array(BAR_COUNT).fill(0.15)); onComplete?.(); };
    const onCanPlay = () => setLoaded(true);

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('canplaythrough', onCanPlay);
    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('canplaythrough', onCanPlay);
      cancelAnimationFrame(animRef.current);
    };
  }, [onComplete, onProgress]);

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
      cancelAnimationFrame(animRef.current);
      setBars(Array(BAR_COUNT).fill(0.15));
    } else {
      audio.play();
      setPlaying(true);
      animRef.current = requestAnimationFrame(animateBars);
    }
  };

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    audio.currentTime = pct * (durationSec || audio.duration || 0);
  };

  const setPlaybackSpeed = (s: number) => {
    setSpeed(s);
    if (audioRef.current) audioRef.current.playbackRate = s;
  };

  const setAudioVolume = (v: number) => {
    setVolume(v);
    if (audioRef.current) audioRef.current.volume = v;
  };

  const skip = (sec: number) => {
    if (audioRef.current) audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime + sec);
  };

  const fmt = (sec: number) => `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, '0')}`;
  const totalDur = durationSec || (audioRef.current?.duration ?? 0);
  const progress = totalDur > 0 ? currentTime / totalDur : 0;

  const voiceEmoji: Record<string, string> = { male: '🎙️', female: '✨', mentor: '🧭', founder: '🚀', meditation: '🧘' };

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-[#0D1B2A] via-[#1A2A3D] to-[#0D2240] rounded-2xl border border-white/10 shadow-2xl">
      {/* Ambient glow behind waveform */}
      <div className={`absolute inset-0 transition-opacity duration-1000 ${playing ? 'opacity-100' : 'opacity-0'}`}
        style={{ background: 'radial-gradient(ellipse 60% 40% at 50% 60%, rgba(244,162,97,0.08) 0%, transparent 70%)' }} />

      <audio ref={audioRef} src={audioUrl} preload="auto" />

      <div className="relative p-6">
        {/* Voice badge */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#F4A261]/30 to-[#7B2D8B]/30 border border-[#F4A261]/30 flex items-center justify-center text-base">
              {voiceEmoji[voice] ?? '🎤'}
            </div>
            <div>
              <p className="text-white text-sm font-semibold leading-tight">{voiceName ?? voice}</p>
              <p className="text-[#8B9BB4] text-xs leading-tight capitalize">{voiceStyle ?? `${voice} voice`}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full transition-all duration-300 ${playing ? 'bg-green-400 shadow-[0_0_6px_#4ade80]' : 'bg-white/20'}`} />
            <span className="text-[#8B9BB4] text-xs">{playing ? 'Playing' : loaded ? 'Ready' : 'Loading...'}</span>
          </div>
        </div>

        {/* Title */}
        <p className="text-white/80 text-xs font-medium truncate mb-4 pl-1">{title}</p>

        {/* Waveform visualizer */}
        <div className="flex items-center justify-center gap-[2px] h-12 mb-4 cursor-pointer px-1" onClick={seek}>
          {bars.map((h, i) => {
            const isPast = i / BAR_COUNT <= progress;
            return (
              <div key={i}
                className="w-[3px] rounded-full transition-all"
                style={{
                  height: `${h * 100}%`,
                  background: isPast
                    ? `rgba(244,162,97,${0.7 + h * 0.3})`
                    : `rgba(139,155,180,${0.2 + h * 0.15})`,
                  transform: playing ? `scaleY(${0.8 + h * 0.4})` : 'scaleY(1)',
                  transition: playing ? 'height 60ms ease, background 60ms ease' : 'all 200ms ease',
                }}
              />
            );
          })}
        </div>

        {/* Progress bar */}
        <div className="mb-4 cursor-pointer group" onClick={seek}>
          <div className="h-1.5 bg-white/10 rounded-full relative overflow-hidden">
            <div className="h-full bg-gradient-to-r from-[#F4A261] to-[#E8895A] rounded-full transition-all duration-100 relative"
              style={{ width: `${progress * 100}%` }}>
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
          <div className="flex justify-between mt-1.5">
            <span className="text-[#8B9BB4] text-xs tabular-nums">{fmt(currentTime)}</span>
            <span className="text-[#8B9BB4] text-xs tabular-nums">{fmt(totalDur)}</span>
          </div>
        </div>

        {/* Main controls */}
        <div className="flex items-center justify-center gap-4 mb-5">
          <button onClick={() => skip(-15)}
            className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-[#8B9BB4] hover:text-white transition-all text-xs font-bold">
            ↩15
          </button>
          <button onClick={toggle}
            className="w-14 h-14 rounded-full bg-[#F4A261] hover:bg-[#E8895A] flex items-center justify-center text-white shadow-[0_0_20px_rgba(244,162,97,0.4)] hover:shadow-[0_0_30px_rgba(244,162,97,0.6)] transition-all active:scale-95 text-xl">
            {playing ? '⏸' : '▶'}
          </button>
          <button onClick={() => skip(15)}
            className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-[#8B9BB4] hover:text-white transition-all text-xs font-bold">
            15↪
          </button>
        </div>

        {/* Speed + Volume */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1 flex-wrap">
            {SPEEDS.map(s => (
              <button key={s} onClick={() => setPlaybackSpeed(s)}
                className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-all ${
                  speed === s
                    ? 'bg-[#F4A261] text-white shadow-sm'
                    : 'text-[#8B9BB4] hover:text-white hover:bg-white/5'
                }`}>
                {s}x
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-[#8B9BB4] text-sm">{volume === 0 ? '🔇' : volume < 0.5 ? '🔉' : '🔊'}</span>
            <input type="range" min={0} max={1} step={0.05} value={volume}
              onChange={e => setAudioVolume(Number(e.target.value))}
              className="w-20 accent-[#F4A261] cursor-pointer" />
          </div>
        </div>
      </div>
    </div>
  );
}
