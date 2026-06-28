import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { C } from '@/lib/colors';

interface Props {
  quote: string;
  author: string;
  onPress: () => void;
}

export function DailyWisdomBanner({ quote, author, onPress }: Props) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.88} style={styles.wrapper}>
      <LinearGradient colors={['#1B3A6B', '#2D1B6B']} style={styles.gradient}>
        <View style={styles.topRow}>
          <Text style={styles.label}>✨ Today's Wisdom</Text>
          <Text style={styles.cta}>Reflect →</Text>
        </View>
        <Text style={styles.quote} numberOfLines={3}>{quote}</Text>
        <Text style={styles.author}>— {author}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginHorizontal: 20, marginTop: 8, borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: C.accent + '30' },
  gradient: { padding: 18 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  label: { fontSize: 11, fontWeight: '700', color: C.accent, textTransform: 'uppercase', letterSpacing: 0.8 },
  cta: { fontSize: 12, color: C.accent, fontWeight: '600' },
  quote: { fontSize: 14, color: 'rgba(255,255,255,0.88)', fontStyle: 'italic', lineHeight: 22, marginBottom: 8 },
  author: { fontSize: 12, color: C.muted },
});
