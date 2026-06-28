'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import Link from 'next/link';

const PILLARS = ['HEART','HOPE','HEALTH','HELP'];
const PILLAR_COLORS: Record<string,string> = { HEART:'#E63946', HOPE:'#457B9D', HEALTH:'#52B788', HELP:'#7B2D8B' };
const PILLAR_EMOJIS: Record<string,string> = { HEART:'❤️', HOPE:'🌟', HEALTH:'💪', HELP:'🤝' };

export default function CommunityPage() {
  const qc = useQueryClient();
  const [content, setContent] = useState('');
  const [pillar, setPillar] = useState('');

  const { data: feed } = useQuery({ queryKey: ['feed'], queryFn: () => api.get('/community/feed').then(r => r.data) });
  const { data: challenges } = useQuery({ queryKey: ['challenges'], queryFn: () => api.get('/help/challenges').then(r => r.data) });

  const createPost = useMutation({
    mutationFn: (data: any) => api.post('/community/posts', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['feed'] }); setContent(''); },
  });

  const likePost = useMutation({
    mutationFn: (id: string) => api.post(`/community/posts/${id}/like`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['feed'] }),
  });

  return (
    <div className="min-h-screen bg-[#0D1B2A] pt-6 px-4 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard" className="text-[#8B9BB4] hover:text-white text-sm">← Dashboard</Link>
        <span className="text-[#8B9BB4]">/</span>
        <span className="text-[#F4A261] font-bold">🌍 Community</span>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <div className="bg-[#1A2A3D] border border-white/10 rounded-2xl p-5 mb-6">
            <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Share your happiness journey with the community..." rows={3} className="w-full bg-[#243447] border border-white/10 rounded-xl p-3 text-white text-sm resize-none outline-none focus:border-[#F4A261]/40 mb-3" />
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                {PILLARS.map(p => (
                  <button key={p} onClick={() => setPillar(pillar === p ? '' : p)}
                    className={`px-2 py-1 rounded-lg text-xs font-medium border transition-all ${pillar === p ? 'text-white' : 'border-white/10 text-[#8B9BB4]'}`}
                    style={pillar === p ? { background: PILLAR_COLORS[p], borderColor: PILLAR_COLORS[p] } : {}}>
                    {PILLAR_EMOJIS[p]} {p.charAt(0)+p.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
              <button onClick={() => createPost.mutate({ content, pillar: pillar || undefined })} disabled={!content.trim()} className="bg-[#F4A261] text-white font-bold px-4 py-2 rounded-xl text-sm disabled:opacity-50">Post</button>
            </div>
          </div>

          <div className="space-y-4">
            {feed?.map((post: any) => (
              <div key={post.id} className="bg-[#1A2A3D] border border-white/10 rounded-2xl p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#F4A261] to-[#E63946] grid place-items-center font-bold text-white text-sm">
                    {(post.user?.firstName?.[0] ?? '?')}
                  </div>
                  <div>
                    <div className="font-semibold text-sm">{post.user?.firstName} {post.user?.lastName}</div>
                    <div className="text-xs text-[#8B9BB4]">{new Date(post.createdAt).toLocaleDateString()}</div>
                  </div>
                  {post.pillar && (
                    <span className="ml-auto text-xs font-bold px-2 py-1 rounded-full" style={{ background: PILLAR_COLORS[post.pillar]+'30', color: PILLAR_COLORS[post.pillar] }}>
                      {PILLAR_EMOJIS[post.pillar]} {post.pillar.charAt(0)+post.pillar.slice(1).toLowerCase()}
                    </span>
                  )}
                </div>
                <p className="text-sm leading-relaxed mb-3">{post.content}</p>
                <div className="flex gap-4">
                  <button onClick={() => likePost.mutate(post.id)} className="text-[#8B9BB4] hover:text-[#E63946] text-xs flex items-center gap-1 transition-colors">
                    ❤️ {post.likeCount}
                  </button>
                  <button className="text-[#8B9BB4] hover:text-white text-xs flex items-center gap-1 transition-colors">
                    💬 {post.replyCount}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="bg-[#1A2A3D] border border-white/10 rounded-2xl p-5 mb-4">
            <h3 className="font-semibold mb-4 text-sm">Community Stats</h3>
            {[['Members', '12,400', '👥'], ['Avg Happiness', '68.3', '😊'], ["Today's Check-ins", '3,241', '✅'], ['Goals Achieved', '847', '🎯']].map(([l, v, e]) => (
              <div key={l} className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
                <span className="text-xs text-[#8B9BB4]">{e} {l}</span>
                <span className="font-bold text-sm text-[#F4A261]">{v}</span>
              </div>
            ))}
          </div>

          <div className="bg-[#1A2A3D] border border-white/10 rounded-2xl p-5">
            <h3 className="font-semibold mb-4 text-sm">Active Challenges</h3>
            <div className="space-y-3">
              {challenges?.slice(0,4).map((c: any) => (
                <div key={c.id} className="p-3 bg-[#243447] rounded-xl">
                  <div className="text-sm font-medium mb-1">{c.emoji} {c.title}</div>
                  <div className="text-xs text-[#8B9BB4]">{c._count?.participants ?? 0} joined · {c.rewardXp} XP</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
