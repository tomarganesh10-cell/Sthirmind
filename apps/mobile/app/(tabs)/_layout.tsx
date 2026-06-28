import { Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { C } from '@/lib/colors';

function TabIcon({ emoji, label, focused }: { emoji: string; label: string; focused: boolean }) {
  return (
    <View style={styles.tabItem}>
      <Text style={[styles.tabEmoji, focused && styles.tabEmojiFocused]}>{emoji}</Text>
      <Text style={[styles.tabLabel, focused && styles.tabLabelFocused]}>{label}</Text>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0F1E2E',
          borderTopColor: 'rgba(255,255,255,0.06)',
          borderTopWidth: 1,
          height: 72,
          paddingBottom: 8,
        },
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen name="index" options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="📚" label="Wisdom" focused={focused} /> }} />
      <Tabs.Screen name="library" options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="🗂" label="Library" focused={focused} /> }} />
      <Tabs.Screen name="daily" options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="✨" label="Daily" focused={focused} /> }} />
      <Tabs.Screen name="vault" options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="🔐" label="Vault" focused={focused} /> }} />
      <Tabs.Screen name="analytics" options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="📊" label="Stats" focused={focused} /> }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabItem: { alignItems: 'center', justifyContent: 'center', gap: 2 },
  tabEmoji: { fontSize: 22, opacity: 0.4 },
  tabEmojiFocused: { opacity: 1 },
  tabLabel: { fontSize: 10, color: C.muted, fontWeight: '600' },
  tabLabelFocused: { color: C.accent },
});
