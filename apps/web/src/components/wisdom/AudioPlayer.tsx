'use client';

import { useState, useRef, useEffect } from 'react';

interface AudioPlayerProps {
  audioUrl: string;
  durationSec: number;
  title: string;
  voice: string;
  onComplete?: () => void;
  onProgress?: (sec: number) => void;
}

const SPEEDS = [0.75, 1.0, 1.25, 1.5, 1.75, 2.0];

export function AudioPlayer({ audioUrl, durationSec, title, voice, onComplete, onProgress }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [speed, setSpeed] = useState(1.0);
  const [volume, setVolume] = useState(1.0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      onProgress?.(Math.floor(audio.currentTime));
    };
    const onEnded = () => { setPlaying(false); onComplete?.(); };
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('ended', onEnded);
    return () => { audio.removeEventListener('timeupdate', onTimeUpdate); audio.removeEventListener('ended', onEnded); };
  }, [onComplete, onProgress]);

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) { audio.pause(); setPlaying(false); }
    else { audio.play(); setPlaying(true); }
  };

  const seek = (pct: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = pct * durationSec;
  };

  const setPlaybackSpeed = (s: number) => {
    setSpeed(s);
    if (audioRef.current) audioRef.current.playbackRate = s;
  };

  const setAudioVolume = (v: number) => {
    setVolume(v);
    if (audioRef.current) audioRef.current.volume = v;
  };

  const fmt = (sec: number) => `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, '0')}`;
  const progress = durationSec > 0 ? currentTime / durationSec : 0;

  return (
    <div className="bg-[#1A2A3D] rounded-2xl p-5 border border-white/10">
      <audio ref={audioRef} src={audioUrl} preload="metadata" />

      <div className="flex items-center gap-4 mb-4">
        <button onClick={toggle} className="w-12 h-12 rounded-full bg-[#F4A261] flex items-center justify-center text-white text-xl hover:opacity-90 transition-opacity flex-shrink-0">
          {playing ? '⏸' : '▶'}
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-sm truncate">{title}</p>
          <p className="text-[#8B9BB4] text-xs">{voice} voice</p>
        </div>
        <span className="text-[#8B9BB4] text-xs whitespace-nowrap">{fmt(currentTime)} / {fmt(durationSec)}</span>
      </div>

      {/* Progress bar */}
      <div className="mb-4 cursor-pointer" onClick={e => {
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        seek((e.clientX - rect.left) / rect.width);
      }}>
        <div className="h-2 bg-white/10 rounded-full relative">
          <div className="h-full bg-[#F4A261] rounded-full transition-all" style={{ width: `${progress * 100}%` }} />
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          {SPEEDS.map(s => (
            <button key={s} onClick={() => setPlaybackSpeed(s)}
              className={`text-xs px-2 py-1 rounded-lg transition-colors ${speed === s ? 'bg-[#F4A261] text-white' : 'text-[#8B9BB4] hover:text-white'}`}>
              {s}x
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[#8B9BB4] text-xs">🔊</span>
          <input type="range" min={0} max={1} step={0.1} value={volume}
            onChange={e => setAudioVolume(Number(e.target.value))}
            className="w-20 accent-[#F4A261]" />
        </div>
      </div>
    </div>
  );
}
