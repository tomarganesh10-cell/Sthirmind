'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

interface AudioPlayerProps {
  audioUrl: string;
  durationSec: number;
  title: string;
  onComplete?: () => void;
  onProgress?: (sec: number) => void;
}

const SPEEDS = [0.75, 1.0, 1.25, 1.5, 1.75, 2.0];
const BAR_COUNT = 52;

export function AudioPlayer({ audioUrl, durationSec, title, onComplete, onProgress }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const animRef = useRef<number>(0);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [speed, setSpeed] = useState(1.0);
  const [volume, setVolume] = useState(1.0);
  const [bars, setBars] = useState<number[]>(Array(BAR_COUNT).fill(0.15));
  const [loaded, setLoaded] = useState(false);

  const animateBars = useCallback(() => {
    if (!audioRef.current?.paused) {
      setBars(prev => prev.map((_, i) => {
        const h = Math.sin(Date.now() / 170 + i * 0.42) * 0.28
                + Math.sin(Date.now() / 85  + i * 0.88) * 0.18
                + Math.random() * 0.08;
        return Math.max(0.06, Math.min(1, 0.32 + h));
      }));
      animRef.current = requestAnimationFrame(animateBars);
    } else {
      setBars(Array(BAR_COUNT).fill(0.15));
    }
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTimeUpdate = () => { setCurrentTime(audio.currentTime); onProgress?.(Math.floor(audio.currentTime)); };
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
    if (playing) { audio.pause(); setPlaying(false); cancelAnimationFrame(animRef.current); setBars(Array(BAR_COUNT).fill(0.15)); }
    else { audio.play(); setPlaying(true); animRef.current = requestAnimationFrame(animateBars); }
  };

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    const rect = e.currentTarget.getBoundingClientRect();
    audio.currentTime = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)) * (durationSec || audio.duration || 0);
  };

  const skip = (sec: number) => { if (audioRef.current) audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime + sec); };
  const setPlaybackSpeed = (s: number) => { setSpeed(s); if (audioRef.current) audioRef.current.playbackRate = s; };
  const setAudioVolume = (v: number) => { setVolume(v); if (audioRef.current) audioRef.current.volume = v; };

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  const totalDur = durationSec || (audioRef.current?.duration ?? 0);
  const progress = totalDur > 0 ? currentTime / totalDur : 0;

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-[#0D1B2A] via-[#1A2A3D] to-[#0D2240] rounded-2xl border border-white/10 shadow-2xl">
      {/* Playing glow */}
      <div className={`absolute inset-0 pointer-events-none transition-opacity duration-1000 ${playing ? 'opacity-100' : 'opacity-0'}`}
        style={{ background: 'radial-gradient(ellipse 70% 50% at 50% 70%, rgba(244,162,97,0.07) 0%, transparent 70%)' }} />

      <audio ref={audioRef} src={audioUrl} preload="auto" />

      <div className="relative p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-lg transition-all ${playing ? 'bg-[#F4A261]/20 shadow-[0_0_12px_rgba(244,162,97,0.3)]' : 'bg-white/5'}`}>
              🎙️
            </div>
            <div>
              <p className="text-white text-sm font-semibold leading-tight">Rachel</p>
              <p className="text-[#8B9BB4] text-xs leading-tight">Human AI · ElevenLabs</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full transition-all duration-300 ${playing ? 'bg-green-400 shadow-[0_0_8px_#4ade80]' : loaded ? 'bg-white/30' : 'bg-white/10'}`} />
            <span className="text-[#8B9BB4] text-xs">{playing ? 'Playing' : loaded ? 'Ready' : 'Loading…'}</span>
          </div>
        </div>

        {/* Title */}
        <p className="text-white/60 text-xs truncate mb-5 px-1">{title}</p>

        {/* Waveform */}
        <div className="flex items-center justify-center gap-[2px] h-14 mb-4 cursor-pointer select-none" onClick={seek}>
          {bars.map((h, i) => {
            const past = i / BAR_COUNT <= progress;
            return (
              <div key={i} className="w-[3px] rounded-full"
                style={{
                  height: `${Math.round(h * 100)}%`,
                  background: past
                    ? `rgba(244,162,97,${0.65 + h * 0.35})`
                    : `rgba(139,155,180,${0.15 + h * 0.12})`,
                  transition: playing ? 'height 55ms ease' : 'all 300ms ease',
                }} />
            );
          })}
        </div>

        {/* Progress */}
        <div className="mb-5 cursor-pointer group" onClick={seek}>
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-[#F4A261] to-[#E8895A] rounded-full transition-all duration-100"
              style={{ width: `${progress * 100}%` }} />
          </div>
          <div className="flex justify-between mt-1.5">
            <span className="text-[#8B9BB4] text-xs tabular-nums">{fmt(currentTime)}</span>
            <span className="text-[#8B9BB4] text-xs tabular-nums">{fmt(totalDur)}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-5 mb-5">
          <button onClick={() => skip(-15)}
            className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-[#8B9BB4] hover:text-white transition-all text-[11px] font-bold">
            ↩15
          </button>
          <button onClick={toggle}
            className="w-16 h-16 rounded-full bg-[#F4A261] hover:bg-[#E8895A] flex items-center justify-center text-white text-2xl shadow-[0_0_24px_rgba(244,162,97,0.45)] hover:shadow-[0_0_36px_rgba(244,162,97,0.65)] transition-all active:scale-95">
            {playing ? '⏸' : '▶'}
          </button>
          <button onClick={() => skip(15)}
            className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-[#8B9BB4] hover:text-white transition-all text-[11px] font-bold">
            15↪
          </button>
        </div>

        {/* Speed + Volume */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-1">
            {SPEEDS.map(s => (
              <button key={s} onClick={() => setPlaybackSpeed(s)}
                className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-all ${speed === s ? 'bg-[#F4A261] text-white' : 'text-[#8B9BB4] hover:text-white hover:bg-white/5'}`}>
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
