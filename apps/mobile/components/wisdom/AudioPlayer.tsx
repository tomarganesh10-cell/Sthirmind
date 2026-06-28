import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { useEffect, useRef, useState } from 'react';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { C } from '@/lib/colors';

interface Props {
  audioUrl: string;
  durationSec: number;
  title: string;
}

const SPEEDS = [0.75, 1.0, 1.25, 1.5, 2.0];
const BAR_COUNT = 36;

export function AudioPlayer({ audioUrl, durationSec, title }: Props) {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [playing, setPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [speed, setSpeed] = useState(1.0);
  const [loaded, setLoaded] = useState(false);
  const barAnims = useRef(Array.from({ length: BAR_COUNT }, () => new Animated.Value(0.15))).current;
  const animLoopRef = useRef<any>(null);

  useEffect(() => {
    Audio.setAudioModeAsync({ playsInSilentModeIOS: true, staysActiveInBackground: true });
    return () => { sound?.unloadAsync(); };
  }, []);

  const loadAndPlay = async () => {
    if (!sound) {
      const { sound: s } = await Audio.Sound.createAsync(
        { uri: audioUrl },
        { shouldPlay: true, rate: speed, volume: 1.0 },
        (status) => {
          if (status.isLoaded) {
            setLoaded(true);
            setPosition(status.positionMillis / 1000);
            if (status.didJustFinish) { setPlaying(false); stopWaveAnimation(); }
          }
        }
      );
      setSound(s);
      setPlaying(true);
      startWaveAnimation();
    } else {
      if (playing) {
        await sound.pauseAsync();
        setPlaying(false);
        stopWaveAnimation();
      } else {
        await sound.playAsync();
        setPlaying(true);
        startWaveAnimation();
      }
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const startWaveAnimation = () => {
    const animate = () => {
      const animations = barAnims.map(anim =>
        Animated.timing(anim, {
          toValue: 0.15 + Math.random() * 0.85,
          duration: 80 + Math.random() * 120,
          useNativeDriver: false,
        })
      );
      Animated.parallel(animations).start(() => {
        if (animLoopRef.current !== null) animate();
      });
    };
    animLoopRef.current = true;
    animate();
  };

  const stopWaveAnimation = () => {
    animLoopRef.current = null;
    barAnims.forEach(anim => Animated.timing(anim, { toValue: 0.15, duration: 300, useNativeDriver: false }).start());
  };

  const skip = async (sec: number) => {
    if (!sound) return;
    const status = await sound.getStatusAsync();
    if (status.isLoaded) {
      await sound.setPositionAsync(Math.max(0, (status.positionMillis + sec * 1000)));
    }
  };

  const setPlaybackSpeed = async (s: number) => {
    setSpeed(s);
    if (sound) await sound.setRateAsync(s, true);
    Haptics.selectionAsync();
  };

  const progress = durationSec > 0 ? position / durationSec : 0;
  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

  return (
    <View style={styles.container}>
      {/* Ambient glow when playing */}
      {playing && <View style={styles.glow} />}

      {/* Voice label */}
      <View style={styles.voiceRow}>
        <View style={[styles.voiceIcon, playing && styles.voiceIconActive]}>
          <Text style={styles.voiceEmoji}>🎙️</Text>
        </View>
        <View>
          <Text style={styles.voiceName}>Rachel</Text>
          <Text style={styles.voiceStyle}>Human AI · ElevenLabs</Text>
        </View>
        <View style={styles.statusRow}>
          <View style={[styles.dot, playing && styles.dotPlaying]} />
          <Text style={styles.statusText}>{playing ? 'Playing' : loaded ? 'Ready' : 'Load'}</Text>
        </View>
      </View>

      <Text style={styles.trackTitle} numberOfLines={1}>{title}</Text>

      {/* Waveform */}
      <View style={styles.waveform}>
        {barAnims.map((anim, i) => {
          const past = i / BAR_COUNT <= progress;
          return (
            <Animated.View
              key={i}
              style={[
                styles.bar,
                {
                  height: anim.interpolate({ inputRange: [0, 1], outputRange: ['6%', '100%'] }),
                  backgroundColor: past ? C.accent : 'rgba(139,155,180,0.2)',
                },
              ]}
            />
          );
        })}
      </View>

      {/* Progress */}
      <View style={styles.progressWrap}>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>
        <View style={styles.timeRow}>
          <Text style={styles.timeText}>{fmt(position)}</Text>
          <Text style={styles.timeText}>{fmt(durationSec)}</Text>
        </View>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity onPress={() => skip(-15)} style={styles.skipBtn}>
          <Text style={styles.skipText}>↩15</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={loadAndPlay} style={styles.playBtn} activeOpacity={0.85}>
          <Text style={styles.playIcon}>{playing ? '⏸' : '▶'}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => skip(15)} style={styles.skipBtn}>
          <Text style={styles.skipText}>15↪</Text>
        </TouchableOpacity>
      </View>

      {/* Speed */}
      <View style={styles.speedRow}>
        {SPEEDS.map(s => (
          <TouchableOpacity key={s} onPress={() => setPlaybackSpeed(s)} style={[styles.speedBtn, speed === s && styles.speedBtnActive]}>
            <Text style={[styles.speedText, speed === s && styles.speedTextActive]}>{s}x</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#0D1B2A', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  glow: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 120, backgroundColor: C.accent, opacity: 0.05, borderRadius: 60 },
  voiceRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  voiceIcon: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(244,162,97,0.1)', alignItems: 'center', justifyContent: 'center' },
  voiceIconActive: { backgroundColor: 'rgba(244,162,97,0.2)', shadowColor: C.accent, shadowOpacity: 0.5, shadowRadius: 8, elevation: 4 },
  voiceEmoji: { fontSize: 18 },
  voiceName: { fontSize: 14, fontWeight: '700', color: 'white' },
  voiceStyle: { fontSize: 11, color: C.muted },
  statusRow: { marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.2)' },
  dotPlaying: { backgroundColor: '#4ade80', shadowColor: '#4ade80', shadowOpacity: 0.8, shadowRadius: 4, elevation: 2 },
  statusText: { fontSize: 11, color: C.muted },
  trackTitle: { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 16 },
  waveform: { flexDirection: 'row', alignItems: 'center', gap: 2, height: 56, marginBottom: 14 },
  bar: { flex: 1, borderRadius: 3, minHeight: 3 },
  progressWrap: { marginBottom: 18 },
  progressTrack: { height: 5, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 5, overflow: 'hidden', marginBottom: 6 },
  progressFill: { height: '100%', backgroundColor: C.accent, borderRadius: 5 },
  timeRow: { flexDirection: 'row', justifyContent: 'space-between' },
  timeText: { fontSize: 11, color: C.muted, fontVariant: ['tabular-nums'] },
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 24, marginBottom: 18 },
  skipBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center' },
  skipText: { fontSize: 11, fontWeight: '700', color: C.muted },
  playBtn: { width: 60, height: 60, borderRadius: 30, backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center', shadowColor: C.accent, shadowOpacity: 0.6, shadowRadius: 16, elevation: 8 },
  playIcon: { fontSize: 22, color: 'white' },
  speedRow: { flexDirection: 'row', justifyContent: 'center', gap: 6 },
  speedBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  speedBtnActive: { backgroundColor: C.accent },
  speedText: { fontSize: 12, fontWeight: '600', color: C.muted },
  speedTextActive: { color: 'white' },
});
