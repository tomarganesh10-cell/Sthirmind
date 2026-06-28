import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Text as SvgText } from 'react-native-svg';
import { C } from '@/lib/colors';

const SCORES = [
  { label: 'Wisdom Score', value: 78, color: C.accent, desc: 'Overall growth' },
  { label: 'Knowledge', value: 82, color: '#4CAF50', desc: 'Books + notes + chat' },
  { label: 'Consistency', value: 71, color: '#2196F3', desc: 'Streak + daily wisdom' },
];

const STATS = [
  ['📚', '12', 'Books Read', 'this month'],
  ['🎧', '28h', 'Listened', 'via ElevenLabs'],
  ['🔥', '14d', 'Streak', 'keep going!'],
  ['📝', '47', 'Notes', 'in your vault'],
  ['💬', '23', 'Chats', 'with books'],
  ['✨', '30', 'Daily Reads', 'this month'],
];

const HISTORY = [
  { week: 'Jun 22', wisdom: 74, knowledge: 78, consistency: 65 },
  { week: 'Jun 15', wisdom: 70, knowledge: 74, consistency: 60 },
  { week: 'Jun 8', wisdom: 65, knowledge: 68, consistency: 55 },
  { week: 'Jun 1', wisdom: 58, knowledge: 62, consistency: 48 },
];

function ScoreRing({ score, color, label, desc }: { score: number; color: string; label: string; desc: string }) {
  const r = 46;
  const circ = 2 * Math.PI * r;
  const filled = circ * (score / 100);
  const gap = circ - filled;
  return (
    <View style={styles.ringCard}>
      <Svg width={110} height={110} style={{ marginBottom: 8 }}>
        <Circle cx={55} cy={55} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={8} />
        <Circle cx={55} cy={55} r={r} fill="none" stroke={color} strokeWidth={8}
          strokeDasharray={`${filled} ${gap}`} strokeLinecap="round"
          transform="rotate(-90 55 55)" />
        <SvgText x={55} y={62} textAnchor="middle" fill="white" fontSize={22} fontWeight="900">{score}</SvgText>
      </Svg>
      <Text style={styles.ringLabel}>{label}</Text>
      <Text style={styles.ringDesc}>{desc}</Text>
    </View>
  );
}

export default function Analytics() {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Wisdom Analytics</Text>
        <Text style={styles.sub}>Your learning journey this month</Text>

        {/* Score Rings */}
        <View style={styles.ringsRow}>
          {SCORES.map(s => <ScoreRing key={s.label} score={s.value} color={s.color} label={s.label} desc={s.desc} />)}
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          {STATS.map(([e, v, l, sub]) => (
            <View key={l} style={styles.statCard}>
              <Text style={styles.statEmoji}>{e}</Text>
              <Text style={styles.statVal}>{v}</Text>
              <Text style={styles.statLabel}>{l}</Text>
              <Text style={styles.statSub}>{sub}</Text>
            </View>
          ))}
        </View>

        {/* Weekly Progress */}
        <View style={styles.historyCard}>
          <Text style={styles.historyTitle}>📈 Weekly Progress</Text>
          <View style={styles.historyLegend}>
            {[['Wisdom', C.accent], ['Knowledge', '#4CAF50'], ['Consistency', '#2196F3']].map(([l, c]) => (
              <View key={l} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: c as string }]} />
                <Text style={styles.legendText}>{l}</Text>
              </View>
            ))}
          </View>
          {HISTORY.map(row => (
            <View key={row.week} style={styles.historyRow}>
              <Text style={styles.historyWeek}>{row.week}</Text>
              <View style={styles.historyBars}>
                {[{ v: row.wisdom, c: C.accent }, { v: row.knowledge, c: '#4CAF50' }, { v: row.consistency, c: '#2196F3' }].map(({ v, c }, i) => (
                  <View key={i} style={styles.historyBarWrap}>
                    <View style={[styles.historyBar, { width: `${v}%`, backgroundColor: c }]} />
                    <Text style={styles.historyVal}>{v}</Text>
                  </View>
                ))}
              </View>
            </View>
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  content: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: '900', color: 'white', marginBottom: 4 },
  sub: { fontSize: 13, color: C.muted, marginBottom: 20 },
  ringsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  ringCard: { flex: 1, backgroundColor: C.surface, borderRadius: 16, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: C.border },
  ringLabel: { fontSize: 12, fontWeight: '800', color: 'white', textAlign: 'center' },
  ringDesc: { fontSize: 10, color: C.muted, textAlign: 'center', marginTop: 2 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  statCard: { width: '30%', flexGrow: 1, backgroundColor: C.surface, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: C.border },
  statEmoji: { fontSize: 22, marginBottom: 6 },
  statVal: { fontSize: 20, fontWeight: '900', color: C.accent },
  statLabel: { fontSize: 12, fontWeight: '700', color: 'white', marginTop: 2 },
  statSub: { fontSize: 10, color: C.muted, marginTop: 1 },
  historyCard: { backgroundColor: C.surface, borderRadius: 16, padding: 18, borderWidth: 1, borderColor: C.border },
  historyTitle: { fontSize: 15, fontWeight: '800', color: 'white', marginBottom: 12 },
  historyLegend: { flexDirection: 'row', gap: 16, marginBottom: 16 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11, color: C.muted },
  historyRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  historyWeek: { fontSize: 11, color: C.muted, width: 44 },
  historyBars: { flex: 1, gap: 4 },
  historyBarWrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  historyBar: { height: 6, borderRadius: 3 },
  historyVal: { fontSize: 10, color: C.muted, width: 24 },
});
