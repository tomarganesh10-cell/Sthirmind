import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { api } from '@/lib/api';
import { C, PILLAR_COLOR } from '@/lib/colors';
import { AudioPlayer } from '@/components/wisdom/AudioPlayer';

const TABS = ['Summary', 'Audio', 'Chat', 'Notes'];
const LENGTHS = [{ id: 'one_min', label: '1 Min', icon: '⚡', desc: '~200 words' }, { id: 'five_min', label: '5 Min', icon: '📖', desc: '~900 words' }, { id: 'fifteen_min', label: '15 Min', icon: '🎓', desc: '~2800 words' }];

const DEMO_BOOK = { id: '1', emoji: '🚀', title: 'Zero to One', author: 'Peter Thiel', category: 'ENTREPRENEURSHIP', pillar: 'HOPE', rating: 4.8, description: 'Notes on Startups, or How to Build the Future. Peter Thiel shows that every moment in business happens only once.' };
const DEMO_SUMMARY = { content: 'Peter Thiel argues that true innovation means going from zero to one — creating something entirely new. The biggest breakthroughs come from creating monopolies in new markets, not copying what already exists.\n\nEvery great company is built on a secret: a truth others haven\'t yet recognized. Ask yourself what important truth very few people agree with you on — that contrarian insight is the seed of a transformative company.\n\nCompetition is for losers. Monopolies earn outsized returns while competing businesses destroy each other\'s margins. Build something 10x better in a small, specific market, own it completely, then expand.', keyLessons: [{ lesson: 'Competition destroys profit', example: 'Monopolies earn outsized returns — avoid head-to-head competition.' }, { lesson: 'Secrets still exist', example: 'Every great business is built on a secret others don\'t see yet.' }, { lesson: 'Last mover advantage', example: 'The last great product in a market often wins, not the first.' }, { lesson: 'Power law dominates', example: 'One investment beats all others combined.' }] };

export default function BookDetail() {
  const { bookId } = useLocalSearchParams<{ bookId: string }>();
  const qc = useQueryClient();
  const [tab, setTab] = useState('Summary');
  const [length, setLength] = useState('five_min');
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatSession, setChatSession] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');

  const { data: book } = useQuery({ queryKey: ['book', bookId], queryFn: () => api.get(`/wisdom/books/${bookId}`).then(r => r.data), placeholderData: DEMO_BOOK });
  const { data: summaries = [] } = useQuery({ queryKey: ['summaries', bookId], queryFn: () => api.get(`/wisdom/books/${bookId}/summaries`).then(r => r.data ?? []) });
  const activeSummary = summaries.find((s: any) => s.length === length.toUpperCase()) ?? (summaries.length === 0 ? DEMO_SUMMARY : null);

  const genSummary = useMutation({ mutationFn: () => api.post(`/wisdom/books/${bookId}/summarize`, { length }), onSuccess: () => qc.invalidateQueries({ queryKey: ['summaries', bookId] }) });
  const genAudio = useMutation({ mutationFn: () => activeSummary ? api.post(`/wisdom/summaries/${(activeSummary as any).id}/audio`, {}) : Promise.reject() });
  const startChat = useMutation({ mutationFn: () => api.post(`/wisdom/books/${bookId}/chat`, { title: `Chat ${book?.title}` }), onSuccess: (d) => setChatSession(d.id) });
  const sendMsg = useMutation({ mutationFn: (msg: string) => api.post(`/wisdom/chat/${chatSession}/message`, { message: msg }), onSuccess: (d, msg) => { setMessages(p => [...p, { role: 'user', content: msg }, { role: 'ai', content: d.message }]); setChatInput(''); } });
  const saveNote = useMutation({ mutationFn: () => api.post('/wisdom/notes', { bookId, content: noteText, type: 'NOTE' }), onSuccess: () => setNoteText('') });

  const color = book?.pillar ? (PILLAR_COLOR[book.pillar] ?? C.accent) : C.accent;

  const CHAT_PROMPTS = ['What is the most important insight?', 'How do I apply this to my startup?', 'What is the key mental model?', 'How does this book change thinking?'];

  const sendChat = async (msg: string) => {
    if (!chatSession) {
      const s = await startChat.mutateAsync();
      setChatSession(s.id);
    }
    sendMsg.mutate(msg);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

        {/* Header */}
        <LinearGradient colors={['#1B3A6B', '#0D1B2A']} style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.back}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <View style={styles.bookRow}>
            <View style={[styles.cover, { backgroundColor: color + '22' }]}>
              <Text style={styles.coverEmoji}>{book?.emoji ?? '📖'}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.catBadge, { color }]}>{book?.category ?? 'BOOK'}</Text>
              <Text style={styles.bookTitle}>{book?.title ?? '...'}</Text>
              <Text style={styles.bookAuthor}>by {book?.author}</Text>
              <Text style={styles.bookDesc} numberOfLines={2}>{book?.description}</Text>
              <View style={styles.headerBtns}>
                <TouchableOpacity style={styles.btnPrimary}><Text style={styles.btnPrimaryText}>+ Library</Text></TouchableOpacity>
                <TouchableOpacity style={styles.btnGhost} onPress={() => setTab('Audio')}><Text style={styles.btnGhostText}>🎧 Listen</Text></TouchableOpacity>
              </View>
            </View>
          </View>
        </LinearGradient>

        {/* Tabs */}
        <View style={styles.tabRow}>
          {TABS.map(t => (
            <TouchableOpacity key={t} onPress={() => setTab(t)} style={[styles.tabBtn, tab === t && styles.tabBtnActive]}>
              <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

          {/* SUMMARY */}
          {tab === 'Summary' && (
            <View>
              <View style={styles.lengthRow}>
                {LENGTHS.map(l => (
                  <TouchableOpacity key={l.id} onPress={() => setLength(l.id)} style={[styles.lengthBtn, length === l.id && styles.lengthBtnActive]}>
                    <Text style={styles.lengthIcon}>{l.icon}</Text>
                    <Text style={[styles.lengthLabel, length === l.id && styles.lengthLabelActive]}>{l.label}</Text>
                    <Text style={styles.lengthDesc}>{l.desc}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {activeSummary ? (
                <View>
                  <View style={styles.card}>
                    <View style={styles.aiBadge}><Text style={styles.aiBadgeText}>✨ AI Summary</Text></View>
                    <Text style={styles.summaryText}>{(activeSummary as any).content}</Text>
                  </View>
                  {(activeSummary as any).keyLessons?.length > 0 && (
                    <View style={{ marginTop: 20 }}>
                      <Text style={styles.sectionLabel}>🔑 Key Lessons</Text>
                      {(activeSummary as any).keyLessons.map((l: any, i: number) => (
                        <View key={i} style={[styles.card, { marginBottom: 10 }]}>
                          <Text style={styles.lessonTitle}>{l.lesson ?? l}</Text>
                          {l.example && <Text style={styles.lessonDesc}>{l.example}</Text>}
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyEmoji}>📖</Text>
                  <Text style={styles.emptyTitle}>No {length.replace('_', ' ')} summary yet</Text>
                  <TouchableOpacity style={styles.btnPrimary} onPress={() => genSummary.mutate()} disabled={genSummary.isPending}>
                    <Text style={styles.btnPrimaryText}>{genSummary.isPending ? '✨ Generating…' : '✨ Generate with AI'}</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

          {/* AUDIO */}
          {tab === 'Audio' && (
            <View>
              <View style={styles.lengthRow}>
                {LENGTHS.map(l => (
                  <TouchableOpacity key={l.id} onPress={() => setLength(l.id)} style={[styles.lengthBtn, length === l.id && styles.lengthBtnActive]}>
                    <Text style={styles.lengthIcon}>{l.icon}</Text>
                    <Text style={[styles.lengthLabel, length === l.id && styles.lengthLabelActive]}>{l.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {!activeSummary ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyEmoji}>🎧</Text>
                  <Text style={styles.emptyTitle}>Generate a summary first</Text>
                  <TouchableOpacity style={styles.btnPrimary} onPress={() => setTab('Summary')}>
                    <Text style={styles.btnPrimaryText}>Go to Summary →</Text>
                  </TouchableOpacity>
                </View>
              ) : genAudio.data ? (
                <AudioPlayer audioUrl={genAudio.data.audioUrl} durationSec={genAudio.data.durationSec} title={`${book?.title} — ${length.replace('_',' ')} Summary`} />
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyEmoji}>🎙️</Text>
                  <Text style={styles.emptyTitle}>Human AI Narration</Text>
                  <Text style={styles.emptyDesc}>Rachel · ElevenLabs · Natural human voice</Text>
                  <TouchableOpacity style={styles.btnPrimary} onPress={() => genAudio.mutate()} disabled={genAudio.isPending}>
                    <Text style={styles.btnPrimaryText}>{genAudio.isPending ? '⏳ Generating…' : '🎙 Generate Audio'}</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

          {/* CHAT */}
          {tab === 'Chat' && (
            <View>
              <View style={[styles.card, { marginBottom: 12, minHeight: 300 }]}>
                {messages.length === 0 ? (
                  <View style={styles.chatEmpty}>
                    <Text style={styles.emptyEmoji}>💬</Text>
                    <Text style={styles.emptyTitle}>Chat with {book?.title}</Text>
                    <Text style={styles.emptyDesc}>The book answers as the author</Text>
                    <View style={styles.promptGrid}>
                      {CHAT_PROMPTS.map(q => (
                        <TouchableOpacity key={q} style={styles.promptBtn} onPress={() => sendChat(q)}>
                          <Text style={styles.promptText}>"{q}"</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                ) : (
                  <View style={{ gap: 12 }}>
                    {messages.map((m, i) => (
                      <View key={i} style={{ alignItems: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                        <View style={[styles.bubble, m.role === 'user' ? styles.bubbleUser : styles.bubbleAI]}>
                          <Text style={styles.bubbleText}>{m.content}</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>
              <View style={styles.chatInputRow}>
                <TextInput value={chatInput} onChangeText={setChatInput} placeholder={`Ask about "${book?.title}"…`} placeholderTextColor={C.muted} style={styles.chatInput} returnKeyType="send" onSubmitEditing={() => chatInput.trim() && sendChat(chatInput)} />
                <TouchableOpacity style={styles.sendBtn} onPress={() => chatInput.trim() && sendChat(chatInput)}>
                  <Text style={styles.sendText}>→</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* NOTES */}
          {tab === 'Notes' && (
            <View>
              <View style={styles.card}>
                <Text style={styles.sectionLabel}>📝 Add Note</Text>
                <TextInput value={noteText} onChangeText={setNoteText} placeholder="Write your insight, quote, or reflection…" placeholderTextColor={C.muted} style={styles.noteInput} multiline numberOfLines={5} />
                <TouchableOpacity style={[styles.btnPrimary, { marginTop: 12, alignSelf: 'flex-end' }]} onPress={() => saveNote.mutate()} disabled={!noteText.trim() || saveNote.isPending}>
                  <Text style={styles.btnPrimaryText}>Save Note</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  header: { padding: 16, paddingTop: 4 },
  back: { marginBottom: 16 },
  backText: { color: C.accent, fontSize: 15, fontWeight: '600' },
  bookRow: { flexDirection: 'row', gap: 14 },
  cover: { width: 80, height: 110, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  coverEmoji: { fontSize: 34 },
  catBadge: { fontSize: 10, fontWeight: '700', marginBottom: 4, textTransform: 'uppercase' },
  bookTitle: { fontSize: 18, fontWeight: '900', color: 'white', marginBottom: 2 },
  bookAuthor: { fontSize: 12, color: C.muted, marginBottom: 6 },
  bookDesc: { fontSize: 12, color: C.muted, lineHeight: 18, marginBottom: 10 },
  headerBtns: { flexDirection: 'row', gap: 8 },
  btnPrimary: { backgroundColor: C.accent, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 9, alignItems: 'center' },
  btnPrimaryText: { color: 'white', fontWeight: '700', fontSize: 13 },
  btnGhost: { backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 9, borderWidth: 1, borderColor: C.border },
  btnGhostText: { color: 'white', fontWeight: '600', fontSize: 13 },
  tabRow: { flexDirection: 'row', backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: C.border },
  tabBtn: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabBtnActive: { borderBottomWidth: 2, borderBottomColor: C.accent },
  tabText: { fontSize: 13, fontWeight: '600', color: C.muted },
  tabTextActive: { color: C.accent },
  content: { padding: 16, paddingBottom: 32 },
  lengthRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  lengthBtn: { flex: 1, backgroundColor: C.surface, borderRadius: 12, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: C.border },
  lengthBtnActive: { borderColor: C.accent, backgroundColor: C.accent + '15' },
  lengthIcon: { fontSize: 18, marginBottom: 4 },
  lengthLabel: { fontSize: 13, fontWeight: '700', color: C.muted },
  lengthLabelActive: { color: 'white' },
  lengthDesc: { fontSize: 10, color: C.muted, marginTop: 2 },
  card: { backgroundColor: C.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: C.border },
  aiBadge: { backgroundColor: C.accent + '15', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start', marginBottom: 12 },
  aiBadgeText: { fontSize: 11, fontWeight: '700', color: C.accent },
  summaryText: { fontSize: 14, color: 'rgba(255,255,255,0.85)', lineHeight: 22 },
  sectionLabel: { fontSize: 12, fontWeight: '700', color: C.accent, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 },
  lessonTitle: { fontSize: 13, fontWeight: '700', color: 'white', marginBottom: 4 },
  lessonDesc: { fontSize: 12, color: C.muted, lineHeight: 18 },
  emptyState: { alignItems: 'center', paddingVertical: 40, gap: 12 },
  emptyEmoji: { fontSize: 44 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: 'white' },
  emptyDesc: { fontSize: 13, color: C.muted, textAlign: 'center' },
  chatEmpty: { alignItems: 'center', paddingVertical: 20, gap: 8 },
  promptGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  promptBtn: { backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: C.border, borderRadius: 10, padding: 10, maxWidth: '48%' },
  promptText: { fontSize: 11, color: C.muted, lineHeight: 16 },
  bubble: { maxWidth: '85%', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleUser: { backgroundColor: C.accent },
  bubbleAI: { backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: C.border },
  bubbleText: { fontSize: 13, color: 'white', lineHeight: 19 },
  chatInputRow: { flexDirection: 'row', gap: 10 },
  chatInput: { flex: 1, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: 'white' },
  sendBtn: { backgroundColor: C.accent, borderRadius: 12, width: 48, alignItems: 'center', justifyContent: 'center' },
  sendText: { fontSize: 18, color: 'white', fontWeight: '700' },
  noteInput: { backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: C.border, borderRadius: 10, padding: 12, fontSize: 14, color: 'white', minHeight: 100, textAlignVertical: 'top' },
});
