import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { C } from '@/lib/colors';
import * as Haptics from 'expo-haptics';

const DEMO = {
  quote: '"The impediment to action advances action. What stands in the way becomes the way."',
  author: 'Marcus Aurelius',
  bookTitle: 'Meditations',
  insight: 'The Stoics understood that adversity is not merely something to be overcome — it is the very material from which strength is forged. Every obstacle you face is a hidden teacher. The question is not "why is this happening to me?" but "what is this teaching me?"',
  reflectionQuestion: 'What current obstacle in your life might actually be pointing you toward your real path?',
};

export default function DailyWisdom() {
  const [reflection, setReflection] = useState('');
  const [read, setRead] = useState(false);
  const [saved, setSaved] = useState(false);

  const { data: daily } = useQuery({ queryKey: ['daily-wisdom'], queryFn: () => api.get('/wisdom/daily').then(r => r.data), placeholderData: DEMO });
  const d = daily ?? DEMO;

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  const markRead = () => { setRead(true); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); };
  const saveVault = () => { setSaved(true); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.date}>{today}</Text>
        <Text style={styles.heading}>Today's Wisdom</Text>

        {/* Quote */}
        <LinearGradient colors={['#1B3A6B33', '#2D1B6B33']} style={styles.quoteCard}>
          <Text style={styles.openQuote}>"</Text>
          <Text style={styles.quote}>{d.quote}</Text>
          <View style={styles.quoteDivider} />
          <Text style={styles.quoteAuthor}>{d.author}</Text>
          <Text style={styles.quoteBook}>{d.bookTitle} · Mindfulness</Text>
        </LinearGradient>

        {/* AI Insight */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>✨ AI Insight</Text>
          <Text style={styles.cardText}>{d.insight}</Text>
        </View>

        {/* Reflection */}
        <View style={[styles.card, styles.reflectionCard]}>
          <Text style={[styles.cardLabel, { color: '#9C27B0' }]}>🌿 Reflection</Text>
          <Text style={styles.reflectionQ}>{d.reflectionQuestion}</Text>
          <TextInput
            value={reflection}
            onChangeText={setReflection}
            placeholder="Write your reflection here…"
            placeholderTextColor={C.muted}
            style={styles.reflectionInput}
            multiline
            numberOfLines={4}
          />
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity style={[styles.actionBtn, styles.actionPrimary, read && styles.actionDone]} onPress={markRead}>
            <Text style={styles.actionPrimaryText}>{read ? '✓ Read' : '✓ Mark as Read'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, styles.actionGhost, saved && { borderColor: C.accent }]} onPress={saveVault}>
            <Text style={styles.actionGhostText}>{saved ? '★ Saved' : '💡 Save to Vault'}</Text>
          </TouchableOpacity>
        </View>

        {/* Streak info */}
        <View style={styles.streakCard}>
          <Text style={styles.streakEmoji}>🔥</Text>
          <View>
            <Text style={styles.streakVal}>14 day streak</Text>
            <Text style={styles.streakSub}>Come back tomorrow to keep it going</Text>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  content: { padding: 20, paddingBottom: 40 },
  date: { fontSize: 12, fontWeight: '700', color: C.accent, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  heading: { fontSize: 26, fontWeight: '900', color: 'white', marginBottom: 20 },
  quoteCard: { borderRadius: 20, padding: 24, marginBottom: 16, borderWidth: 1, borderColor: C.accent + '25' },
  openQuote: { fontSize: 44, color: C.accent, opacity: 0.4, lineHeight: 44, marginBottom: 4 },
  quote: { fontSize: 17, fontStyle: 'italic', color: 'rgba(255,255,255,0.9)', lineHeight: 26, marginBottom: 16, fontWeight: '600' },
  quoteDivider: { width: 40, height: 2, backgroundColor: C.accent, marginBottom: 12 },
  quoteAuthor: { fontSize: 14, fontWeight: '700', color: 'white' },
  quoteBook: { fontSize: 12, color: C.muted, marginTop: 2 },
  card: { backgroundColor: C.surface, borderRadius: 16, padding: 18, marginBottom: 14, borderWidth: 1, borderColor: C.border },
  cardLabel: { fontSize: 11, fontWeight: '700', color: C.accent, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 },
  cardText: { fontSize: 14, color: 'rgba(255,255,255,0.8)', lineHeight: 22 },
  reflectionCard: { borderColor: '#9C27B030' },
  reflectionQ: { fontSize: 15, fontWeight: '600', color: 'white', marginBottom: 14, lineHeight: 22 },
  reflectionInput: { backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: C.border, borderRadius: 10, padding: 12, fontSize: 14, color: 'white', minHeight: 90, textAlignVertical: 'top' },
  actions: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  actionBtn: { flex: 1, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  actionPrimary: { backgroundColor: C.accent },
  actionDone: { backgroundColor: '#4CAF50' },
  actionPrimaryText: { color: 'white', fontWeight: '700', fontSize: 14 },
  actionGhost: { borderWidth: 1, borderColor: C.border, backgroundColor: 'transparent' },
  actionGhostText: { color: 'white', fontWeight: '600', fontSize: 14 },
  streakCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.surface, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: 'rgba(244,162,97,0.2)' },
  streakEmoji: { fontSize: 28 },
  streakVal: { fontSize: 15, fontWeight: '800', color: 'white' },
  streakSub: { fontSize: 12, color: C.muted, marginTop: 2 },
});
