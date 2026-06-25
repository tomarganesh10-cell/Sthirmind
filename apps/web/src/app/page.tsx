'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, Heart, Sparkles, Activity, Users, Play, ChevronDown, Star, Quote } from 'lucide-react';

const PILLARS = [
  {
    key: 'heart', emoji: '❤️', label: 'Heart', color: '#E63946',
    dims: ['Relationships', 'Emotional Intelligence', 'Gratitude', 'Self-Awareness', 'Compassion'],
    desc: 'Build deep, meaningful relationships that fuel your growth and fulfillment.',
  },
  {
    key: 'hope', emoji: '🌟', label: 'Hope', color: '#457B9D',
    dims: ['Purpose Discovery', 'Vision Mapping', 'Goal Architecture', 'Career Planning', 'Dream Activation'],
    desc: 'Discover your deepest WHY and build a life strategy aligned with your soul.',
  },
  {
    key: 'health', emoji: '💪', label: 'Health', color: '#52B788',
    dims: ['Sleep Optimization', 'Fitness Planning', 'Nutrition Tracking', 'Stress Management', 'Meditation'],
    desc: 'Build a body and mind that powers your vision with energy and clarity.',
  },
  {
    key: 'help', emoji: '🤝', label: 'Help', color: '#7B2D8B',
    dims: ['Community Impact', 'Mentorship', 'Volunteering', 'Legacy Building', 'Social Contribution'],
    desc: 'Leave a durable legacy through giving, mentoring, and community impact.',
  },
] as const;

const TESTIMONIALS = [
  {
    name: 'Arun Sharma', role: 'CEO, FinTech Startup', avatar: 'AS',
    quote: 'SthirMind helped me see that my drive for success was costing me my health and relationships. The 5H framework gave me language for what I had been missing.',
    score: 78,
  },
  {
    name: 'Priya Nair', role: 'Founder & MD', avatar: 'PN',
    quote: 'After a decade of building companies, I finally have a system for building myself. The AI coach understands my patterns better than any human coach I\'ve had.',
    score: 85,
  },
  {
    name: 'Vikram Malhotra', role: 'EVP, FMCG', avatar: 'VM',
    quote: 'The equanimity practices have transformed how I handle board pressure. My team says I\'m a different leader. My family says I\'m finally present.',
    score: 82,
  },
];

const AGENTS = [
  { icon: '🧘', label: 'Life Coach',    desc: 'Your integrated 5H guide' },
  { icon: '💪', label: 'Health Coach',  desc: 'Body & mind optimization' },
  { icon: '🎯', label: 'Purpose Coach', desc: 'Vision & goal architect' },
  { icon: '❤️', label: 'Relationship',  desc: 'Connections & EQ' },
  { icon: '🏢', label: 'Executive',     desc: 'Leadership & strategy' },
  { icon: '🧠', label: 'Wellness',      desc: 'Mental health support' },
  { icon: '✨', label: 'Happiness',     desc: 'Life fulfillment guide' },
  { icon: '🌿', label: 'Meditation',    desc: 'Daily practice design' },
] as const;

export default function HomePage() {
  const [activePillar, setActivePillar] = useState(0);
  const { scrollYProgress } = useScroll();
  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);

  return (
    <div className="min-h-screen bg-[var(--bg)] overflow-x-hidden">

      {/* ── NAV ─────────────────────────────────────── */}
      <nav className="fixed top-0 inset-x-0 z-50 glass border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl gradient-navy flex items-center justify-center">
              <span className="text-white font-black text-sm">5H</span>
            </div>
            <div>
              <span className="font-serif font-bold text-[var(--navy)] text-lg">SthirMind</span>
              <span className="text-xs text-[var(--muted)] ml-2 hidden sm:inline">Lead With Clarity.</span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-[var(--muted)]">
            <a href="#framework" className="hover:text-[var(--navy)] transition-colors">Framework</a>
            <a href="#agents" className="hover:text-[var(--navy)] transition-colors">AI Agents</a>
            <a href="#testimonials" className="hover:text-[var(--navy)] transition-colors">Stories</a>
            <a href="#pricing" className="hover:text-[var(--navy)] transition-colors">Pricing</a>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/auth/login" className="text-sm font-medium text-[var(--navy)] hover:opacity-80">Sign in</Link>
            <Link
              href="/auth/signup"
              className="px-4 py-2 bg-[var(--navy)] text-white rounded-xl text-sm font-bold hover:opacity-90 transition-opacity"
            >
              Start Free
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ─────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center pt-16">
        {/* Background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 right-0 w-[600px] h-[600px] rounded-full bg-[var(--navy)] opacity-5 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-[var(--gold)] opacity-8 blur-3xl" />
        </div>

        <motion.div
          style={{ opacity: heroOpacity }}
          className="relative max-w-7xl mx-auto px-4 py-24 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center"
        >
          <div>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--gold)] bg-opacity-20 border border-[var(--gold)] border-opacity-30 text-sm font-medium text-[var(--gold)] mb-6">
                <Sparkles size={14} />
                <span>AI-Powered Human Operating System</span>
              </div>

              <h1 className="text-5xl md:text-6xl font-serif font-bold text-[var(--navy)] leading-tight mb-6">
                Lead With{' '}
                <span className="text-[var(--gold)]">Clarity.</span>
                <br />
                Build With{' '}
                <span className="text-[var(--heart)]">Equanimity.</span>
              </h1>

              <p className="text-xl text-[var(--muted)] leading-relaxed mb-8 max-w-xl">
                The world's first AI Life OS built on the{' '}
                <strong className="text-[var(--navy)]">5H Framework</strong> —
                Heart, Hope, Health, Help → <strong>Happiness.</strong>{' '}
                Your personal AI therapist, coach, mentor, and life strategist. In one system.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/auth/signup"
                  className="flex items-center justify-center gap-2 px-8 py-4 bg-[var(--navy)] text-white rounded-2xl text-lg font-bold hover:opacity-90 transition-all hover:shadow-lg"
                >
                  Start Your 5H Journey <ArrowRight size={20} />
                </Link>
                <button className="flex items-center justify-center gap-2 px-8 py-4 border-2 border-[var(--navy)] text-[var(--navy)] rounded-2xl text-lg font-bold hover:bg-[var(--navy)] hover:text-white transition-all">
                  <Play size={18} />
                  Watch Demo
                </button>
              </div>

              <p className="text-sm text-[var(--muted)] mt-4">
                Free forever. No credit card. Join 2,000+ leaders.
              </p>
            </motion.div>
          </div>

          {/* Hero Visual — 5H Diamond */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, type: 'spring' }}
            className="relative flex items-center justify-center"
          >
            <FiveHDiamond />
          </motion.div>
        </motion.div>

        <a href="#framework" className="absolute bottom-8 left-1/2 -translate-x-1/2 text-[var(--muted)] animate-bounce">
          <ChevronDown size={24} />
        </a>
      </section>

      {/* ── 5H FRAMEWORK ────────────────────────────── */}
      <section id="framework" className="py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-serif font-bold text-[var(--navy)] mb-4">The 5H Framework</h2>
            <p className="text-lg text-[var(--muted)] max-w-2xl mx-auto">
              Every great leader knows success without fulfillment is failure.
              The 5H system measures what matters most.
            </p>
          </div>

          {/* Pillar selector */}
          <div className="flex justify-center gap-3 mb-12 flex-wrap">
            {PILLARS.map((p, i) => (
              <button
                key={p.key}
                onClick={() => setActivePillar(i)}
                className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold transition-all ${
                  activePillar === i ? 'text-white shadow-lg scale-105' : 'bg-white text-[var(--muted)] hover:scale-102'
                }`}
                style={activePillar === i ? { background: p.color } : {}}
              >
                <span>{p.emoji}</span>
                <span>{p.label}</span>
              </button>
            ))}
          </div>

          {/* Pillar detail */}
          <motion.div
            key={activePillar}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center"
          >
            <div>
              <h3 className="text-3xl font-serif font-bold text-[var(--navy)] mb-4">
                {PILLARS[activePillar].emoji} {PILLARS[activePillar].label}
              </h3>
              <p className="text-lg text-[var(--muted)] mb-6">{PILLARS[activePillar].desc}</p>
              <div className="space-y-3">
                {PILLARS[activePillar].dims.map(dim => (
                  <div key={dim} className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: PILLARS[activePillar].color }} />
                    <span className="font-medium text-[var(--text)]">{dim}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="card p-8 text-center">
              <div
                className="w-20 h-20 rounded-3xl flex items-center justify-center text-4xl mx-auto mb-4"
                style={{ background: `${PILLARS[activePillar].color}18` }}
              >
                {PILLARS[activePillar].emoji}
              </div>
              <div className="text-6xl font-black mb-2" style={{ color: PILLARS[activePillar].color }}>
                {activePillar === 0 ? 78 : activePillar === 1 ? 72 : activePillar === 2 ? 81 : 65}
              </div>
              <p className="text-[var(--muted)] text-sm mb-6">Sample {PILLARS[activePillar].label} Score</p>

              <div className="space-y-2 text-left">
                {PILLARS[activePillar].dims.slice(0, 3).map((dim, i) => {
                  const vals = [[85, 72, 68], [80, 65, 78], [88, 75, 72], [60, 55, 70]];
                  return (
                    <div key={dim}>
                      <div className="flex justify-between text-xs text-[var(--muted)] mb-1">
                        <span>{dim}</span>
                        <span>{vals[activePillar][i]}%</span>
                      </div>
                      <div className="h-1.5 bg-[var(--border)] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${vals[activePillar][i]}%`, background: PILLARS[activePillar].color }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── AI AGENTS ───────────────────────────────── */}
      <section id="agents" className="py-24 px-4 bg-[var(--navy)]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-serif font-bold text-white mb-4">15 Specialized AI Agents</h2>
            <p className="text-lg text-white/60 max-w-2xl mx-auto">
              Every aspect of your human growth has a dedicated AI expert —
              trained on the 5H framework and your personal context.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {AGENTS.map((a, i) => (
              <motion.div
                key={a.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="glass rounded-2xl p-5 text-center hover:scale-105 transition-transform cursor-pointer"
                style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}
              >
                <div className="text-3xl mb-3">{a.icon}</div>
                <p className="font-bold text-white text-sm">{a.label}</p>
                <p className="text-xs text-white/50 mt-1">{a.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ────────────────────────────── */}
      <section id="testimonials" className="py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-serif font-bold text-[var(--navy)] mb-4">Leaders Transforming</h2>
            <p className="text-lg text-[var(--muted)]">Real stories from the 5H community</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {TESTIMONIALS.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="card p-8"
              >
                <div className="flex justify-between items-start mb-4">
                  <Quote size={24} className="text-[var(--gold)] opacity-60" />
                  <div className="text-right">
                    <div className="text-2xl font-black text-[var(--gold)]">{t.score}</div>
                    <div className="text-xs text-[var(--muted)]">Happiness Score</div>
                  </div>
                </div>
                <p className="text-[var(--text)] leading-relaxed mb-6 italic">"{t.quote}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full gradient-navy flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="font-bold text-sm text-[var(--navy)]">{t.name}</p>
                    <p className="text-xs text-[var(--muted)]">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ─────────────────────────────────── */}
      <section id="pricing" className="py-24 px-4 bg-[var(--bg)]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-serif font-bold text-[var(--navy)] mb-4">Simple, Honest Pricing</h2>
            <p className="text-lg text-[var(--muted)]">Start free. Scale as you grow.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: 'Explorer', price: 0, period: 'forever', color: '#718096',
                features: ['5H Assessment', 'Basic Dashboard', 'Daily Check-in', '1 AI Agent (Life Coach)', 'Community Access'],
                cta: 'Start Free',
              },
              {
                name: 'Leader', price: 49, period: '/month', color: '#457B9D', popular: true,
                features: ['Everything in Explorer', 'All 8 AI Agents', 'Unlimited AI Coaching', 'Full Analytics', 'Voice Journaling', 'Goal & Habit System', 'Weekly AI Report'],
                cta: 'Start Trial',
              },
              {
                name: 'Executive', price: 199, period: '/month', color: '#1B3A6B',
                features: ['Everything in Leader', 'Executive Coach Agent', 'Corporate Pilot Access', '1:1 Human Coaching (2h/month)', 'Team Dashboard', 'Priority Support', 'Retreat Access'],
                cta: 'Book Demo',
              },
            ].map((plan, i) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`card p-8 relative ${plan.popular ? 'ring-2 ring-[var(--hope)] scale-105' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[var(--hope)] text-white text-xs font-bold px-3 py-1 rounded-full">
                    Most Popular
                  </div>
                )}
                <h3 className="text-xl font-bold text-[var(--navy)] mb-2">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-4xl font-black" style={{ color: plan.color }}>
                    {plan.price === 0 ? 'Free' : `$${plan.price}`}
                  </span>
                  {plan.price > 0 && <span className="text-[var(--muted)] text-sm">{plan.period}</span>}
                </div>
                <ul className="space-y-2 mb-8">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm text-[var(--text)]">
                      <span className="text-[var(--ok)] font-bold">✓</span> {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/auth/signup"
                  className="block text-center py-3 rounded-xl font-bold transition-all hover:opacity-90"
                  style={{ background: plan.color, color: 'white' }}
                >
                  {plan.cta}
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────── */}
      <section className="py-24 px-4 gradient-navy text-white text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto"
        >
          <div className="text-5xl mb-6">🧘</div>
          <h2 className="text-4xl font-serif font-bold mb-4">
            Your Transformation Starts Today.
          </h2>
          <p className="text-white/70 text-lg mb-8">
            Join leaders who chose fulfillment alongside achievement.
            Heart · Hope · Health · Help → Happiness.
          </p>
          <Link
            href="/auth/signup"
            className="inline-flex items-center gap-2 px-10 py-5 bg-[var(--gold)] text-[var(--navy)] rounded-2xl text-xl font-black hover:opacity-90 transition-opacity"
          >
            Begin Your 5H Journey <ArrowRight size={22} />
          </Link>
        </motion.div>
      </section>

      {/* ── FOOTER ─────────────────────────────────── */}
      <footer className="bg-[var(--navy)] text-white/50 py-12 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
              <span className="text-xs font-black">5H</span>
            </div>
            <span className="font-serif font-bold text-white">SthirMind</span>
          </div>
          <p className="text-sm">© 2026 SthirMind · sthirmind.playplate.in · Lead With Clarity. Build With Equanimity.</p>
        </div>
      </footer>
    </div>
  );
}

// ── 5H Diamond Visual ─────────────────────────────────────────
function FiveHDiamond() {
  const NODES = [
    { emoji: '❤️', label: 'Heart',  x: 50, y: 8,  color: '#E63946' },
    { emoji: '🌟', label: 'Hope',   x: 88, y: 45, color: '#457B9D' },
    { emoji: '💪', label: 'Health', x: 68, y: 88, color: '#52B788' },
    { emoji: '🤝', label: 'Help',   x: 30, y: 88, color: '#7B2D8B' },
    { emoji: '✨', label: 'Happy',  x: 10, y: 45, color: '#F4A261' },
  ];

  return (
    <div className="relative w-[340px] h-[340px]">
      {/* Center Happiness */}
      <motion.div
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 3, repeat: Infinity }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10"
      >
        <div className="w-24 h-24 rounded-full gradient-navy flex flex-col items-center justify-center shadow-xl">
          <span className="text-2xl">😊</span>
          <span className="text-white text-xs font-bold mt-1">HAPPINESS</span>
        </div>
      </motion.div>

      {/* Pillar nodes */}
      {NODES.map((n, i) => (
        <motion.div
          key={n.label}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 + i * 0.15 }}
          className="absolute flex flex-col items-center gap-1"
          style={{ left: `${n.x}%`, top: `${n.y}%`, transform: 'translate(-50%, -50%)' }}
        >
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-md"
            style={{ background: `${n.color}20`, border: `2px solid ${n.color}` }}
          >
            {n.emoji}
          </div>
          <span className="text-xs font-bold text-[var(--navy)]">{n.label}</span>
        </motion.div>
      ))}

      {/* Connecting lines (SVG) */}
      <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 0 }}>
        {NODES.map(n => (
          <line
            key={n.label}
            x1={`${n.x}%`} y1={`${n.y}%`}
            x2="50%" y2="50%"
            stroke={n.color} strokeWidth="1.5" strokeDasharray="4,4" opacity="0.4"
          />
        ))}
      </svg>
    </div>
  );
}
