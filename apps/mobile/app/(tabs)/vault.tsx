import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { C } from '@/lib/colors';

const NOTES = [
  { id: '1', starred: true, title: 'The Power of Monopoly', book: 'Zero to One', content: 'Competition destroys value. True innovation creates monopolies — being 10x better in a specific market is more valuable than being slightly better everywhere.', type: 'NOTE', color: '#F4A261' },
  { id: '2', starred: false, title: 'Keystone Habits', book: 'Atomic Habits', content: 'Small habits that trigger chain reactions. Exercise is a keystone habit — it improves sleep, diet, and mood automatically.', type: 'INSIGHT', color: '#4CAF50' },
  { id: '3', starred: true, title: 'Ikigai Formula', book: 'Ikigai', content: 'The intersection of: what you love + what you\'re good at + what the world needs + what you can be paid for. Live there.', type: 'QUOTE', color: '#E91E63' },
  { id: '4', starred: false, title: 'Leaders Eat Last', book: 'Leaders Eat Last', content: 'The best leaders put their people\'s needs before their own. Safety creates trust, trust creates performance.', type: 'ACTION', color: '#2196F3' },
];

const TYPES = ['All', 'Notes', 'Quotes', 'Insights', 'Actions'];
const STATS = [['📝','47','Notes'],['⭐','12','Starred'],['🔗','8','Concepts'],['🧠','156','Links']];

export default function KnowledgeVault() {
  const [filter, setFilter] = useState('All');
  const [starred, setStarred] = useState<Record<string, boolean>>({ '1': true, '3': true });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Knowledge Vault</Text>
          <TouchableOpacity style={styles.graphBtn}>
            <Text style={styles.graphBtnText}>✨ Build Graph</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.sub}>47 notes · 12 starred · 8 knowledge nodes</Text>

        {/* Stats */}
        <View style={styles.statsGrid}>
          {STATS.map(([e,v,l]) => (
            <View key={l} style={styles.statCard}>
              <Text style={styles.statEmoji}>{e}</Text>
              <Text style={styles.statVal}>{v}</Text>
              <Text style={styles.statLabel}>{l}</Text>
            </View>
          ))}
        </View>

        {/* Search */}
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput placeholder="Search your notes…" placeholderTextColor={C.muted} style={styles.searchInput} />
        </View>

        {/* Type filters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow} contentContainerStyle={{ gap: 8 }}>
          {TYPES.map(t => (
            <TouchableOpacity key={t} onPress={() => setFilter(t)} style={[styles.filterPill, filter === t && styles.filterPillActive]}>
              <Text style={[styles.filterText, filter === t && styles.filterTextActive]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Notes */}
        <View style={{ gap: 10 }}>
          {NOTES.map(note => (
            <View key={note.id} style={[styles.noteCard, { borderLeftColor: note.color }]}>
              <View style={styles.noteHeader}>
                <View style={{ flex: 1 }}>
                  <View style={styles.noteTitleRow}>
                    <Text style={styles.noteTitle}>{note.title}</Text>
                    <View style={[styles.typeBadge, { backgroundColor: note.color + '20' }]}>
                      <Text style={[styles.typeBadgeText, { color: note.color }]}>{note.type}</Text>
                    </View>
                  </View>
                  <Text style={styles.noteBook}>{note.book}</Text>
                </View>
                <TouchableOpacity onPress={() => setStarred(p => ({ ...p, [note.id]: !p[note.id] }))}>
                  <Text style={[styles.starIcon, { color: starred[note.id] ? '#FFD700' : C.muted }]}>
                    {starred[note.id] ? '★' : '☆'}
                  </Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.noteContent}>{note.content}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  content: { padding: 20, paddingBottom: 32 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  title: { fontSize: 24, fontWeight: '900', color: 'white' },
  graphBtn: { backgroundColor: C.accent, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
  graphBtnText: { color: 'white', fontWeight: '700', fontSize: 12 },
  sub: { color: C.muted, fontSize: 13, marginBottom: 18 },
  statsGrid: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statCard: { flex: 1, backgroundColor: C.surface, borderRadius: 12, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: C.border },
  statEmoji: { fontSize: 18, marginBottom: 3 },
  statVal: { fontSize: 16, fontWeight: '900', color: C.accent },
  statLabel: { fontSize: 9, color: C.muted },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: C.border, marginBottom: 12 },
  searchIcon: { fontSize: 15, marginRight: 8 },
  searchInput: { flex: 1, color: 'white', fontSize: 14 },
  filterRow: { marginBottom: 16 },
  filterPill: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 18, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border },
  filterPillActive: { backgroundColor: C.accent, borderColor: C.accent },
  filterText: { fontSize: 12, fontWeight: '600', color: C.muted },
  filterTextActive: { color: 'white' },
  noteCard: { backgroundColor: C.surface, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: C.border, borderLeftWidth: 3 },
  noteHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 8 },
  noteTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' },
  noteTitle: { fontSize: 14, fontWeight: '700', color: 'white' },
  typeBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  typeBadgeText: { fontSize: 10, fontWeight: '700' },
  noteBook: { fontSize: 11, color: C.muted },
  starIcon: { fontSize: 22 },
  noteContent: { fontSize: 13, color: 'rgba(255,255,255,0.75)', lineHeight: 19 },
});
