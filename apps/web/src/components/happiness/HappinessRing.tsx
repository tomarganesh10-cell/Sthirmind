'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface Props {
  score: number;
  tier?: 'struggling' | 'developing' | 'flourishing' | 'thriving';
  size?: number;
  showLabel?: boolean;
}

const TIER_CONFIG = {
  struggling:  { color: '#FC8181', label: 'Building Foundation', emoji: '🌱' },
  developing:  { color: '#ECC94B', label: 'Developing',          emoji: '🌿' },
  flourishing: { color: '#F4A261', label: 'Flourishing',         emoji: '🌸' },
  thriving:    { color: '#52B788', label: 'Thriving',            emoji: '✨' },
};

export function HappinessRing({ score, tier = 'developing', size = 120, showLabel = true }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const config = TIER_CONFIG[tier];
  const r = size / 2 - 12;
  const cx = size / 2;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, size, size);

    // Track ring
    ctx.beginPath();
    ctx.arc(cx, cx, r, 0, Math.PI * 2);
    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 10;
    ctx.stroke();

    // Progress ring (animated via RAF on mount)
    const end = ((score / 100) * Math.PI * 2) - Math.PI / 2;
    const start = -Math.PI / 2;

    const gradient = ctx.createLinearGradient(0, 0, size, size);
    gradient.addColorStop(0, config.color);
    gradient.addColorStop(1, '#F4A261');

    ctx.beginPath();
    ctx.arc(cx, cx, r, start, start + (end - start), false);
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 10;
    ctx.lineCap = 'round';
    ctx.stroke();
  }, [score, size, config.color, r, cx]);

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 20 }}
      className="flex flex-col items-center gap-2"
    >
      <div className="relative" style={{ width: size, height: size }}>
        <canvas ref={canvasRef} width={size} height={size} />
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl">{config.emoji}</span>
          <span className="text-2xl font-black text-[var(--navy)] leading-none">{score}</span>
          <span className="text-xs text-[var(--muted)] font-medium">/ 100</span>
        </div>
      </div>
      {showLabel && (
        <div className="text-center">
          <p className="text-xs font-bold" style={{ color: config.color }}>{config.label}</p>
          <p className="text-xs text-[var(--muted)]">Happiness Score</p>
        </div>
      )}
    </motion.div>
  );
}
