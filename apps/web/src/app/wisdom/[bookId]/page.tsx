'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { AudioPlayer } from '@/components/wisdom/AudioPlayer';
import Link from 'next/link';

const SUMMARY_LENGTHS = [
  { id: 'one_min', label: '1 Min', desc: '~200 words', icon: '⚡' },
  { id: 'five_min', label: '5 Min', desc: '~900 words', icon: '📖' },
  { id: 'fifteen_min', label: '15 Min', desc: '~2800 words', icon: '🎓' },
];

const VOICES = [
  { id: 'male', label: 'Professional Male', icon: '👨' },
  { id: 'female', label: 'Professional Female', icon: '👩' },
  { id: 'mentor', label: 'Mentor Voice', icon: '🧭' },
  { id: 'founder', label: 'Founder Voice', icon: '🚀' },
  { id: 'meditation', label: 'Calm Meditation', icon: '🧘' },
];

const TABS = ['Summary', 'Audio', 'Chat', 'Insights', 'Notes'];

export default function BookDetailPage({ params }: { params: { bookId: string } }) {
  const { bookId } = params;
  const qc = useQueryClient();

  const [tab, setTab] = useState('Summary');
  const [summaryLength, setSummaryLength] = useState('five_min');
  const [selectedVoice, setSelectedVoice] = useState('mentor');
  const [chatInput, setChatInput] = useState('');
  const [chatSession, setChatSession] = useState<string | null>(null);
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [noteText, setNoteText] = useState('');

  const { data: book } = useQuery({
    queryKey: ['book', bookId],
    queryFn: () => api.get(`/wisdom/books/${bookId}`).then(r => r.data),
  });

  const { data: summaries } = useQuery({
    queryKey: ['summaries', bookId],
    queryFn: () => api.get(`/wisdom/books/${bookId}/summaries`).then(r => r.data),
  });

  const activeSummary = summaries?.find((s: any) => s.length === summaryLength.toUpperCase());

  const generateSummary = useMutation({
    mutationFn: () => api.post(`/wisdom/books/${bookId}/summarize`, { length: summaryLength }).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['summaries', bookId] }),
  });

  const generateAudio = useMutation({
    mutationFn: () => {
      if (!activeSummary) return Promise.reject('No summary');
      return api.post(`/wisdom/summaries/${activeSummary.id}/audio`, { voice: selectedVoice }).then(r => r.data);
    },
  });

  const startChat = useMutation({
    mutationFn: () => api.post(`/wisdom/books/${bookId}/chat`, { title: `Chat about ${book?.title}` }).then(r => r.data),
    onSuccess: (session) => setChatSession(session.id),
  });

  const sendMessage = useMutation({
    mutationFn: (message: string) => api.post(`/wisdom/chat/${chatSession}/message`, { message }).then(r => r.data),
    onSuccess: (data, message) => {
      setMessages(prev => [...prev, { role: 'user', content: message }, { role: 'assistant', content: data.message }]);
      setChatInput('');
    },
  });

  const saveNote = useMutation({
    mutationFn: () => api.post('/wisdom/notes', { bookId, content: noteText, type: 'NOTE' }).then(r => r.data),
    onSuccess: () => { setNoteText(''); qc.invalidateQueries({ queryKey: ['notes', bookId] }); },
  });

  const addToLibrary = useMutation({
    mutationFn: () => api.post(`/wisdom/library/${bookId}`).then(r => r.data),
  });

  const { data: notes } = useQuery({
    queryKey: ['notes', bookId],
    queryFn: () => api.get(`/wisdom/notes?bookId=${bookId}`).then(r => r.data),
    enabled: tab === 'Notes',
  });

  const pillarColor: Record<string, string> = { HEART: '#E91E63', HOPE: '#F4A261', HEALTH: '#4CAF50', HELP: '#2196F3' };

  return (
    <div className="min-h-screen bg-[#0D1B2A] pt-16">
      {/* Book Header */}
      <div className="bg-gradient-to-br from-[#1B3A6B] to-[#0D1B2A] py-10 px-4 border-b border-white/10">
        <div className="max-w-5xl mx-auto flex gap-6 items-start flex-wrap">
          {/* Cover placeholder */}
          <div className="w-28 h-40 rounded-xl flex-shrink-0 flex items-center justify-center text-3xl font-black text-white bg-gradient-to-br from-[#F4A261]/30 to-[#7B2D8B]/30 border border-white/10">
            {book ? book.title.slice(0, 2).toUpperCase() : '📚'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap gap-2 mb-2">
              {book?.tags?.slice(0, 3).map((t: string) => (
                <span key={t} className="text-xs px-2 py-0.5 rounded-full bg-[#F4A261]/10 text-[#F4A261] capitalize">{t}</span>
              ))}
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white mb-1">{book?.title ?? '...'}</h1>
            <p className="text-[#8B9BB4] mb-3">by {book?.author}</p>
            <p className="text-[#8B9BB4] text-sm mb-4 max-w-2xl leading-relaxed">{book?.description}</p>
            <div className="flex flex-wrap gap-3">
              <button onClick={() => addToLibrary.mutate()}
                className="bg-[#F4A261] text-white text-sm font-bold px-5 py-2.5 rounded-xl hover:opacity-90 transition-opacity">
                + Add to Library
              </button>
              <button onClick={() => { setSummaryLength('five_min'); setTab('Summary'); generateSummary.mutate(); }}
                className="bg-white/10 border border-white/20 text-white text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-white/20 transition-colors">
                ⚡ Generate Summary
              </button>
            </div>
          </div>
          {/* Happiness Impact */}
          {book?.happinessBoost && (
            <div className="bg-white/5 rounded-xl p-4 border border-white/10 flex-shrink-0">
              <p className="text-xs font-bold uppercase tracking-widest text-[#8B9BB4] mb-3">Happiness Impact</p>
              {Object.entries(book.happinessBoost as Record<string, number>).filter(([k]) => ['heart','hope','health','help'].includes(k)).map(([pillar, val]) => (
                <div key={pillar} className="flex items-center gap-2 mb-1.5">
                  <span className="text-xs capitalize w-10 text-[#8B9BB4]">{pillar}</span>
                  <div className="w-20 h-1.5 bg-white/10 rounded-full">
                    <div className="h-full rounded-full" style={{ width: `${(val as number) * 10}%`, background: pillarColor[pillar.toUpperCase()] }} />
                  </div>
                  <span className="text-xs text-white">+{val}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-[#1A2A3D] rounded-xl p-1 w-fit">
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === t ? 'bg-[#F4A261] text-white' : 'text-[#8B9BB4] hover:text-white'}`}>
              {t}
            </button>
          ))}
        </div>

        {/* SUMMARY TAB */}
        {tab === 'Summary' && (
          <div>
            <div className="flex gap-3 mb-6">
              {SUMMARY_LENGTHS.map(s => (
                <button key={s.id} onClick={() => setSummaryLength(s.id)}
                  className={`flex-1 rounded-xl p-3 text-center border transition-all ${summaryLength === s.id ? 'border-[#F4A261] bg-[#F4A261]/10' : 'border-white/10 bg-[#1A2A3D] hover:border-white/30'}`}>
                  <div className="text-xl mb-1">{s.icon}</div>
                  <p className="text-white text-sm font-bold">{s.label}</p>
                  <p className="text-[#8B9BB4] text-xs">{s.desc}</p>
                </button>
              ))}
            </div>

            {activeSummary ? (
              <div className="space-y-6">
                <div className="bg-[#1A2A3D] rounded-2xl p-6 border border-white/10">
                  <p className="text-white leading-relaxed text-sm whitespace-pre-wrap">{activeSummary.content}</p>
                </div>
                {activeSummary.keyLessons?.length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-widest text-[#F4A261] mb-3">🔑 Key Lessons</h3>
                    <div className="grid md:grid-cols-2 gap-3">
                      {activeSummary.keyLessons.map((lesson: any, i: number) => (
                        <div key={i} className="bg-[#1A2A3D] rounded-xl p-4 border border-white/10">
                          <p className="text-white text-sm font-semibold mb-1">{lesson.lesson ?? lesson}</p>
                          {lesson.example && <p className="text-[#8B9BB4] text-xs">{lesson.example}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {activeSummary.actionItems?.length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-widest text-[#F4A261] mb-3">✅ Action Items</h3>
                    <ul className="space-y-2">
                      {activeSummary.actionItems.map((item: string, i: number) => (
                        <li key={i} className="flex gap-3 items-start bg-[#1A2A3D] rounded-xl p-3 border border-white/5">
                          <span className="text-[#F4A261] font-bold text-sm flex-shrink-0">{i + 1}.</span>
                          <p className="text-[#8B9BB4] text-sm">{item}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-16 bg-[#1A2A3D] rounded-2xl border border-white/10">
                <div className="text-4xl mb-4">📖</div>
                <p className="text-[#8B9BB4] mb-6">No {summaryLength.replace('_', ' ')} summary yet</p>
                <button onClick={() => generateSummary.mutate()} disabled={generateSummary.isPending}
                  className="bg-[#F4A261] text-white font-bold px-8 py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-60">
                  {generateSummary.isPending ? '✨ Generating...' : '✨ Generate with AI'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* AUDIO TAB */}
        {tab === 'Audio' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-widest text-[#8B9BB4] mb-3">Select Voice</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {VOICES.map(v => (
                  <button key={v.id} onClick={() => setSelectedVoice(v.id)}
                    className={`rounded-xl p-3 text-center border transition-all ${selectedVoice === v.id ? 'border-[#F4A261] bg-[#F4A261]/10' : 'border-white/10 bg-[#1A2A3D] hover:border-white/30'}`}>
                    <div className="text-2xl mb-1">{v.icon}</div>
                    <p className="text-white text-xs font-semibold">{v.label}</p>
                  </button>
                ))}
              </div>
            </div>

            {!activeSummary && (
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 text-center">
                <p className="text-yellow-400 text-sm">Generate a summary first to create audio.</p>
                <button onClick={() => setTab('Summary')} className="mt-2 text-xs text-[#F4A261] underline">Go to Summary tab</button>
              </div>
            )}

            {activeSummary && (
              <div className="space-y-4">
                {generateAudio.data ? (
                  <AudioPlayer
                    audioUrl={generateAudio.data.audioUrl}
                    durationSec={generateAudio.data.durationSec}
                    title={`${book?.title} — ${summaryLength.replace('_', ' ')} Summary`}
                    voice={selectedVoice}
                  />
                ) : (
                  <div className="text-center py-12 bg-[#1A2A3D] rounded-2xl border border-white/10">
                    <div className="text-4xl mb-4">🎧</div>
                    <p className="text-[#8B9BB4] mb-6">Generate audio narration for the {summaryLength.replace('_', ' ')} summary</p>
                    <button onClick={() => generateAudio.mutate()} disabled={generateAudio.isPending}
                      className="bg-[#F4A261] text-white font-bold px-8 py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-60">
                      {generateAudio.isPending ? '🎙 Generating audio...' : '🎙 Generate Audio'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* CHAT TAB */}
        {tab === 'Chat' && (
          <div className="flex flex-col h-[60vh]">
            <div className="flex-1 overflow-y-auto space-y-4 mb-4 bg-[#1A2A3D] rounded-2xl p-4 border border-white/10">
              {messages.length === 0 && !chatSession && (
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <div className="text-4xl mb-4">💬</div>
                  <p className="text-white font-bold mb-2">Chat with {book?.title}</p>
                  <p className="text-[#8B9BB4] text-sm mb-6">Ask questions, get insights, explore ideas from this book</p>
                  <div className="grid grid-cols-2 gap-2 max-w-md">
                    {["What are the key frameworks?", "How does this apply to startups?", "Give me the top 3 lessons", "What does this say about habits?"].map(q => (
                      <button key={q} onClick={() => { if (!chatSession) startChat.mutate(); else sendMessage.mutate(q); }}
                        className="text-xs bg-white/5 border border-white/10 rounded-xl p-3 text-[#8B9BB4] hover:text-white hover:border-[#F4A261]/30 transition-all text-left">
                        "{q}"
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${m.role === 'user' ? 'bg-[#F4A261] text-white' : 'bg-white/5 border border-white/10 text-[#8B9BB4]'}`}>
                    {m.content}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <input
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && chatInput.trim()) {
                    if (!chatSession) startChat.mutateAsync().then(() => sendMessage.mutate(chatInput));
                    else sendMessage.mutate(chatInput);
                  }
                }}
                placeholder={`Ask anything about "${book?.title}"...`}
                className="flex-1 bg-[#1A2A3D] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-[#8B9BB4] text-sm outline-none focus:border-[#F4A261]/50"
              />
              <button
                onClick={() => {
                  if (!chatInput.trim()) return;
                  if (!chatSession) startChat.mutateAsync().then(() => sendMessage.mutate(chatInput));
                  else sendMessage.mutate(chatInput);
                }}
                disabled={sendMessage.isPending || !chatInput.trim()}
                className="bg-[#F4A261] text-white font-bold px-5 py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50">
                Send
              </button>
            </div>
          </div>
        )}

        {/* INSIGHTS TAB — Founder/Leader/Health */}
        {tab === 'Insights' && activeSummary && (
          <div className="space-y-6">
            {activeSummary.founderApps?.length > 0 && (
              <div>
                <h3 className="text-sm font-bold uppercase tracking-widest text-[#F4A261] mb-3">🚀 Founder Insights</h3>
                <ul className="space-y-2">
                  {activeSummary.founderApps.map((item: string, i: number) => (
                    <li key={i} className="flex gap-3 bg-[#1A2A3D] rounded-xl p-3 border border-white/5">
                      <span className="text-[#F4A261]">→</span>
                      <p className="text-[#8B9BB4] text-sm">{item}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {activeSummary.leadershipApps?.length > 0 && (
              <div>
                <h3 className="text-sm font-bold uppercase tracking-widest text-[#F4A261] mb-3">👑 Leadership Insights</h3>
                <ul className="space-y-2">
                  {activeSummary.leadershipApps.map((item: string, i: number) => (
                    <li key={i} className="flex gap-3 bg-[#1A2A3D] rounded-xl p-3 border border-white/5">
                      <span className="text-[#F4A261]">→</span>
                      <p className="text-[#8B9BB4] text-sm">{item}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {activeSummary.healthApps?.length > 0 && (
              <div>
                <h3 className="text-sm font-bold uppercase tracking-widest text-[#F4A261] mb-3">💪 Health Insights</h3>
                <ul className="space-y-2">
                  {activeSummary.healthApps.map((item: string, i: number) => (
                    <li key={i} className="flex gap-3 bg-[#1A2A3D] rounded-xl p-3 border border-white/5">
                      <span className="text-[#F4A261]">→</span>
                      <p className="text-[#8B9BB4] text-sm">{item}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {activeSummary.mentalModels?.length > 0 && (
              <div>
                <h3 className="text-sm font-bold uppercase tracking-widest text-[#F4A261] mb-3">🧠 Mental Models</h3>
                <div className="grid md:grid-cols-2 gap-3">
                  {activeSummary.mentalModels.map((m: any, i: number) => (
                    <div key={i} className="bg-[#1A2A3D] rounded-xl p-4 border border-white/10">
                      <p className="text-white font-bold text-sm mb-1">{m.name}</p>
                      <p className="text-[#8B9BB4] text-xs mb-2">{m.description}</p>
                      {m.example && <p className="text-[#F4A261] text-xs italic">{m.example}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {!activeSummary && (
              <div className="text-center py-16 text-[#8B9BB4]">
                <p>Generate a summary first to see insights.</p>
              </div>
            )}
          </div>
        )}

        {/* NOTES TAB */}
        {tab === 'Notes' && (
          <div className="space-y-4">
            <div className="bg-[#1A2A3D] rounded-2xl border border-white/10 p-4">
              <textarea
                value={noteText}
                onChange={e => setNoteText(e.target.value)}
                placeholder="Capture a thought, insight, or quote from this book..."
                rows={3}
                className="w-full bg-transparent text-white placeholder-[#8B9BB4] text-sm outline-none resize-none mb-3"
              />
              <div className="flex justify-end">
                <button onClick={() => saveNote.mutate()} disabled={!noteText.trim() || saveNote.isPending}
                  className="bg-[#F4A261] text-white text-sm font-bold px-5 py-2 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50">
                  Save Note
                </button>
              </div>
            </div>
            {notes?.map((note: any) => (
              <div key={note.id} className="bg-[#1A2A3D] rounded-xl p-4 border border-white/10">
                <p className="text-white text-sm leading-relaxed">{note.content}</p>
                <p className="text-[#8B9BB4] text-xs mt-2">{new Date(note.createdAt).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
