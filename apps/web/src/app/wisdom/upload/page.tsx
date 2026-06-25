'use client';

import { useState, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { useRouter } from 'next/navigation';

const PILLARS = ['mindset', 'leadership', 'health', 'startup', 'relationships', 'productivity', 'spirituality', 'finance'];

export default function UploadBookPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState(1);
  const [file, setFile] = useState<File | null>(null);
  const [form, setForm] = useState({
    title: '',
    author: '',
    description: '',
    pillar: '',
    tags: '',
  });

  const upload = useMutation({
    mutationFn: async () => {
      const fd = new FormData();
      if (file) fd.append('file', file);
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      return api.post('/wisdom/books/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }).then(r => r.data);
    },
    onSuccess: (book) => router.push(`/wisdom/${book.id}`),
  });

  const handleFile = (f: File) => {
    setFile(f);
    if (!form.title) setForm(prev => ({ ...prev, title: f.name.replace(/\.[^.]+$/, '').replace(/-/g, ' ') }));
    setStep(2);
  };

  return (
    <div className="min-h-screen bg-[#0D1B2A] pt-16">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="mb-8 text-center">
          <span className="text-5xl">📤</span>
          <h1 className="text-3xl font-extrabold text-white mt-3 mb-2">Upload Your Book</h1>
          <p className="text-[#8B9BB4]">Upload legally owned PDFs/ebooks. AI will generate summaries, audio, and insights.</p>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center gap-2 mb-8 justify-center">
          {[1, 2, 3].map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${step >= s ? 'bg-[#F4A261] text-white' : 'bg-[#1A2A3D] border border-white/20 text-[#8B9BB4]'}`}>{s}</div>
              {i < 2 && <div className={`w-12 h-0.5 transition-all ${step > s ? 'bg-[#F4A261]' : 'bg-white/10'}`} />}
            </div>
          ))}
        </div>

        <div className="bg-[#1A2A3D] rounded-2xl border border-white/10 p-6">
          {step === 1 && (
            <div>
              <h2 className="text-white font-bold text-lg mb-4">Select File</h2>
              <div
                onClick={() => fileRef.current?.click()}
                className="border-2 border-dashed border-white/20 rounded-2xl p-12 text-center cursor-pointer hover:border-[#F4A261]/40 transition-colors"
                onDragOver={e => e.preventDefault()}
                onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
              >
                <div className="text-4xl mb-3">📂</div>
                <p className="text-white font-bold mb-1">Drop your book here</p>
                <p className="text-[#8B9BB4] text-sm">PDF, EPUB, or MOBI (max 50MB)</p>
                <input ref={fileRef} type="file" accept=".pdf,.epub,.mobi" className="hidden"
                  onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
              </div>
              <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
                <p className="text-yellow-400 text-xs">⚠️ Only upload books you legally own. We respect copyright laws.</p>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="text-white font-bold text-lg mb-4">Book Details</h2>
              {file && (
                <div className="flex items-center gap-3 mb-5 p-3 bg-white/5 rounded-xl border border-white/10">
                  <span className="text-2xl">📄</span>
                  <div>
                    <p className="text-white text-sm font-medium">{file.name}</p>
                    <p className="text-[#8B9BB4] text-xs">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
                  </div>
                </div>
              )}
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-[#8B9BB4] mb-1.5 block">Book Title *</label>
                  <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[#F4A261]/50" />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-[#8B9BB4] mb-1.5 block">Author</label>
                  <input value={form.author} onChange={e => setForm(p => ({ ...p, author: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[#F4A261]/50" />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-[#8B9BB4] mb-1.5 block">Category</label>
                  <div className="grid grid-cols-4 gap-2">
                    {PILLARS.map(p => (
                      <button key={p} onClick={() => setForm(prev => ({ ...prev, pillar: p }))}
                        className={`py-2 px-3 rounded-xl text-xs font-medium capitalize transition-all ${form.pillar === p ? 'bg-[#F4A261] text-white' : 'bg-white/5 border border-white/10 text-[#8B9BB4] hover:text-white'}`}>
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-[#8B9BB4] mb-1.5 block">Description (optional)</label>
                  <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                    rows={3} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[#F4A261]/50 resize-none" />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setStep(1)} className="flex-1 bg-white/10 border border-white/20 text-white font-bold py-3 rounded-xl hover:bg-white/20 transition-colors">Back</button>
                <button onClick={() => setStep(3)} disabled={!form.title} className="flex-1 bg-[#F4A261] text-white font-bold py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50">Continue</button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 className="text-white font-bold text-lg mb-4">AI Processing Options</h2>
              <div className="space-y-3 mb-6">
                {[
                  { icon: '⚡', title: 'Auto-generate summaries', desc: '1min, 5min, 15min summaries generated automatically', checked: true },
                  { icon: '🎧', title: 'Generate audio narration', desc: 'AI creates professional audio for all summaries', checked: true },
                  { icon: '🧠', title: 'Extract knowledge graph', desc: 'AI maps concepts, lessons, and mental models', checked: true },
                  { icon: '❤️', title: 'Connect to Happiness OS', desc: 'Link insights to your Heart, Hope, Health, Help pillars', checked: true },
                ].map(opt => (
                  <div key={opt.title} className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/10">
                    <span className="text-2xl">{opt.icon}</span>
                    <div className="flex-1">
                      <p className="text-white text-sm font-semibold">{opt.title}</p>
                      <p className="text-[#8B9BB4] text-xs">{opt.desc}</p>
                    </div>
                    <div className="w-5 h-5 rounded-full bg-[#4CAF50] flex items-center justify-center text-white text-xs">✓</div>
                  </div>
                ))}
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep(2)} className="flex-1 bg-white/10 border border-white/20 text-white font-bold py-3 rounded-xl hover:bg-white/20 transition-colors">Back</button>
                <button onClick={() => upload.mutate()} disabled={upload.isPending}
                  className="flex-1 bg-[#F4A261] text-white font-bold py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-60">
                  {upload.isPending ? '⚙️ Processing...' : '🚀 Upload & Process'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
