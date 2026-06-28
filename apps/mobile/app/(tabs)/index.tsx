import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { api } from '@/lib/api';
import { C } from '@/lib/colors';
import { BookCard } from '@/components/wisdom/BookCard';
import { DailyWisdomBanner } from '@/components/wisdom/DailyWisdomBanner';

const CATEGORIES = ['All', '🚀 Startup', '👑 Leader', '🌿 Impact', '🧘 Mind', '⭐ AI Picks'];

export default function WisdomHome() {
  const { data: books = [] } = useQuery({
    queryKey: ['wisdom-books'],
    queryFn: () => api.get('/wisdom/books').then(r => r.data ?? []),
  });

  const { data: daily } = useQuery({
    queryKey: ['daily-wisdom'],
    queryFn: () => api.get('/wisdom/daily').then(r => r.data),
  });

  const DEMO_BOOKS = [
    { id: '1', emoji: '🚀', title: 'Zero to One', author: 'Peter Thiel', category: 'ENTREPRENEURSHIP', pillar: 'HOPE', rating: 4.8, readTimeMin: 5 },
    { id: '2', emoji: '⚛️', title: 'Atomic Habits', author: 'James Clear', category: 'MINDFULNESS', pillar: 'HEALTH', rating: 4.9, readTimeMin: 5 },
    { id: '3', emoji: '🌸', title: 'Ikigai', author: 'Héctor García', category: 'MINDFULNESS', pillar: 'HEART', rating: 4.7, readTimeMin: 5 },
    { id: '4', emoji: '🏔️', title: 'Shoe Dog', author: 'Phil Knight', category: 'ENTREPRENEURSHIP', pillar: 'HOPE', rating: 4.8, readTimeMin: 8 },
    { id: '5', emoji: '🧠', title: 'Principles', author: 'Ray Dalio', category: 'LEADERSHIP', pillar: 'HELP', rating: 4.6, readTimeMin: 12 },
    { id: '6', emoji: '🔥', title: 'Leaders Eat Last', author: 'Simon Sinek', category: 'LEADERSHIP', pillar: 'HELP', rating: 4.7, readTimeMin: 6 },
    { id: '7', emoji: '💡', title: 'The Lean Startup', author: 'Eric Ries', category: 'ENTREPRENEURSHIP', pillar: 'HOPE', rating: 4.5, readTimeMin: 6 },
    { id: '8', emoji: '🧘', title: 'The Power of Now', author: 'Eckhart Tolle', category: 'MINDFULNESS', pillar: 'HEART', rating: 4.6, readTimeMin: 7 },
  ];

  const displayBooks = books.length > 0 ? books : DEMO_BOOKS;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Header */}
        <LinearGradient colors={['#1B3A6B', '#0D1B2A']} style={styles.hero}>
          <View style={styles.heroTop}>
            <Text style={styles.logo}>🧘 SthirMind</Text>
            <View style={styles.avatarCircle}><Text style={styles.avatarText}>A</Text></View>
          </View>
          <Text style={styles.heroTitle}>Wisdom Library</Text>
          <Text style={styles.heroSub}>45 books · AI summaries · Human voice</Text>

          {/* Search */}
          <View style={styles.searchBox}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              placeholder="Search books, ideas…"
              placeholderTextColor={C.muted}
              style={styles.searchInput}
            />
          </View>
        </LinearGradient>

        {/* Category pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillRow} contentContainerStyle={styles.pillContent}>
          {CATEGORIES.map((cat, i) => (
            <TouchableOpacity key={cat} style={[styles.pill, i === 0 && styles.pillActive]}>
              <Text style={[styles.pillText, i === 0 && styles.pillTextActive]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Daily Wisdom Banner */}
        <DailyWisdomBanner
          quote={daily?.quote ?? '"Do not seek to have everything happen as you wish, but wish for everything to happen as it actually does."'}
          author={daily?.bookTitle ?? 'Ikigai'}
          onPress={() => router.push('/(tabs)/daily')}
        />

        {/* AI Picks */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>✨ AI Picks For You</Text>
            <Text style={styles.sectionLink}>See all</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingRight: 20 }}>
            {displayBooks.slice(0, 5).map(book => (
              <BookCard key={book.id} book={book} variant="featured" onPress={() => router.push(`/wisdom/${book.id}`)} />
            ))}
          </ScrollView>
        </View>

        {/* All Books */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📚 All 45 Books</Text>
          <View style={styles.booksGrid}>
            {displayBooks.map(book => (
              <BookCard key={book.id} book={book} variant="grid" onPress={() => router.push(`/wisdom/${book.id}`)} />
            ))}
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  scroll: { paddingBottom: 32 },
  hero: { padding: 20, paddingBottom: 24 },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  logo: { fontSize: 18, fontWeight: '900', color: C.accent },
  avatarCircle: { width: 34, height: 34, borderRadius: 17, backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: 'white', fontWeight: '700', fontSize: 14 },
  heroTitle: { fontSize: 26, fontWeight: '900', color: 'white', marginBottom: 4 },
  heroSub: { fontSize: 13, color: C.muted, marginBottom: 16 },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1, borderColor: C.border },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, color: 'white', fontSize: 14 },
  pillRow: { marginTop: 4 },
  pillContent: { paddingHorizontal: 20, paddingVertical: 12, gap: 8 },
  pill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border },
  pillActive: { backgroundColor: C.accent, borderColor: C.accent },
  pillText: { fontSize: 13, fontWeight: '600', color: C.muted },
  pillTextActive: { color: 'white' },
  section: { paddingHorizontal: 20, marginTop: 28 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: 'white' },
  sectionLink: { fontSize: 13, color: C.accent },
  booksGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
});
