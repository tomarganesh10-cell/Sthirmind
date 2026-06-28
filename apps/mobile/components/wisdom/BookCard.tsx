import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { C, PILLAR_COLOR } from '@/lib/colors';

interface Book {
  id: string;
  emoji?: string;
  title: string;
  author: string;
  category?: string;
  pillar?: string;
  rating?: number;
  readTimeMin?: number;
}

interface Props {
  book: Book;
  variant: 'featured' | 'grid';
  onPress: () => void;
}

export function BookCard({ book, variant, onPress }: Props) {
  const color = book.pillar ? (PILLAR_COLOR[book.pillar] ?? C.accent) : C.accent;

  if (variant === 'featured') {
    return (
      <TouchableOpacity style={[styles.featured, { borderColor: color + '30' }]} onPress={onPress} activeOpacity={0.85}>
        <View style={[styles.featuredCover, { backgroundColor: color + '20' }]}>
          <Text style={styles.featuredEmoji}>{book.emoji ?? '📖'}</Text>
        </View>
        <Text style={[styles.catLabel, { color }]}>{book.category ?? 'BOOK'}</Text>
        <Text style={styles.featuredTitle} numberOfLines={2}>{book.title}</Text>
        <Text style={styles.featuredAuthor} numberOfLines={1}>{book.author}</Text>
        <View style={styles.featuredMeta}>
          <Text style={styles.metaText}>★ {book.rating ?? 4.5}</Text>
          <Text style={styles.metaDot}>·</Text>
          <Text style={styles.metaText}>{book.readTimeMin ?? 5} min</Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={styles.grid} onPress={onPress} activeOpacity={0.85}>
      <View style={[styles.gridCover, { backgroundColor: color + '22' }]}>
        <Text style={styles.gridEmoji}>{book.emoji ?? '📖'}</Text>
      </View>
      <Text style={[styles.gridCat, { color }]}>{(book.category ?? 'BOOK').slice(0, 10)}</Text>
      <Text style={styles.gridTitle} numberOfLines={2}>{book.title}</Text>
      <Text style={styles.gridAuthor} numberOfLines={1}>{book.author}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  featured: { width: 160, backgroundColor: C.surface, borderRadius: 16, padding: 14, borderWidth: 1 },
  featuredCover: { height: 80, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  featuredEmoji: { fontSize: 32 },
  catLabel: { fontSize: 10, fontWeight: '700', marginBottom: 4 },
  featuredTitle: { fontSize: 14, fontWeight: '800', color: 'white', lineHeight: 18, marginBottom: 3 },
  featuredAuthor: { fontSize: 11, color: C.muted, marginBottom: 8 },
  featuredMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 11, color: '#FFD700' },
  metaDot: { fontSize: 11, color: C.muted },
  grid: { width: '47%', backgroundColor: C.surface, borderRadius: 14, padding: 12, borderWidth: 1, borderColor: C.border },
  gridCover: { height: 60, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  gridEmoji: { fontSize: 26 },
  gridCat: { fontSize: 9, fontWeight: '700', marginBottom: 3 },
  gridTitle: { fontSize: 13, fontWeight: '700', color: 'white', lineHeight: 16, marginBottom: 2 },
  gridAuthor: { fontSize: 11, color: C.muted },
});
