import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { C, PILLAR_COLOR } from '@/lib/colors';

const BOOKS = [
  { id: '1', emoji: '🚀', title: 'Zero to One', author: 'Peter Thiel', pillar: 'HOPE', progress: 68, status: 'READING' },
  { id: '2', emoji: '⚛️', title: 'Atomic Habits', author: 'James Clear', pillar: 'HEALTH', progress: 100, status: 'COMPLETED' },
  { id: '3', emoji: '🌸', title: 'Ikigai', author: 'Héctor García', pillar: 'HEART', progress: 34, status: 'READING' },
  { id: '4', emoji: '🔥', title: 'Leaders Eat Last', author: 'Simon Sinek', pillar: 'HELP', progress: 0, status: 'WANT' },
  { id: '5', emoji: '🏔️', title: 'Shoe Dog', author: 'Phil Knight', pillar: 'HOPE', progress: 100, status: 'COMPLETED' },
];

const STATS = [['📚','12','Books Read'],['🎧','28h','Listened'],['🔥','14','Day Streak'],['📝','47','Notes']];

export default function MyLibrary() {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>My Library</Text>
          <TouchableOpacity style={styles.addBtn} onPress={() => router.push('/')}>
            <Text style={styles.addBtnText}>+ Add</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.sub}>5 books · 1 reading · 2 completed</Text>

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

        {/* Filters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filters} contentContainerStyle={{ gap: 8, padding: 2 }}>
          {['All', 'Reading', 'Completed', 'Want to Read'].map((f, i) => (
            <TouchableOpacity key={f} style={[styles.filterPill, i === 0 && styles.filterPillActive]}>
              <Text style={[styles.filterText, i === 0 && styles.filterTextActive]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Books */}
        <View style={{ gap: 10 }}>
          {BOOKS.map(book => {
            const color = PILLAR_COLOR[book.pillar] ?? C.accent;
            return (
              <TouchableOpacity key={book.id} style={styles.bookRow} onPress={() => router.push(`/wisdom/${book.id}`)}>
                <View style={[styles.bookCover, { backgroundColor: color + '22' }]}>
                  <Text style={styles.bookEmoji}>{book.emoji}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.bookTitle}>{book.title}</Text>
                  <Text style={styles.bookAuthor}>{book.author}</Text>
                  {book.progress > 0 ? (
                    <View style={styles.progressRow}>
                      <View style={styles.progressTrack}>
                        <View style={[styles.progressFill, { width: `${book.progress}%`, backgroundColor: color }]} />
                      </View>
                      <Text style={styles.progressPct}>{book.progress}%</Text>
                    </View>
                  ) : (
                    <Text style={styles.notStarted}>Not started</Text>
                  )}
                </View>
                <View style={[styles.statusBadge, { backgroundColor: book.status === 'READING' ? C.accent + '20' : book.status === 'COMPLETED' ? '#4CAF5020' : 'rgba(255,255,255,0.06)' }]}>
                  <Text style={[styles.statusText, { color: book.status === 'READING' ? C.accent : book.status === 'COMPLETED' ? '#4CAF50' : C.muted }]}>
                    {book.status === 'COMPLETED' ? '✓ Done' : book.status === 'READING' ? 'Reading' : 'Want'}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
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
  addBtn: { backgroundColor: C.accent, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
  addBtnText: { color: 'white', fontWeight: '700', fontSize: 13 },
  sub: { color: C.muted, fontSize: 13, marginBottom: 20 },
  statsGrid: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statCard: { flex: 1, backgroundColor: C.surface, borderRadius: 14, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: C.border },
  statEmoji: { fontSize: 20, marginBottom: 4 },
  statVal: { fontSize: 18, fontWeight: '900', color: C.accent },
  statLabel: { fontSize: 10, color: C.muted, textAlign: 'center' },
  filters: { marginBottom: 16 },
  filterPill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border },
  filterPillActive: { backgroundColor: C.accent, borderColor: C.accent },
  filterText: { fontSize: 13, fontWeight: '600', color: C.muted },
  filterTextActive: { color: 'white' },
  bookRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.surface, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: C.border },
  bookCover: { width: 50, height: 66, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  bookEmoji: { fontSize: 22 },
  bookTitle: { fontSize: 14, fontWeight: '700', color: 'white', marginBottom: 2 },
  bookAuthor: { fontSize: 12, color: C.muted, marginBottom: 8 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  progressTrack: { flex: 1, height: 5, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },
  progressPct: { fontSize: 11, color: C.muted },
  notStarted: { fontSize: 11, color: C.muted },
  statusBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  statusText: { fontSize: 11, fontWeight: '700' },
});
